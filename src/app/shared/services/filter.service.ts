import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ListListingsRequestDto } from '../models/listing.model';

@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly STORAGE_KEY = 'searchFilters';
  private readonly filtersSubject = new BehaviorSubject<Partial<ListListingsRequestDto>>({});

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

  get value(): Partial<ListListingsRequestDto> {
    return this.filtersSubject.value;
  }

  get filters$(): Observable<Partial<ListListingsRequestDto>> {
    return this.filtersSubject.asObservable();
  }

  set(filters: Partial<ListListingsRequestDto>): void {
    this.filtersSubject.next(filters);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // ignore storage errors
    }
  }

  clear(): void {
    this.filtersSubject.next({});
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
