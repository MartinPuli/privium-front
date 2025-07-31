import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  CategoryRequestDto,
  CategoryResponseDto,
  Category,
} from "../models/category.model";
import { ResponseDataDto } from "../models/responses.model";
import { BehaviorSubject, map, Observable, tap } from "rxjs";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private baseBackendUrl: string;
  private getCategoriesUrl: string;

  constructor(private http: HttpClient) {
    this.baseBackendUrl = `${environment.apiBaseUrl}/categories/`;
    this.getCategoriesUrl = this.baseBackendUrl + "getCategories";
  }

  getCategories(
    rootId?: string,
    leafId?: string
  ): Observable<ResponseDataDto<Category[]>> {
    const request: CategoryRequestDto = {
      rootId,
      leafId,
    };

    return this.http.post<ResponseDataDto<CategoryResponseDto[]>>(
      this.getCategoriesUrl,
      request
    );
  }

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  loadCategories(rootId?: string, leafId?: string): Observable<Category[]> {
    return this.http
      .post<ResponseDataDto<Category[]>>(this.getCategoriesUrl, {
        rootId,
        leafId,
      })
      .pipe(
        map((r) => r.data ?? []),
        tap((list) => this.categoriesSubject.next(list))
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
