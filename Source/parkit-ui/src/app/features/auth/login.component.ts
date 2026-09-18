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
      <h1>Welcome back</h1>
      <p class="muted">Sign in as a car owner or a facility owner.</p>
      <label>Login as</label>
      <select [(ngModel)]="loginAs" (ngModelChange)="updateDemoCredentials()" name="loginAs">
        <option [ngValue]="'car-owner'">Car owner</option>
        <option [ngValue]="'facility-owner'">Facility owner</option>
      </select>

      <div class="chip-row">
        <button type="button" class="chip" [class.active]="method() === 'password'" (click)="method.set('password')">Password</button>
        <button type="button" class="chip" [class.active]="method() === 'otp'" (click)="method.set('otp')">OTP</button>
      </div>

      @if (method() === 'password') {
        <label>Email or phone</label>
        <input [(ngModel)]="emailOrPhone" name="emailOrPhone" placeholder="driver@parkit.app" autocomplete="username" />
        <label>Password</label>
        <input type="password" [(ngModel)]="password" name="password" placeholder="Passw0rd!" autocomplete="current-password" />
      } @else {
        <label>Phone number</label>
        <input [(ngModel)]="phoneNumber" name="phoneNumber" placeholder="+919000000001" autocomplete="tel" />
        <button type="button" class="ghost sm" [disabled]="otpSending()" (click)="sendOtp()">
          {{ otpSending() ? 'Sending…' : 'Send OTP' }}
        </button>
        @if (otpSent()) {
          <label>OTP code</label>
          <input [(ngModel)]="otpCode" name="otpCode" placeholder="6-digit code" autocomplete="one-time-code" />
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
})
export class LoginComponent {
  loginAs: 'car-owner' | 'facility-owner' = 'car-owner';
  method = signal<'password' | 'otp'>('password');
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
