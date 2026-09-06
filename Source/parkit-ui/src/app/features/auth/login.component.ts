import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <form class="card auth-card" (ngSubmit)="submit()">
      <h1>Welcome back</h1>
      <p class="muted">Sign in as a car owner or a parking facility owner.</p>
      <label>Login as</label>
      <select [(ngModel)]="loginAs" (ngModelChange)="updateDemoCredentials()" name="loginAs">
        <option [ngValue]="'car-owner'">Car owner</option>
        <option [ngValue]="'facility-owner'">Parking facility owner</option>
      </select>
      <label>Email or phone</label>
      <input [(ngModel)]="emailOrPhone" name="emailOrPhone" placeholder="driver@parkit.app" autocomplete="username" />
      <label>Password</label>
      <input type="password" [(ngModel)]="password" name="password" placeholder="Passw0rd!" autocomplete="current-password" />
      @if (error()) { <p class="error">{{ error() }}</p> }
      <button class="primary" type="submit" [disabled]="loading()">
        {{ loading() ? 'Signing in…' : 'Sign in' }}
      </button>
      <p class="muted">No account? <a routerLink="/register">Create one</a></p>
      <p class="hint">Demo {{ loginAs === 'facility-owner' ? 'facility owner' : 'car owner' }}: {{ emailOrPhone }} / Passw0rd!</p>
    </form>
  `,
})
export class LoginComponent {
  loginAs: 'car-owner' | 'facility-owner' = 'car-owner';
  emailOrPhone = 'driver1@parkit.app';
  password = 'Passw0rd!';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  updateDemoCredentials(): void {
    this.emailOrPhone = this.loginAs === 'facility-owner'
      ? 'owner@parkit.app'
      : 'driver1@parkit.app';
  }

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.emailOrPhone, this.password).subscribe({
      next: (res) => {
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
      },
      error: (e) => {
        this.error.set(e?.error?.error?.message ?? 'Login failed.');
        this.loading.set(false);
      },
    });
  }
}
