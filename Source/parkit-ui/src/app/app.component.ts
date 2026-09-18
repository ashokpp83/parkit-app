import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { UserRole } from './core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="brand"><span class="logo">P</span> ParkIt</div>
      @if (auth.isAuthenticated()) {
        <nav>
          @if (auth.user()?.role === UserRole.Driver) {
            <a routerLink="/search" routerLinkActive="active">Find</a>
            <a routerLink="/bookings" routerLinkActive="active">Bookings</a>
            <a routerLink="/vehicles" routerLinkActive="active">Vehicles</a>
          }
          @if (auth.user()?.role === UserRole.Owner) {
            <a routerLink="/owner/facilities" routerLinkActive="active">Facilities</a>
            <a routerLink="/owner/bookings" routerLinkActive="active">Booking History</a>
          }
          <a routerLink="/payments" routerLinkActive="active">Payments</a>
          <a routerLink="/services" routerLinkActive="active">Services</a>
        </nav>
        <div class="user">
          <span>{{ auth.user()?.fullName }}</span>
          <button class="ghost sm" (click)="signOut()">Sign out</button>
        </div>
      }
    </header>
    <main class="container"><router-outlet /></main>
    @if (auth.isAuthenticated()) {
      <nav class="bottom-nav">
        @if (auth.user()?.role === UserRole.Driver) {
          <a routerLink="/search" routerLinkActive="active"><span>🔍</span>Find</a>
          <a routerLink="/bookings" routerLinkActive="active"><span>📅</span>Bookings</a>
        }
        @if (auth.user()?.role === UserRole.Owner) {
          <a routerLink="/owner/facilities" routerLinkActive="active"><span>🏢</span>Facilities</a>
        }
        <a routerLink="/payments" routerLinkActive="active"><span>💳</span>Payments</a>
      </nav>
    }
  `,
})
export class AppComponent {
  readonly UserRole = UserRole;
  constructor(public auth: AuthService, private router: Router) {}

  signOut(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
