import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { CountryResponseDto, Country } from "../models/country.model";
import { BehaviorSubject, map, Observable, tap, of } from "rxjs";
import { ResponseDataDto } from "../models/responses.model";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class CountryService {
  private baseBackendUrl: string;
  private getCountriesUrl: string;
  private readonly STORAGE_KEY = "countries";
  private countriesSubject = new BehaviorSubject<Country[]>([]);
  readonly countries$ = this.countriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.baseBackendUrl = `${environment.apiBaseUrl}/countries/`;
    this.getCountriesUrl = this.baseBackendUrl + "getCountries";
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this.countriesSubject.next(JSON.parse(raw));
      }
    } catch {
      // ignore storage errors
    }
  }

  getCountries(): Observable<ResponseDataDto<CountryResponseDto[]>> {
    const cached = this.getCached();
    if (cached.length) {
      return of({ data: cached } as ResponseDataDto<CountryResponseDto[]>);
    }

    return this.http
      .post<ResponseDataDto<CountryResponseDto[]>>(this.getCountriesUrl, {})
      .pipe(
        tap((res) => {
          const list = res.data ?? [];
          this.countriesSubject.next(list);
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
          } catch {
            // ignore
          }
        })
      );
  }

  loadCountries(): Observable<Country[]> {
    const cached = this.getCached();
    if (cached.length) {
      return of(cached);
    }

    return this.http
      .post<ResponseDataDto<CountryResponseDto[]>>(this.getCountriesUrl, {})
      .pipe(
        map((res) => res.data ?? []),
        tap((list) => {
          this.countriesSubject.next(list);
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
          } catch {
            // ignore storage errors
          }
        })
      );
  }

  /** Devuelve la lista cacheada (puede estar vacía si no se ha llamado a loadCountries) */
  getCached(): Country[] {
    return this.countriesSubject.getValue();
  }

  getNameById(id: number): string | null {
    const found = this.getCached().find((c) => c.id === id);
    return found ? found.name : null;
  }
}
