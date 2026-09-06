import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <a class="back-link" routerLink="/login">&larr; Back to login</a>
      <form class="card auth-card" (ngSubmit)="submit()">
        <h1>Create your account</h1>
        <label>Full name</label>
        <input [(ngModel)]="fullName" name="fullName" />
        <label>Email</label>
        <input [(ngModel)]="email" name="email" type="email" autocomplete="email" />
        <label>Phone</label>
        <input [(ngModel)]="phoneNumber" name="phoneNumber" placeholder="+91…" autocomplete="tel" />
        <label>Password</label>
        <input [(ngModel)]="password" name="password" type="password" autocomplete="new-password" />
        <label>I am a</label>
        <select [(ngModel)]="role" name="role">
          <option [ngValue]="UserRole.Driver">Car owner</option>
          <option [ngValue]="UserRole.Owner">Parking facility owner</option>
        </select>
        @if (error()) { <p class="error">{{ error() }}</p> }
        <button class="primary" type="submit" [disabled]="loading()">Create account</button>
        <p class="muted">Already registered? <a routerLink="/login">Sign in</a></p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  readonly UserRole = UserRole;
  fullName = '';
  email = '';
  phoneNumber = '';
  password = '';
  role: UserRole = UserRole.Driver;
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .register({ fullName: this.fullName, email: this.email, phoneNumber: this.phoneNumber, password: this.password, role: this.role })
      .subscribe({
        next: (res) => this.router.navigate([res.user.role === UserRole.Owner ? '/owner/facilities' : '/search']),
        error: (e) => {
          this.error.set(this.resolveErrorMessage(e));
          this.loading.set(false);
        },
      });
  }

  private resolveErrorMessage(error: any): string {
    if (error?.error?.error?.message) return error.error.error.message;
    if (error?.status === 0) return 'Cannot reach server. Please start the API and try again.';

    const validation = error?.error?.errors;
    if (validation && typeof validation === 'object') {
      const firstKey = Object.keys(validation)[0];
      const firstMessage = Array.isArray(validation[firstKey]) ? validation[firstKey][0] : null;
      if (firstMessage) return firstMessage;
    }

    if (error?.error?.title) return error.error.title;
    if (error?.message) return error.message;
    return 'Registration failed.';
  }
}
