import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AuthResponse, UserRole } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <form class="card auth-card" (ngSubmit)="submit()">
      <div class="auth-brand"><span class="logo">P</span></div>
      <h1>Welcome back</h1>
      <p class="muted">Sign in to find or manage parking.</p>
      <label>I am a</label>
      <div class="seg-tabs">
        <button type="button" [class.active]="loginAs === 'car-owner'" (click)="loginAs = 'car-owner'; updateDemoCredentials()">🚗 Car owner</button>
        <button type="button" [class.active]="loginAs === 'facility-owner'" (click)="loginAs = 'facility-owner'; updateDemoCredentials()">🏢 Facility owner</button>
      </div>

      <div class="seg-tabs method-tabs">
        <button type="button" [class.active]="method() === 'password'" (click)="method.set('password')">Password</button>
        <button type="button" [class.active]="method() === 'otp'" (click)="method.set('otp')">OTP</button>
      </div>

      @if (method() === 'password') {
        <label>Email or phone</label>
        <input [(ngModel)]="emailOrPhone" name="emailOrPhone" placeholder="driver@parkit.app" autocomplete="username" />
        <label>Password</label>
        <div class="password-field">
          <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="Passw0rd!" autocomplete="current-password" />
          <button type="button" class="password-toggle" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'" [attr.aria-pressed]="showPassword()" (click)="showPassword.set(!showPassword())">👁</button>
        </div>
        <a routerLink="/forgot-password">Forgot password?</a>
      } @else {
        <label>Phone number</label>
        <input [(ngModel)]="phoneNumber" name="phoneNumber" placeholder="+919000000001" autocomplete="tel" inputmode="tel" />
        <button type="button" class="ghost sm otp-btn" [disabled]="otpSending()" (click)="sendOtp()">
          {{ otpSending() ? 'Sending…' : 'Send OTP' }}
        </button>
        @if (otpSent()) {
          <label>OTP code</label>
          <input [(ngModel)]="otpCode" name="otpCode" placeholder="6-digit code" autocomplete="one-time-code" inputmode="numeric" />
          @if (devCode()) { <p class="hint">Dev OTP: {{ devCode() }}</p> }
        }
      }

      @if (error()) { <p class="error">{{ error() }}</p> }
      <button class="primary" type="submit" [disabled]="loading()">
        {{ loading() ? 'Signing in…' : 'Sign in' }}
      </button>
      <p class="muted">No account? <a routerLink="/register">Create one</a></p>
      @if (method() === 'password') {
        <p class="hint">Demo {{ loginAs === 'facility-owner' ? 'facility owner' : 'car owner' }}: {{ emailOrPhone }} / Passw0rd!</p>
      }
    </form>
  `,
  styles: [`
    .auth-brand { display: flex; justify-content: center; margin-bottom: 10px; }
    .auth-brand .logo { width: 48px; height: 48px; font-size: 24px; border-radius: 14px; }
    h1, h1 + .muted { text-align: center; }
    .method-tabs { margin-top: 14px; }
    .otp-btn { width: 100%; margin-top: 10px; }
    .auth-card > p.muted, .auth-card > p.hint { text-align: center; }
  `],
})
export class LoginComponent {
  loginAs: 'car-owner' | 'facility-owner' = 'car-owner';
  method = signal<'password' | 'otp'>('password');
  showPassword = signal(false);
  emailOrPhone = 'driver1@parkit.app';
  password = 'Passw0rd!';
  phoneNumber = '';
  otpCode = '';
  otpSending = signal(false);
  otpSent = signal(false);
  devCode = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  updateDemoCredentials(): void {
    this.emailOrPhone = this.loginAs === 'facility-owner'
      ? 'owner@parkit.app'
      : 'driver1@parkit.app';
  }

  sendOtp(): void {
    if (!this.phoneNumber.trim()) return;
    this.otpSending.set(true);
    this.error.set(null);
    this.auth.sendOtp(this.phoneNumber.trim()).subscribe({
      next: (res) => {
        this.otpSending.set(false);
        this.otpSent.set(true);
        this.devCode.set(res.devCode ?? null);
      },
      error: (e) => {
        this.otpSending.set(false);
        this.error.set(e?.error?.error?.message ?? 'Could not send OTP.');
      },
    });
  }

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    const login$ = this.method() === 'otp'
      ? this.auth.loginWithOtp(this.phoneNumber.trim(), this.otpCode.trim())
      : this.auth.login(this.emailOrPhone, this.password);

    login$.subscribe({
      next: (res) => this.handleLoggedIn(res),
      error: (e) => {
        this.error.set(e?.error?.error?.message ?? 'Login failed.');
        this.loading.set(false);
      },
    });
  }

  private handleLoggedIn(res: AuthResponse): void {
    const expectedRole = this.loginAs === 'facility-owner' ? UserRole.Owner : UserRole.Driver;
    if (res.user.role !== expectedRole) {
      this.auth.logout();
      this.error.set(this.loginAs === 'facility-owner'
        ? 'This account is not a facility owner account.'
        : 'This account is not a car owner account.');
      this.loading.set(false);
      return;
    }

    this.loading.set(false);
    this.router.navigate([res.user.role === UserRole.Owner ? '/owner/facilities' : '/search']);
  }
}
