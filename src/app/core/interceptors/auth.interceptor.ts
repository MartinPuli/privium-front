import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';

const SKIP_AUTH = /\/auth\//;                  // ajusta si hace falta

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Peticiones al endpoint de autenticación: las dejamos pasar tal cual
  if (SKIP_AUTH.test(req.url)) return next(req);

  const auth = inject(AuthService);
  const token  = auth.getToken();
  const userId = auth.getCurrentUserId();

  // Si no hay token ni userId, no clones: devuelve la original
  if (!token && !userId) return next(req);

  // Construye el objeto de cabeceras a añadir
  const newHeaders: Record<string, string> = {};
  if (token)  newHeaders['Authorization'] = `Bearer ${token}`;
  if (userId) newHeaders['User-Id']       = String(userId);

  // Clona UNA sola vez con todas las cabeceras
  const authReq = req.clone({ setHeaders: newHeaders });

  return next(authReq);
};
