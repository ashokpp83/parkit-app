import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <a class="back-link" routerLink="/login">&larr; Back to login</a>
      <form class="card auth-card" (ngSubmit)="submit()">
        <h1>Reset password</h1>
        <label for="new-password">New password</label>
        <div class="password-field">
          <input id="new-password" name="password" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" autocomplete="new-password" minlength="6" required />
          <button type="button" class="password-toggle" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'" [attr.aria-pressed]="showPassword()" (click)="showPassword.set(!showPassword())">👁</button>
        </div>
        <label for="confirm-password">Confirm password</label>
        <input id="confirm-password" name="confirmPassword" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="confirmPassword" autocomplete="new-password" required />
        @if (error()) { <p class="error">{{ error() }}</p> }
        @if (message()) { <p class="success">{{ message() }} <a routerLink="/login">Sign in</a></p> }
        <button class="primary" type="submit" [disabled]="loading() || !!message()">{{ loading() ? 'Saving…' : 'Reset password' }}</button>
      </form>
    </div>
  `,
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';
  showPassword = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  private readonly token: string;

  constructor(private auth: AuthService, route: ActivatedRoute) {
    this.token = route.snapshot.fragment ?? '';
    if (!this.token) this.error.set('This reset link is invalid. Request a new one.');
  }

  submit(): void {
    if (!this.token) {
      this.error.set('This reset link is invalid. Request a new one.');
      return;
    }
    if (this.password.length < 6 || this.password !== this.confirmPassword) {
      this.error.set('Passwords must match and contain at least 6 characters.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.password = '';
        this.confirmPassword = '';
        this.message.set(response.message);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.error?.message ?? 'Could not reset password. Please try again.');
      },
    });
  }
}
