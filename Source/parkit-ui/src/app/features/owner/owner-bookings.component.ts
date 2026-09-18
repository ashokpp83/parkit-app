import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BookingDto, PaymentStatus } from '../../core/models';
import { ParkingService } from '../../core/parking.service';
import { ServiceBookingService } from '../../core/service-booking.service';

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
                <span class="price">
                  Parking: ₹{{ b.amount }}
                  @if (servicesAmountFor(b) > 0) {
                    <span> + Services: ₹{{ servicesAmountFor(b) }} = <strong>₹{{ b.amount + servicesAmountFor(b) }}</strong></span>
                  }
                </span>
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
  // Best-effort correlation: services aren't linked to a specific parking booking,
  // so we attribute a customer's service spend at a facility to their bookings there.
  private servicesByFacilityAndCustomer = new Map<string, number>();

  constructor(private parking: ParkingService, private serviceBookings: ServiceBookingService) {
    this.loadOwnerBookings();
  }

  statusLabel(status: number): string {
    return this.statusLabels[status] ?? String(status);
  }

  paymentStatusLabel(status: PaymentStatus): string {
    return this.paymentLabels[status] ?? `Status ${status}`;
  }

  servicesAmountFor(b: BookingDto): number {
    return this.servicesByFacilityAndCustomer.get(`${b.facilityId}|${b.driverEmail}`) ?? 0;
  }

  private loadOwnerBookings(): void {
    this.parking.ownerBookings().subscribe({
      next: (items) => {
        this.ownerBookings.set(items);
        this.loadServiceTotals(items);
      },
      error: () => this.ownerBookings.set([]),
    });
  }

  private loadServiceTotals(items: BookingDto[]): void {
    const facilityIds = Array.from(new Set(items.map((b) => b.facilityId)));
    if (facilityIds.length === 0) return;

    forkJoin(
      facilityIds.map((id) => this.serviceBookings.listForFacility(id).pipe(catchError(() => of([]))))
    ).subscribe((results) => {
      const map = new Map<string, number>();
      results.forEach((bookings, i) => {
        const facilityId = facilityIds[i];
        for (const sb of bookings) {
          const key = `${facilityId}|${sb.customerEmail}`;
          map.set(key, (map.get(key) ?? 0) + sb.amount);
        }
      });
      this.servicesByFacilityAndCustomer = map;
    });
  }
}

