// src/app/features/auth/services/registration-data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegisterRequest } from 'src/app/shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class RegistrationDataService {
  private data$ = new BehaviorSubject<RegisterRequest | null>(null);

  /** Obtiene la data acumulada (o null) */
  getRegistrationData(): RegisterRequest | null {
    return this.data$.value;
  }

  /** Guarda o actualiza la data */
  setRegistrationData(d: RegisterRequest): void {
    this.data$.next(d);
  }

  /** Limpia todo (al registro exitoso) */
  clear(): void {
    this.data$.next(null);
  }
}
