import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BookingDto, OwnerServiceBookingDto, PaymentStatus, ValueAddedServiceType } from '../../core/models';
import { ParkingService } from '../../core/parking.service';
import { ServiceBookingService } from '../../core/service-booking.service';

const SERVICE_NAMES: Record<ValueAddedServiceType, string> = {
  [ValueAddedServiceType.CarWashExterior]: 'Exterior wash',
  [ValueAddedServiceType.CarWashFull]: 'Interior & exterior wash',
  [ValueAddedServiceType.EvChargingLevel1]: 'EV charging (Level 1)',
  [ValueAddedServiceType.EvChargingLevel2]: 'EV charging (Level 2, fast)',
  [ValueAddedServiceType.TireChange]: 'Tire change',
  [ValueAddedServiceType.OilChange]: 'Oil change',
  [ValueAddedServiceType.RoadsideAssistance]: 'Roadside assistance',
  [ValueAddedServiceType.CarAccessories]: 'Car accessories',
  [ValueAddedServiceType.CarDetailing]: 'Car detailing',
  [ValueAddedServiceType.InsuranceRenewal]: 'Insurance renewal',
  [ValueAddedServiceType.FastagRecharge]: 'FASTag recharge',
};

@Component({
  selector: 'app-owner-bookings',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Booking history</h1>
        <p class="hint">{{ ownerBookings().length }} booking{{ ownerBookings().length === 1 ? '' : 's' }} at your facilities</p>
      </div>
    </div>
    <div class="seg-tabs desktop-only">
      <a routerLink="/owner/facilities">Facilities</a>
      <a routerLink="/owner/bookings" class="active">Bookings</a>
    </div>

    @if (ownerBookings().length === 0) {
      <div class="card empty-state"><span class="icon">📋</span>No bookings yet for your facilities.</div>
    } @else {
      <div class="results">
        @for (b of ownerBookings(); track b.id) {
          <div class="card space booking-card">
            <div class="space-top">
              <div>
                <h3>{{ b.facilityName }}</h3>
                <p class="meta">🕒 {{ b.startTime | date: 'd MMM, h:mm a' }} → {{ b.endTime | date: 'h:mm a' }}</p>
                <p class="meta">🅿️ Slot {{ b.slotLabel }} · 🚗 {{ b.vehicleRegistration }}</p>
                <p class="meta">👤 {{ b.driverName || 'N/A' }}</p>
              </div>
              <span class="price">₹{{ b.amount + servicesAmountFor(b) }}</span>
            </div>
            <div class="status-row">
              <span class="badge" [class.guaranteed]="b.isGuaranteed">{{ b.isGuaranteed ? 'Guaranteed' : 'Reserved' }}</span>
              <span class="badge">{{ statusLabel(b.status) }}</span>
              @if (b.paymentStatus !== undefined && b.paymentStatus !== null) {
                <span class="badge" [class.ok]="b.paymentStatus === PaymentStatus.Captured" [class.warn]="b.paymentStatus !== PaymentStatus.Captured">
                  {{ paymentStatusLabel(b.paymentStatus) }}
                </span>
              }
            </div>
            @if (servicesFor(b).length > 0) {
              <div class="meta service-breakdown">
                <span>Parking ₹{{ b.amount }} + services:</span>
                @for (s of servicesFor(b); track s.id) {
                  <span class="chip">{{ nameFor(s.serviceType) }} — ₹{{ s.amount }}</span>
                }
              </div>
            }
            <details class="contact">
              <summary>Customer contact</summary>
              <p class="meta">📞 <a [href]="'tel:' + b.driverPhoneNumber">{{ b.driverPhoneNumber || 'N/A' }}</a></p>
              <p class="meta">✉️ {{ b.driverEmail || 'N/A' }}</p>
            </details>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .service-breakdown {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .service-breakdown .chip {
      background: var(--surface-2);
      border-radius: 12px;
      padding: 2px 10px;
      font-size: 12px;
      min-height: 0;
    }

    @media (max-width: 768px) {
      .desktop-only { display: none; }
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
  // so we attribute a customer's service bookings at a facility to their bookings there.
  private servicesByFacilityAndCustomer = new Map<string, OwnerServiceBookingDto[]>();

  constructor(private parking: ParkingService, private serviceBookings: ServiceBookingService) {
    this.loadOwnerBookings();
  }

  statusLabel(status: number): string {
    return this.statusLabels[status] ?? String(status);
  }

  paymentStatusLabel(status: PaymentStatus): string {
    return this.paymentLabels[status] ?? `Status ${status}`;
  }

  nameFor(type: ValueAddedServiceType): string {
    return SERVICE_NAMES[type] ?? ValueAddedServiceType[type];
  }

  servicesFor(b: BookingDto): OwnerServiceBookingDto[] {
    return this.servicesByFacilityAndCustomer.get(`${b.facilityId}|${b.driverEmail}`) ?? [];
  }

  servicesAmountFor(b: BookingDto): number {
    return this.servicesFor(b).reduce((sum, s) => sum + s.amount, 0);
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
      const map = new Map<string, OwnerServiceBookingDto[]>();
      results.forEach((bookings, i) => {
        const facilityId = facilityIds[i];
        for (const sb of bookings) {
          const key = `${facilityId}|${sb.customerEmail}`;
          const list = map.get(key) ?? [];
          list.push(sb);
          map.set(key, list);
        }
      });
      this.servicesByFacilityAndCustomer = map;
    });
  }
}

