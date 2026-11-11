import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, UserDto } from './models';

const ACCESS_KEY = 'parkit.access';
const REFRESH_KEY = 'parkit.refresh';
const USER_KEY = 'parkit.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiBaseUrl;
  private refreshRequest?: Observable<AuthResponse>;

  readonly user = signal<UserDto | null>(this.readUser());
  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor(private http: HttpClient) {}

  login(emailOrPhone: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { emailOrPhone, password })
      .pipe(tap((r) => this.persist(r)));
  }

  loginWithOtp(phoneNumber: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login/otp`, { phoneNumber, code })
      .pipe(tap((r) => this.persist(r)));
  }

  sendOtp(phoneNumber: string): Observable<{ sent: boolean; devCode?: string | null }> {
    return this.http.post<{ sent: boolean; devCode?: string | null }>(`${this.base}/auth/otp/send`, { phoneNumber });
  }

  register(payload: {
    fullName: string; email: string; phoneNumber: string; password: string; role: number;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, payload)
      .pipe(tap((r) => this.persist(r)));
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/reset-password`, { token, password });
  }

  refreshSession(): Observable<AuthResponse> {
    if (this.refreshRequest) return this.refreshRequest;
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Your session has expired. Please sign in again.'));
    }
    this.refreshRequest = this.http.post<AuthResponse>(`${this.base}/auth/refresh`, { refreshToken }).pipe(
      tap((response) => this.persist(response)),
      catchError((error) => {
        if (error.status === 401) this.logout();
        return throwError(() => error);
      }),
      finalize(() => { this.refreshRequest = undefined; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshRequest;
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  private persist(r: AuthResponse): void {
    localStorage.setItem(ACCESS_KEY, r.accessToken);
    localStorage.setItem(REFRESH_KEY, r.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
    this.user.set(r.user);
  }

  private readUser(): UserDto | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserDto) : null;
  }
}
