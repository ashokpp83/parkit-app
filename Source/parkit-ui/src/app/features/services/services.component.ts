import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceBookingService } from '../../core/service-booking.service';
import { ParkingService } from '../../core/parking.service';
import { AuthService } from '../../core/auth.service';
import { FacilityServiceDto, ServiceBookingDto, UserRole, ValueAddedServiceType } from '../../core/models';

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
  selector: 'app-services',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h1>Value-Added Services</h1>
    <p class="muted">Services are offered per facility by the facility owner. Pick a facility to see what it offers.</p>

    <div class="card">
      <label>Facility</label>
      <select [(ngModel)]="selectedFacilityId" (ngModelChange)="onFacilityChange()">
        <option [ngValue]="null">Select a facility…</option>
        @for (f of facilities(); track f.id) {
          <option [ngValue]="f.id">{{ f.name }}</option>
        }
      </select>
      @if (facilities().length === 0) {
        @if (isOwner) {
          <p class="muted">You don't have any facilities yet — add one from the Facilities page.</p>
        } @else {
          <p class="muted">Book a parking space first — services are offered by the facilities you've parked at.</p>
        }
      }
    </div>

    @if (selectedFacilityId) {
      <h2>Available services</h2>
      @if (catalog().length === 0) {
        <p class="muted">This facility hasn't listed any services yet.</p>
      } @else {
        <div class="facility-list">
          @for (offer of catalog(); track offer.serviceType) {
            <div class="card facility-item">
              <div>
                <strong>{{ nameFor(offer.serviceType) }}</strong>
              </div>
              <div class="chip-row">
                <span>₹{{ offer.price }}</span>
                @if (!isOwner) {
                  <button class="primary sm" [disabled]="booking() === offer.serviceType" (click)="book(offer)">
                    {{ booking() === offer.serviceType ? 'Booking…' : 'Book' }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    }

    @if (!isOwner) {
      <h2>My Service Bookings</h2>
      <div class="facility-list">
        @for (b of myBookings(); track b.id) {
          <div class="card facility-item">
            <div>
              <strong>{{ nameFor(b.serviceType) }}</strong>
              <p class="muted">{{ b.facilityName }} • ₹{{ b.amount }}</p>
            </div>
            <div>{{ statusLabel(b.status) }}</div>
          </div>
        } @empty {
          <p class="muted">No service bookings yet.</p>
        }
      </div>
    }
  `,
})
export class ServicesComponent implements OnInit {
  facilities = signal<{ id: string; name: string }[]>([]);
  catalog = signal<FacilityServiceDto[]>([]);
  myBookings = signal<ServiceBookingDto[]>([]);
  booking = signal<ValueAddedServiceType | null>(null);
  selectedFacilityId: string | null = null;

  private statusLabels = ['Requested', 'In progress', 'Completed', 'Cancelled'];
  isOwner = false;

  constructor(
    private serviceBookings: ServiceBookingService,
    private parking: ParkingService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.isOwner = this.auth.user()?.role === UserRole.Owner;

    if (this.isOwner) {
      this.parking.myFacilities().subscribe({
        next: (list) => this.facilities.set(list.map((f) => ({ id: f.id, name: f.name }))),
        error: () => this.facilities.set([]),
      });
    } else {
      this.parking.myBookings().subscribe({
        next: (bookings) => {
          const seen = new Map<string, string>();
          for (const b of bookings) seen.set(b.facilityId, b.facilityName);
          this.facilities.set(Array.from(seen, ([id, name]) => ({ id, name })));
        },
        error: () => this.facilities.set([]),
      });
    }
    this.serviceBookings.list().subscribe((b) => this.myBookings.set(b));
  }

  onFacilityChange(): void {
    if (!this.selectedFacilityId) {
      this.catalog.set([]);
      return;
    }
    this.parking.facilityServices(this.selectedFacilityId).subscribe({
      next: (list) => this.catalog.set(list),
      error: () => this.catalog.set([]),
    });
  }

  nameFor(type: ValueAddedServiceType): string {
    return SERVICE_NAMES[type] ?? ValueAddedServiceType[type];
  }

  statusLabel(status: number): string {
    return this.statusLabels[status] ?? String(status);
  }

  book(offer: FacilityServiceDto): void {
    if (!this.selectedFacilityId) return;
    this.booking.set(offer.serviceType);
    this.serviceBookings.create({ facilityId: this.selectedFacilityId, serviceType: offer.serviceType }).subscribe({
      next: (b) => {
        this.myBookings.update((list) => [b, ...list]);
        this.booking.set(null);
      },
      error: () => this.booking.set(null),
    });
  }
}
