import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  CategoryRequestDto,
  CategoryResponseDto,
  Category,
} from "../models/category.model";
import { ResponseDataDto } from "../models/responses.model";
import { BehaviorSubject, map, Observable, tap, of } from "rxjs";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private baseBackendUrl: string;
  private getCategoriesUrl: string;
  private readonly STORAGE_KEY = "categories";
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.baseBackendUrl = `${environment.apiBaseUrl}/categories/`;
    this.getCategoriesUrl = this.baseBackendUrl + "getCategories";
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this.categoriesSubject.next(JSON.parse(raw));
      }
    } catch {
      // ignore storage errors
    }
  }

  getCategories(
    rootId?: string,
    leafId?: string
  ): Observable<ResponseDataDto<Category[]>> {
    if (!rootId && !leafId) {
      const cached = this.getCached();
      if (cached.length) {
        return of({ data: cached } as ResponseDataDto<CategoryResponseDto[]>);
      }
    }

    const request: CategoryRequestDto = { rootId, leafId };

    return this.http
      .post<ResponseDataDto<CategoryResponseDto[]>>(this.getCategoriesUrl, request)
      .pipe(
        tap((res) => {
          if (!rootId && !leafId) {
            const list = res.data ?? [];
            this.categoriesSubject.next(list);
            try {
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
            } catch {
              // ignore
            }
          }
        })
      );
  }

  loadCategories(rootId?: string, leafId?: string): Observable<Category[]> {
    if (!rootId && !leafId) {
      const cached = this.getCached();
      if (cached.length) {
        return of(cached);
      }
    }

    return this.http
      .post<ResponseDataDto<Category[]>>(this.getCategoriesUrl, { rootId, leafId })
      .pipe(
        map((r) => r.data ?? []),
        tap((list) => {
          this.categoriesSubject.next(list);
          if (!rootId && !leafId) {
            try {
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
            } catch {
              // ignore storage errors
            }
          }
        })
      );
  }

  getCached(): Category[] {
    return this.categoriesSubject.getValue();
  }

  getNameById(id: string): string | null {
    const found = this.getCached().find((c) => c.id === id);
    return found ? found.name : null;
  }

  getByPrefix(prefix: string): Category[] {
    const all = this.getCached();

    return all.filter((c) => {
      // 1) empieza con el prefijo
      if (!c.id.startsWith(prefix)) {
        return false;
      }

      // 2) toma la parte que queda y verifica que no contenga '>'
      const rest = c.id.slice(prefix.length); // <- lo que sigue al prefijo
      return rest !== "" && !rest.includes(">"); // hijos directos solamente
    });
  }
}
