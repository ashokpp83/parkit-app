import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, UserDto } from './models';

const ACCESS_KEY = 'parkit.access';
const REFRESH_KEY = 'parkit.refresh';
const USER_KEY = 'parkit.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiBaseUrl;

  readonly user = signal<UserDto | null>(this.readUser());
  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor(private http: HttpClient) {}

  login(emailOrPhone: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { emailOrPhone, password })
      .pipe(tap((r) => this.persist(r)));
  }

  register(payload: {
    fullName: string; email: string; phoneNumber: string; password: string; role: number;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, payload)
      .pipe(tap((r) => this.persist(r)));
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
