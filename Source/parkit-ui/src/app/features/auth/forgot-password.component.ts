import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <a class="back-link" routerLink="/login">&larr; Back to login</a>
      <form class="card auth-card" (ngSubmit)="submit()">
        <h1>Forgot password?</h1>
        <p class="hint">Enter your account email. If an account exists, we will send a reset link.</p>
        <label for="recovery-email">Email</label>
        <input id="recovery-email" type="email" name="email" [(ngModel)]="email" autocomplete="email" required />
        @if (error()) { <p class="error">{{ error() }}</p> }
        @if (message()) { <p class="success">{{ message() }}</p> }
        <button class="primary" type="submit" [disabled]="loading()">{{ loading() ? 'Sending…' : 'Send reset link' }}</button>
      </form>
    </div>
  `,
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);

  constructor(private auth: AuthService) {}

  submit(): void {
    if (!this.email.trim()) {
      this.error.set('Enter your email address.');
      return;
    }
    this.error.set(null);
    this.message.set(null);
    this.loading.set(true);
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.message.set(response.message);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.status === 429
          ? 'Too many attempts. Please try again later.'
          : 'Unable to send a reset link right now. Please try again later.');
      },
    });
  }
}
