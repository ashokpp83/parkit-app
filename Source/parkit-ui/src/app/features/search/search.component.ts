import {
  AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import * as L from 'leaflet';
import { ParkingService } from '../../core/parking.service';
import { GeocodingService, GeoPlace } from '../../core/geocoding.service';
import {
  BookingDto,
  CostType,
  FacilityDetailDto,
  PaymentMethod,
  PaymentStatus,
  SpaceSearchResult,
  SpaceStatus,
  VehicleDto,
} from '../../core/models';

interface FacilitySearchResult {
  facilityId: string;
  facilityName: string;
  addressText: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  availableSlots: number;
  totalSlots: number;
  status: SpaceStatus;
  minHourlyPrice?: number | null;
  costType: CostType;
  securityLevel: number;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-split">
      <div class="page-split-map">
        <div class="map-wrap search-map-wrap"><div #map class="leaflet-container"></div></div>
      </div>

      <div class="page-split-content">
        <div class="search-header card">
          <h1>Find parking</h1>
          <div class="row">
            <div class="field grow autocomplete">
              <label>Location or address</label>
              <div class="input-row">
                <input
                  type="text"
                  placeholder="e.g. Anna Nagar, Chennai"
                  [(ngModel)]="query"
                  (ngModelChange)="onQueryChange($event)"
                  (keydown.enter)="chooseFirst()"
                  autocomplete="off" />
                <button class="ghost" type="button" title="Use my location" (click)="useMyLocation()">📍</button>
              </div>
              @if (suggestions().length) {
                <ul class="suggestions">
                  @for (p of suggestions(); track p.displayName) {
                    <li (click)="choose(p)">{{ p.displayName }}</li>
                  }
                </ul>
              }
            </div>
            <button class="primary" (click)="search()">Search</button>
          </div>
          <p class="hint">
            @if (placeLabel()) { <span>Showing all available facilities, sorted by distance from <b>{{ placeLabel() }}</b>.</span> }
            @else { <span>Type an address or tap the location button to use your position.</span> }
          </p>
        </div>

        @if (loading()) { <p class="muted">Searching&hellip;</p> }
        @if (booked()) { <div class="banner ok">Booked {{ booked()!.slotLabel }} &mdash; &#8377;{{ booked()!.amount }} &middot; {{ booked()!.isGuaranteed ? 'Guaranteed' : 'Reserved' }} &middot; {{ booked()!.paymentStatus === PaymentStatus.Captured ? 'Paid' : (booked()!.amount > 0 ? 'Payment pending' : 'Free') }}</div> }
        @if (error()) { <div class="banner error">{{ error() }}</div> }

        <div class="results">
          @for (f of facilities(); track f.facilityId) {
            <div class="card space">
              <div class="space-top">
                <div>
                  <h3>{{ f.facilityName }}</h3>
                  <p class="muted">{{ f.addressText }}</p>
                  <p class="meta">
                    {{ f.distanceKm }} km away &middot; {{ f.availableSlots }}/{{ f.totalSlots }} slots open
                  </p>
                </div>
                <span class="badge" [class.guaranteed]="f.status === 0" [class.likely]="f.status === 1" [class.full]="f.status === 2">
                  {{ statusLabel(f.status) }}
                </span>
              </div>
              <div class="space-bottom">
                <span class="price">{{ f.costType === CostType.Paid ? '&#8377;' + (f.minHourlyPrice ?? 0) + '/hr' : 'Free' }}</span>
                <span class="security">🛡 {{ f.securityLevel }}/5</span>
                <button class="primary sm" (click)="openFacility(f)">View facility</button>
              </div>
            </div>
          } @empty {
            @if (!loading()) { <p class="muted">No facilities yet. Run a search.</p> }
          }
        </div>
      </div>
    </div>

    @if (selectedFacilitySummary()) {
      <div class="modal-backdrop" (click)="closeFacility()"></div>
      <div class="modal-card booking-detail">
        <div class="modal-header">
          <h2>Facility details</h2>
          <button class="ghost sm" type="button" (click)="closeFacility()">Close</button>
        </div>
        @if (facilityLoading()) {
          <p class="muted">Loading facility details…</p>
        } @else if (selectedFacility()) {
          <h3>{{ selectedFacility()!.name }}</h3>
          <p class="muted">{{ selectedFacility()!.addressText }}</p>
          <p class="meta">{{ selectedFacility()!.availableSlots }}/{{ selectedFacility()!.totalSlots }} slots open</p>
          <p class="meta">Facility contact: {{ selectedFacility()!.ownerName || 'N/A' }} · {{ selectedFacility()!.ownerPhoneNumber || 'N/A' }}</p>
          <p class="meta">Email: {{ selectedFacility()!.ownerEmail || 'N/A' }}</p>
          @if (selectedFacility()!.accessInstructions) {
            <p class="meta">Access: {{ selectedFacility()!.accessInstructions }}</p>
          }

          @if (selectedFacility()?.photos && selectedFacility()!.photos!.length > 0) {
            <div class="facility-photos-section">
              <h4>Photos</h4>
              <div class="facility-photos-gallery">
                @for (photo of selectedFacility()!.photos; track photo.id) {
                  <img [src]="photo.blobUrl" [alt]="photo.fileName" class="facility-photo" />
                }
              </div>
            </div>
          }

          <div class="chip-row">
            @for (feature of selectedAmenities(); track feature) {
              <span class="chip">{{ feature }}</span>
            }
          </div>

          @if (pendingPaymentBooking(); as pending) {
            <div class="space-bottom hours-row">
              <p class="meta">Slot {{ pending.slotLabel }} reserved &mdash; complete payment to confirm your booking.</p>
            </div>
            <div class="space-bottom hours-row">
              <label class="hours-input">
                Payment method
                <select [(ngModel)]="payMethod">
                  <option [ngValue]="PaymentMethod.UPI">UPI</option>
                  <option [ngValue]="PaymentMethod.Card">Card</option>
                  <option [ngValue]="PaymentMethod.Wallet">Wallet</option>
                </select>
              </label>
              <button class="primary sm" [disabled]="paying()" (click)="confirmPayment()">
                {{ paying() ? 'Processing…' : 'Pay ₹' + pending.amount }}
              </button>
              <button class="ghost sm" [disabled]="paying()" (click)="skipPayment()">Pay later</button>
            </div>
          } @else {
            @if (vehicles().length === 0) {
              <p class="meta">You have no vehicles yet. <a routerLink="/vehicles">Add a vehicle</a> to book a slot.</p>
            }
            <div class="space-bottom hours-row">
              <label class="hours-input">
                Vehicle
                <select [(ngModel)]="selectedVehicleId">
                  @for (v of vehicles(); track v.id) {
                    <option [ngValue]="v.id">{{ v.registrationNumber }}</option>
                  }
                </select>
              </label>
              <label class="hours-input">
                Start date & time
                <input type="datetime-local" [(ngModel)]="bookingStartAt" />
              </label>
              <label class="hours-input">
                End date & time
                <input type="datetime-local" [(ngModel)]="bookingEndAt" />
              </label>
              <button class="primary sm" [disabled]="!selectedVehicleId || !firstBookableSpace()" (click)="bookSelected()">
                {{ selectedVehicleId ? 'Book now' : 'Add a vehicle to book' }}
              </button>
            </div>
            @if (selectedPricing().length) {
              <p class="meta">
                @for (price of selectedPricing(); track price.unit) {
                  <span>{{ unitLabel(price.unit) }}: &#8377;{{ price.basePrice }}&nbsp;&nbsp;</span>
                }
              </p>
            }
            @if (!firstBookableSpace()) {
              <p class="error">This facility is currently fully occupied.</p>
            }
          }
        }
      </div>
    }
  `,
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map') mapEl!: ElementRef<HTMLDivElement>;
  readonly CostType = CostType;
  readonly PaymentMethod = PaymentMethod;
  readonly PaymentStatus = PaymentStatus;

  lat = 13.085;
  lng = 80.21;
  private readonly allFacilitiesRadiusKm = 20000;
  private readonly allFacilitiesPageSize = 5000;
  query = '';
  placeLabel = signal<string>('');
  suggestions = signal<GeoPlace[]>([]);
  facilities = signal<FacilitySearchResult[]>([]);
  vehicles = signal<VehicleDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  booked = signal<BookingDto | null>(null);
  selectedFacilitySummary = signal<FacilitySearchResult | null>(null);
  selectedFacility = signal<FacilityDetailDto | null>(null);
  facilityLoading = signal(false);
  selectedVehicleId = '';
  bookingStartAt = '';
  bookingEndAt = '';
  pendingPaymentBooking = signal<BookingDto | null>(null);
  payMethod: PaymentMethod = PaymentMethod.UPI;
  paying = signal(false);

  private map?: L.Map;
  private markers: L.Layer[] = [];
  private query$ = new Subject<string>();
  private readonly handleResize = () => this.map?.invalidateSize();
  private readonly amenityLabels: Record<number, string> = {
    0: 'CCTV',
    1: 'Gated',
    2: 'EV charging',
    3: 'Lift',
    4: 'Wheelchair access',
    5: 'Security personnel',
    6: 'Well lit',
    7: 'Two-wheeler',
    8: '24x7',
  };
  private readonly pricingUnitLabels: Record<number, string> = {
    0: 'Hour',
    1: 'Day',
    2: 'Week',
    3: 'Month',
  };

  constructor(private parking: ParkingService, private geo: GeocodingService) {}

  ngOnInit(): void {
    this.parking.vehicles().subscribe((v) => {
      this.vehicles.set(v);
      if (!this.selectedVehicleId && v.length) this.selectedVehicleId = v[0].id;
    });
    this.ensureBookingWindowDefaults();

    this.query$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((q) => this.geo.search(q)),
      )
      .subscribe({
        next: (places) => this.suggestions.set(places),
        error: () => this.suggestions.set([]),
      });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, { center: [this.lat, this.lng], zoom: 15 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 0);
    setTimeout(() => this.map?.invalidateSize(), 200);
    window.addEventListener('resize', this.handleResize);
    this.setCurrentLocation(false);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.map?.remove();
  }

  onQueryChange(value: string): void {
    const q = value?.trim() ?? '';
    if (q.length >= 3) this.query$.next(q);
    else this.suggestions.set([]);
  }

  choose(p: GeoPlace): void {
    this.lat = p.lat;
    this.lng = p.lng;
    this.query = p.displayName;
    this.placeLabel.set(p.displayName);
    this.suggestions.set([]);
    this.search();
  }

  chooseFirst(): void {
    const first = this.suggestions()[0];
    if (first) { this.choose(first); return; }
    const q = this.query?.trim();
    if (!q) return;
    this.geo.search(q, 1).subscribe((places) => {
      if (places[0]) this.choose(places[0]);
      else this.error.set('Could not find that location.');
    });
  }

  useMyLocation(): void {
    this.setCurrentLocation(true);
  }

  search(): void {
    this.closeFacility();
    this.refreshFacilities();
  }

  private refreshFacilities(): void {
    this.loading.set(true);
    this.error.set(null);
    this.parking.search(this.lat, this.lng, this.allFacilitiesRadiusKm, 1, this.allFacilitiesPageSize).subscribe({
      next: (r) => {
        this.facilities.set(this.toFacilities(r.items));
        this.loading.set(false);
        this.renderMarkers();
      },
      error: (e) => {
        this.error.set(e?.error?.error?.message ?? 'Search failed.');
        this.loading.set(false);
      },
    });
  }

  openFacility(facility: FacilitySearchResult): void {
    this.selectedFacilitySummary.set(facility);
    this.selectedFacility.set(null);
    this.ensureBookingWindowDefaults();
    this.error.set(null);
    this.facilityLoading.set(true);

    this.parking.facility(facility.facilityId).subscribe({
      next: (detail) => {
        this.selectedFacility.set(detail);
        this.facilityLoading.set(false);
        this.map?.closePopup();
      },
      error: () => {
        this.selectedFacility.set(null);
        this.facilityLoading.set(false);
        this.error.set('Could not load facility details.');
      },
    });
  }

  closeFacility(): void {
    this.selectedFacilitySummary.set(null);
    this.selectedFacility.set(null);
    this.facilityLoading.set(false);
    this.pendingPaymentBooking.set(null);
  }

  selectedAmenities(): string[] {
    const spaces = this.selectedFacility()?.spaces ?? [];
    const amenities = Array.from(new Set(spaces.flatMap((space) => space.amenities)));
    const labels = amenities.map((amenity) => this.amenityLabels[amenity] ?? `Feature ${amenity}`);
    return labels.length ? labels : ['No feature details'];
  }

  selectedPricing(): Array<{ unit: number; basePrice: number; suggestedPrice?: number | null }> {
    const selected = this.firstBookableSpace();
    return selected?.pricing ?? [];
  }

  unitLabel(unit: number): string {
    return this.pricingUnitLabels[unit] ?? `Unit ${unit}`;
  }

  bookSelected(): void {
    const selectedSpaceId = this.firstBookableSpace()?.spaceId;
    if (!selectedSpaceId || !this.selectedVehicleId) return;
    if (!this.bookingStartAt || !this.bookingEndAt) {
      this.error.set('Select both start and end date/time.');
      return;
    }

    const start = new Date(this.bookingStartAt);
    const end = new Date(this.bookingEndAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      this.error.set('Enter a valid booking date/time range.');
      return;
    }
    if (end <= start) {
      this.error.set('End date/time must be after start date/time.');
      return;
    }

    this.parking.book(selectedSpaceId, this.selectedVehicleId, start.toISOString(), end.toISOString()).subscribe({
      next: (booking) => {
        if (booking.amount > 0 && booking.paymentStatus !== PaymentStatus.Captured) {
          // Paid slot: hold the modal open on a payment step instead of closing immediately.
          this.payMethod = PaymentMethod.UPI;
          this.pendingPaymentBooking.set(booking);
        } else {
          this.booked.set(booking);
          this.closeFacility();
        }
        this.refreshFacilities();
      },
      error: (e) => this.error.set(e?.error?.error?.message ?? 'Booking failed.'),
    });
  }

  confirmPayment(): void {
    const pending = this.pendingPaymentBooking();
    if (!pending) return;
    this.paying.set(true);
    this.parking.pay(pending.id, this.payMethod).subscribe({
      next: (updated) => {
        this.paying.set(false);
        this.booked.set(updated);
        this.closeFacility();
        this.refreshFacilities();
      },
      error: (e) => {
        this.paying.set(false);
        this.error.set(e?.error?.error?.message ?? 'Payment failed.');
      },
    });
  }

  skipPayment(): void {
    const pending = this.pendingPaymentBooking();
    if (pending) this.booked.set(pending);
    this.closeFacility();
  }

  statusLabel(status: SpaceStatus): string {
    return status === SpaceStatus.Guaranteed ? 'Guaranteed' : status === SpaceStatus.LikelyAvailable ? 'Likely' : 'Full';
  }

  firstBookableSpace() {
    const spaces = this.selectedFacility()?.spaces ?? [];
    const prioritized = spaces
      .filter((space) => space.status !== SpaceStatus.Full)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status - b.status;
        return (a.hourlyPrice ?? Number.MAX_SAFE_INTEGER) - (b.hourlyPrice ?? Number.MAX_SAFE_INTEGER);
      });
    return prioritized[0];
  }

  private ensureBookingWindowDefaults(): void {
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setHours(end.getHours() + 2);

    this.bookingStartAt = this.toDateTimeLocalValue(start);
    this.bookingEndAt = this.toDateTimeLocalValue(end);
  }

  private toDateTimeLocalValue(date: Date): string {
    const pad = (v: number) => v.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  private renderMarkers(): void {
    if (!this.map) return;
    this.markers.forEach((m) => this.map!.removeLayer(m));
    this.markers = [];
    this.map.setView([this.lat, this.lng], 15);

    const here = L.circleMarker([this.lat, this.lng], {
      radius: 8, color: '#2f6bff', fillColor: '#2f6bff', fillOpacity: 0.9,
    }).addTo(this.map).bindPopup('Search center');
    this.markers.push(here);

    for (const f of this.facilities()) {
      const cls = f.status === SpaceStatus.Guaranteed ? 'guaranteed' : f.status === SpaceStatus.LikelyAvailable ? 'likely' : 'full';
      const icon = L.divIcon({
        className: `leaflet-div-icon pin ${cls}`,
        html: `<span>🅿</span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });
      const price = f.costType === CostType.Paid ? `&#8377;${f.minHourlyPrice ?? 0}/hr` : 'Free';
      const marker = L.marker([f.latitude, f.longitude], { icon }).addTo(this.map);
      const popup = document.createElement('div');
      popup.innerHTML =
        `<b>${f.facilityName}</b>` +
        `<div>${f.availableSlots}/${f.totalSlots} slots open &middot; ${this.statusLabel(f.status)}</div>` +
        `<div class="pop-price">${price}</div>`;
      const btn = document.createElement('button');
      btn.textContent = 'View facility';
      btn.addEventListener('click', () => this.openFacility(f));
      popup.appendChild(btn);
      marker.bindPopup(popup);
      this.markers.push(marker);
    }
  }

  private toFacilities(spaces: SpaceSearchResult[]): FacilitySearchResult[] {
    const byFacility = new Map<string, SpaceSearchResult[]>();
    for (const space of spaces) {
      const list = byFacility.get(space.facilityId) ?? [];
      list.push(space);
      byFacility.set(space.facilityId, list);
    }

    const result: FacilitySearchResult[] = [];
    for (const [facilityId, items] of byFacility.entries()) {
      const first = items[0];
      const minPaidSpace = items
        .filter((space) => space.costType === CostType.Paid && space.hourlyPrice != null)
        .sort((a, b) => (a.hourlyPrice ?? 0) - (b.hourlyPrice ?? 0))[0];
      const status = first.facilityAvailableSlots === 0
        ? SpaceStatus.Full
        : items.some((space) => space.status === SpaceStatus.Guaranteed)
          ? SpaceStatus.Guaranteed
          : SpaceStatus.LikelyAvailable;

      result.push({
        facilityId,
        facilityName: first.facilityName,
        addressText: first.addressText,
        latitude: first.latitude,
        longitude: first.longitude,
        distanceKm: first.distanceKm,
        availableSlots: first.facilityAvailableSlots,
        totalSlots: first.facilityTotalSlots,
        status,
        minHourlyPrice: minPaidSpace?.hourlyPrice ?? null,
        costType: minPaidSpace ? CostType.Paid : first.costType,
        securityLevel: Math.max(...items.map((space) => space.securityLevel)),
      });
    }

    return result.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  private setCurrentLocation(showError: boolean): void {
    if (!navigator.geolocation) {
      if (showError) this.error.set('Geolocation is not available in this browser.');
      this.search();
      return;
    }
    if (showError) this.error.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.lat = pos.coords.latitude;
        this.lng = pos.coords.longitude;
        this.suggestions.set([]);
        this.geo.reverse(this.lat, this.lng).subscribe({
          next: (p) => {
            this.query = p.displayName;
            this.placeLabel.set(p.displayName);
          },
          error: () => this.placeLabel.set('your location'),
        });
        this.search();
      },
      () => {
        if (showError) this.error.set('Could not get your location. Allow location access or type an address.');
        this.search();
      },
    );
  }
}
