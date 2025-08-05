import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ListListingsRequestDto } from '../models/listing.model';

@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly STORAGE_KEY = 'searchFilters';
  private readonly filtersSubject = new BehaviorSubject<
    Partial<ListListingsRequestDto>
  >({});

  constructor() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this.filtersSubject.next(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }

  /** Último valor de filtros en memoria */
  get value(): Partial<ListListingsRequestDto> {
    return this.filtersSubject.value;
  }

  /** Observable para suscribirse a cambios de filtros */
  get filters$(): Observable<Partial<ListListingsRequestDto>> {
    return this.filtersSubject.asObservable();
  }

  /** Establece un DTO de filtros completo */
  set(filters: Partial<ListListingsRequestDto>): void {
    this.filtersSubject.next(filters);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // ignore storage errors
    }
  }

  /** Restablece los filtros a estado vacío */
  clear(): void {
    this.filtersSubject.next({});
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /** ─────────────────────────────────────────────
   * Asigna las categorías seleccionadas
   * ───────────────────────────────────────────── */
  setCategoryIds(ids: string[] | undefined): void {
    const next: Partial<ListListingsRequestDto> = {
      ...this.filtersSubject.value,
    };

    if (ids && ids.length) {
      next.categoryIds = ids;
    } else {
      delete next.categoryIds; // sin categorías = sin filtro
    }

    this.set(next); // reutiliza la lógica de persistencia
  }
}
