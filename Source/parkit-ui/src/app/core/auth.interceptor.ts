import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = environment.apiBaseUrl.replace(/\/$/, '');
  if (!req.url.startsWith(`${apiBase}/`)) return next(req);

  const auth = inject(AuthService);
  const token = auth.accessToken;
  const authenticatedRequest = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  if (!token || req.url.startsWith(`${apiBase}/auth/`)) return next(authenticatedRequest);
  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);
      return auth.refreshSession().pipe(
        switchMap((response) => next(req.clone({
          setHeaders: { Authorization: `Bearer ${response.accessToken}` },
        }))),
      );
    }),
  );
};
