import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingDto, PaymentStatus } from '../../core/models';
import { ParkingService } from '../../core/parking.service';

@Component({
  selector: 'app-owner-bookings',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="owner-nav">
      <h1>Booking History</h1>
      <div class="nav-links">
        <a routerLink="/owner" class="nav-link">Dashboard</a>
        <a routerLink="/owner/facilities" class="nav-link">Facilities</a>
        <a routerLink="/owner/bookings" class="nav-link active">Bookings</a>
      </div>
    </div>
    <div class="card">
      <h1>Booking history</h1>
      <p class="muted">Bookings made to your facilities.</p>

      @if (ownerBookings().length === 0) {
        <p class="muted">No bookings yet for your facilities.</p>
      } @else {
        <div class="results">
          @for (b of ownerBookings(); track b.id) {
            <div class="card space">
              <div class="space-top">
                <div>
                  <h3>{{ b.facilityName }}</h3>
                  <p class="meta">Slot {{ b.slotLabel }} · {{ b.vehicleRegistration }}</p>
                  <p class="meta">Car owner: {{ b.driverName || 'N/A' }} · {{ b.driverPhoneNumber || 'N/A' }}</p>
                  <p class="meta">Email: {{ b.driverEmail || 'N/A' }}</p>
                  <p class="muted">{{ b.startTime | date: 'short' }} → {{ b.endTime | date: 'short' }}</p>
                </div>
                <span class="badge" [class.guaranteed]="b.isGuaranteed">{{ b.isGuaranteed ? 'Guaranteed' : 'Reserved' }}</span>
              </div>
              <div class="space-bottom">
                <span class="price">₹{{ b.amount }}</span>
                <span class="security">{{ statusLabel(b.status) }}</span>
                @if (b.paymentStatus !== undefined && b.paymentStatus !== null) {
                  <span class="badge" [class.ok]="b.paymentStatus === PaymentStatus.Captured" [class.warn]="b.paymentStatus !== PaymentStatus.Captured">
                    {{ paymentStatusLabel(b.paymentStatus) }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .owner-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
      background: var(--surface);
    }

    .owner-nav h1 {
      margin: 0;
      font-size: 20px;
    }

    .nav-links {
      display: flex;
      gap: 20px;
    }

    .nav-link {
      color: var(--muted);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .nav-link:hover {
      color: var(--text);
      background: var(--surface-2);
    }

    .nav-link.active {
      color: var(--primary);
      background: rgba(0, 128, 255, 0.1);
      font-weight: 600;
    }
  `],
})
export class OwnerBookingsComponent {
  readonly PaymentStatus = PaymentStatus;
  ownerBookings = signal<BookingDto[]>([]);
  private readonly statusLabels = ['Pending', 'Confirmed', 'Checked in', 'Completed', 'Cancelled', 'No-show', 'Overstay', 'Failover'];
  private readonly paymentLabels: Record<number, string> = {
    [PaymentStatus.Pending]: 'Payment pending',
    [PaymentStatus.Held]: 'Payment held',
    [PaymentStatus.Captured]: 'Paid',
    [PaymentStatus.Refunded]: 'Refunded',
    [PaymentStatus.PartialRefund]: 'Partially refunded',
    [PaymentStatus.Failed]: 'Payment failed',
  };

  constructor(private parking: ParkingService) {
    this.loadOwnerBookings();
  }

  statusLabel(status: number): string {
    return this.statusLabels[status] ?? String(status);
  }

  paymentStatusLabel(status: PaymentStatus): string {
    return this.paymentLabels[status] ?? `Status ${status}`;
  }

  private loadOwnerBookings(): void {
    this.parking.ownerBookings().subscribe({
      next: (items) => this.ownerBookings.set(items),
      error: () => this.ownerBookings.set([]),
    });
  }
}

