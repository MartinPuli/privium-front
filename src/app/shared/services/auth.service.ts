import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  BehaviorSubject,
  catchError,
  lastValueFrom,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from "rxjs";
import { Router } from "@angular/router";
import {
  User,
  UserRequestDto,
  LoginRequest,
  RegisterRequest,
  VerificationRequest,
} from "../models/user.model";
import { ResponseDto, AuthResponse } from "../models/responses.model";
import { ResponseDataDto } from "../models/responses.model";
import { CategoryService } from "./category.service";
import { CountryService } from "./country.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly API_URL = "http://localhost:8080/api/privium/auth";
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private categoryService: CategoryService,
    private countryService: CountryService
  ) {
    this.loadUserFromStorage();
  }

  /* --------------------------- AUTENTICACIÓN --------------------------- */

  login(credentials: LoginRequest): Observable<ResponseDataDto<any>> {
    return this.http
      .post<ResponseDataDto<any>>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap((res) => {
          const jwt =
            typeof res.data === "string"
              ? res.data
              : res.data?.token
              ? res.data.token
              : (res as any).token
              ? (res as any).token
              : null;

          if (jwt) this.setSession(jwt);
        }),
        // Después del login, cargamos categorías y países en paralelo
        switchMap((res) =>
          this.categoryService.loadCategories().pipe(
            switchMap(() => this.countryService.loadCountries()),
            map(() => res)
          )
        )
      );
  }

  register(userData: RegisterRequest): Observable<ResponseDataDto> {
    console.log("A");
    return this.http.post<ResponseDataDto>(
      `${this.API_URL}/register`,
      userData
    );
  }

  verifyEmail(token: string): Observable<ResponseDataDto> {
    return this.http.post<ResponseDataDto>(`${this.API_URL}/verifyEmail`, {
      token,
    });
  }
  /* --------------------------- CONTRASEÑA ----------------------------- */

  resetPassword(email: string): Observable<ResponseDataDto> {
    return this.http.post<ResponseDataDto>(`${this.API_URL}/resetToken`, {
      email,
    });
  }

  updatePassword(
    token: string,
    newPassword: string
  ): Observable<ResponseDataDto> {
    const body: UserRequestDto = { token, newPassword };
    return this.http.post<ResponseDataDto>(
      `${this.API_URL}/updatePassword`,
      body
    );
  }

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    this.currentUserSubject.next(null);
    this.router.navigate(["/auth/login"]);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    const userId = localStorage.getItem("userId");
    return userId ? Number.parseInt(userId, 10) : null;
  }

  getCurrentCountryId(): number | null {
    // 1) Toma el valor del BehaviorSubject (usuario en memoria)
    const user = this.currentUserSubject.value;
    if (user?.countryId !== undefined && user?.countryId !== null) {
      return user.countryId;
    }

    // 2) Fallback: lee el objeto user en localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        return parsed.countryId ?? null;
      } catch {
        // Si hay algún problema parseando, lo ignoramos
      }
    }

    return null; // No disponible
  }

  private setSession(token: string): void {
    localStorage.setItem("token", token);

    const userInfo = this.decodeToken(token);
    if (userInfo) {
      localStorage.setItem("user", JSON.stringify(userInfo));
      localStorage.setItem("userId", userInfo.id.toString());
      this.currentUserSubject.next(userInfo);
    }
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error("Error parsing user from storage:", error);
        this.logout();
      }
    }
  }

  loadInitialData(): Promise<void> {
    if (!this.isAuthenticated()) {
      return Promise.resolve();
    }
    // Convertimos el flujo a Promise para APP_INITIALIZER
    return lastValueFrom(
      this.categoryService.loadCategories().pipe(
        switchMap(() => this.countryService.loadCountries()),
        map(() => void 0),
        catchError((err) => {
          console.error("Error cargando catálogos:", err);
          return of(void 0);
        })
      )
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(this.decodeBase64(token.split(".")[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  private decodeBase64(b64: string): string {
    const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  }

  private decodeToken(token: string): User | null {
    try {
      const payload = JSON.parse(this.decodeBase64(token.split(".")[1]));
      return {
        id: payload.userId || payload.sub || payload.id,
        name: payload.name || payload.username,
        lastname: payload.lastname || "",
        email: payload.email,
        verifiedEmail: payload.verifiedEmail || false,
        verifiedResidence: payload.verifiedResidence || false,
        status: payload.status || 1,
        createdAt: payload.createdAt || new Date().toISOString(),
        dni: payload.dni,
        contactPhone: payload.contactPhone,
        countryId: payload.countryId,
        profilePicture: payload.profilePicture,
        role: payload.role || "USER",
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }
}
