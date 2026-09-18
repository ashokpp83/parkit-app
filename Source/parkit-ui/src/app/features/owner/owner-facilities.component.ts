import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { CostType, FacilityCreateRequest, FacilityDetailDto, FacilityServiceDto, FacilitySummaryDto, OwnerServiceBookingDto, ValueAddedServiceType, VehicleType } from '../../core/models';
import { GeocodingService, GeoPlace } from '../../core/geocoding.service';
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
const ALL_SERVICE_TYPES = Object.keys(SERVICE_NAMES).map(Number) as ValueAddedServiceType[];

@Component({
  selector: 'app-owner-facilities',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="owner-nav">
      <h1>Facility Management</h1>
      <div class="nav-links">
        <a routerLink="/owner" class="nav-link">Dashboard</a>
        <a routerLink="/owner/facilities" class="nav-link active">Facilities</a>
        <a routerLink="/owner/bookings" class="nav-link">Bookings</a>
      </div>
    </div>
    <div class="card">
      <div class="owner-layout">
        <div class="owner-layout-map">
          <label>Pick location on map</label>
          <div #facilityMap class="leaflet-container facility-map"></div>
          <p class="hint">Search or click the map to set the facility location. The address is captured automatically.</p>
          @if (selectedLocation()) {
            <p class="meta">Selected: {{ selectedLocation() }}</p>
          }
        </div>

        <div class="owner-layout-details">
          <div class="owner-add-panel">
            <h2>{{ editingFacilityId() ? 'Edit facility' : 'Add facility' }}</h2>
            <p class="muted">
              @if (editingFacilityId()) {
                Update your facility details.
              } @else {
                Facility owners can list a parking location so drivers can find it.
              }
            </p>

            <div class="owner-grid">
              <div>
                <label>Facility name</label>
                <input [(ngModel)]="form.name" />
              </div>
              <div>
                <label>Business name</label>
                <input [(ngModel)]="form.businessName" placeholder="Optional" />
              </div>
              <div class="full-width">
                <label>Selected address</label>
                <input [(ngModel)]="form.addressText" placeholder="Pick a point on the map" />
                <div class="input-row owner-location-row">
                  <input
                    [(ngModel)]="locationSearch"
                    placeholder="Search the location on OpenStreetMap"
                    (keydown.enter)="findLocation()" />
                  <button class="ghost" type="button" (click)="findLocation()">Find on map</button>
                </div>
              </div>
              <div class="full-width">
                <label>Access instructions</label>
                <input [(ngModel)]="form.accessInstructions" placeholder="Gate code, landmark, entry route" />
              </div>
              <div>
                <label>Level</label>
                <input [(ngModel)]="form.level" placeholder="Ground" />
              </div>
              <div>
                <label>Slot label</label>
                <input [(ngModel)]="form.slotLabel" placeholder="A-1" />
              </div>
              <div>
                <label>Max vehicle type</label>
                <select [(ngModel)]="form.maxVehicleType">
                  <option [ngValue]="VehicleType.TwoWheeler">Motorcycle</option>
                  <option [ngValue]="VehicleType.Sedan">Car</option>
                  <option [ngValue]="VehicleType.SUV">SUV</option>
                  <option [ngValue]="VehicleType.EV">Electric vehicle</option>
                  <option [ngValue]="VehicleType.Commercial">Commercial vehicle</option>
                </select>
              </div>
              <div>
                <label>Total slots</label>
                <input type="number" [(ngModel)]="form.totalSlots" min="1" />
              </div>
              <div>
                <label>Available slots</label>
                <input type="number" [(ngModel)]="form.availableSlots" min="0" />
              </div>
              <div>
                <label>Pricing</label>
                <select [(ngModel)]="form.costType">
                  <option [ngValue]="CostType.Free">Free</option>
                  <option [ngValue]="CostType.Paid">Paid</option>
                </select>
              </div>
              <div>
                <label>Hourly price (₹)</label>
                <input type="number" [(ngModel)]="form.hourlyPrice" min="0" />
              </div>
              <div>
                <label>Security level</label>
                <input type="number" [(ngModel)]="form.securityLevel" min="1" max="5" />
              </div>
              <div class="checkbox-row full-width">
                <label><input type="checkbox" [(ngModel)]="form.covered" /> Covered</label>
                <label><input type="checkbox" [(ngModel)]="form.gated" /> Gated</label>
                <label><input type="checkbox" [(ngModel)]="form.cctv" /> CCTV</label>
                <label><input type="checkbox" [(ngModel)]="form.evCharging" /> EV charging</label>
                <label><input type="checkbox" [(ngModel)]="form.lift" /> Lift</label>
                <label><input type="checkbox" [(ngModel)]="form.handicappedAccess" /> Wheelchair access</label>
                <label><input type="checkbox" [(ngModel)]="form.guard" /> Security personnel</label>
                <label><input type="checkbox" [(ngModel)]="form.wellLit" /> Well lit</label>
                <label><input type="checkbox" [(ngModel)]="form.twoWheeler" /> Two-wheeler</label>
                <label><input type="checkbox" [(ngModel)]="form.is24x7" /> 24x7</label>
              </div>
            </div>
            @if (error()) { <p class="error">{{ error() }}</p> }
            @if (success()) { <p class="success">{{ success() }}</p> }

            <div class="action-row">
              <button class="primary" type="button" [disabled]="loading()" (click)="submit()">
                {{ loading() ? 'Saving…' : (editingFacilityId() ? 'Update facility' : 'Save facility') }}
              </button>
              @if (editingFacilityId()) {
                <button class="ghost" type="button" [disabled]="loading()" (click)="cancelEdit()">Cancel edit</button>
              }
            </div>

            @if (editingFacilityId() && currentFacility()) {
              <div class="photo-management">
                <h3>Facility photos</h3>
                <p class="muted">Upload photos of your parking facility to help drivers during booking.</p>
                
                <div class="photo-upload-section">
                  <label>Add photo</label>
                  <div class="file-input-wrapper">
                    <input 
                      #photoInput 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp"
                      (change)="onPhotoSelected($event)" 
                      style="display: none" />
                    <button 
                      class="ghost" 
                      type="button" 
                      (click)="photoInput.click()"
                      [disabled]="photoUploading()">
                      {{ photoUploading() ? 'Uploading…' : 'Choose image' }}
                    </button>
                  </div>
                  @if (photoError()) { <p class="error">{{ photoError() }}</p> }
                  @if (photoSuccess()) { <p class="success">{{ photoSuccess() }}</p> }
                </div>

                @if (currentFacility()?.photos && currentFacility()!.photos!.length > 0) {
                  <div class="photo-gallery">
                    <h4>{{ currentFacility()!.photos!.length }} photo(s)</h4>
                    <div class="gallery-grid">
                      @for (photo of currentFacility()?.photos; track photo.id) {
                        <div class="photo-item">
                          <img [src]="photo.blobUrl" [alt]="photo.fileName" />
                          <button 
                            class="delete-btn" 
                            type="button"
                            (click)="deletePhoto(photo.id)"
                            [disabled]="photoDeleting()">
                            Delete
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <p class="muted">No photos yet. Add one to get started.</p>
                }
              </div>
            }
          </div>

          <div class="owner-facilities-panel">
            <h2>Your facilities</h2>
            @if (facilities().length === 0) {
              <p class="muted">No facilities added yet.</p>
            } @else {
              <div class="facility-list">
                @for (facility of facilities(); track facility.id) {
                  <div class="facility-item">
                    <div>
                      <h3>{{ facility.name }}</h3>
                      <p class="muted">{{ facility.addressText }}</p>
                      <p class="meta">
                        {{ facility.level || 'Ground' }} •
                        {{ facility.costType === CostType.Paid ? '₹' + (facility.hourlyPrice ?? 0) + '/hr' : 'Free' }} •
                        {{ facility.availableSlots }}/{{ facility.totalSlots }} available •
                        {{ facility.isApproved ? 'Approved' : 'Pending approval' }}
                      </p>
                    </div>
                    <span class="badge" [class.ok]="facility.isApproved" [class.warn]="!facility.isApproved">
                      {{ facility.isApproved ? 'Live' : 'Review' }}
                    </span>
                    <button class="ghost sm" type="button" (click)="startEdit(facility)">Edit</button>
                    <button class="ghost sm" type="button" (click)="openServices(facility)">Services</button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    @if (servicesFacility()) {
      <div class="modal-backdrop" (click)="closeServices()"></div>
      <div class="modal-card booking-detail">
        <div class="modal-header">
          <h2>Services &mdash; {{ servicesFacility()!.name }}</h2>
          <button class="ghost sm" type="button" (click)="closeServices()">Close</button>
        </div>

        <h3>Value-added services</h3>
        <p class="muted">Choose which services this facility offers and set your own price. Car owners will only see and book the services you enable here.</p>
        <div class="facility-list">
          @for (item of serviceForm; track item.serviceType) {
            <div class="card facility-item service-row">
              <label class="service-check">
                <input type="checkbox" [(ngModel)]="item.isEnabled" [ngModelOptions]="{standalone: true}" />
                <span>{{ nameFor(item.serviceType) }}</span>
              </label>
              <div class="service-price">
                <span>₹</span>
                <input type="number" min="0" [(ngModel)]="item.price" [ngModelOptions]="{standalone: true}" [disabled]="!item.isEnabled" />
              </div>
            </div>
          }
        </div>
        @if (servicesError()) { <p class="error">{{ servicesError() }}</p> }
        @if (servicesSuccess()) { <p class="success">{{ servicesSuccess() }}</p> }
        <div class="action-row">
          <button class="primary" type="button" [disabled]="servicesSaving()" (click)="saveServices()">
            {{ servicesSaving() ? 'Saving…' : 'Save services' }}
          </button>
        </div>

        <h3>Service bookings for this facility</h3>
        <p class="muted">Read-only &mdash; car owners book directly; costs are shown here for your records.</p>
        <div class="facility-list">
          @for (b of facilityServiceBookings(); track b.id) {
            <div class="card facility-item">
              <div>
                <strong>{{ nameFor(b.serviceType) }}</strong>
                <p class="muted">{{ b.customerName }} • {{ b.customerEmail }}</p>
              </div>
              <div>₹{{ b.amount }}</div>
            </div>
          } @empty {
            <p class="muted">No service bookings yet for this facility.</p>
          }
        </div>
      </div>
    }
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
export class OwnerFacilitiesComponent {
  @ViewChild('facilityMap') facilityMapEl!: ElementRef<HTMLDivElement>;

  readonly CostType = CostType;
  readonly VehicleType = VehicleType;
  locationSearch = '';
  form: FacilityCreateRequest = this.newFacilityForm();

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  selectedLocation = signal<string | null>(null);
  facilities = signal<FacilitySummaryDto[]>([]);
  editingFacilityId = signal<string | null>(null);
  currentFacility = signal<FacilityDetailDto | null>(null);
  photoUploading = signal(false);
  photoDeleting = signal(false);
  photoError = signal<string | null>(null);
  photoSuccess = signal<string | null>(null);

  serviceForm: FacilityServiceDto[] = ALL_SERVICE_TYPES.map((t) => ({ serviceType: t, price: 0, isEnabled: false }));
  servicesSaving = signal(false);
  servicesError = signal<string | null>(null);
  servicesSuccess = signal<string | null>(null);
  facilityServiceBookings = signal<OwnerServiceBookingDto[]>([]);
  servicesFacility = signal<FacilitySummaryDto | null>(null);

  private map?: L.Map;
  private marker?: L.Marker;
  private facilityMarkers?: L.LayerGroup;

  constructor(private parking: ParkingService, private geo: GeocodingService, private serviceBookings: ServiceBookingService) {
    this.loadFacilities();
  }

  nameFor(type: ValueAddedServiceType): string {
    return SERVICE_NAMES[type] ?? ValueAddedServiceType[type];
  }

  openServices(facility: FacilitySummaryDto): void {
    this.servicesFacility.set(facility);
    this.servicesError.set(null);
    this.servicesSuccess.set(null);
    this.loadServicesForFacility(facility.id);
  }

  closeServices(): void {
    this.servicesFacility.set(null);
    this.servicesError.set(null);
    this.servicesSuccess.set(null);
    this.facilityServiceBookings.set([]);
  }

  saveServices(): void {
    const facilityId = this.servicesFacility()?.id;
    if (!facilityId) return;
    this.servicesSaving.set(true);
    this.servicesError.set(null);
    this.servicesSuccess.set(null);
    const services = this.serviceForm.filter((s) => s.isEnabled);
    this.parking.upsertFacilityServices(facilityId, { services }).subscribe({
      next: () => {
        this.servicesSaving.set(false);
        this.servicesSuccess.set('Services updated.');
      },
      error: (e) => {
        this.servicesSaving.set(false);
        this.servicesError.set(e?.error?.error?.message ?? 'Could not save services.');
      },
    });
  }

  private loadServicesForFacility(facilityId: string): void {
    this.serviceForm = ALL_SERVICE_TYPES.map((t) => ({ serviceType: t, price: 0, isEnabled: false }));
    this.parking.facilityServicesForOwner(facilityId).subscribe({
      next: (existing) => {
        for (const item of existing) {
          const entry = this.serviceForm.find((s) => s.serviceType === item.serviceType);
          if (entry) { entry.price = item.price; entry.isEnabled = item.isEnabled; }
        }
      },
    });
    this.serviceBookings.listForFacility(facilityId).subscribe({
      next: (list) => this.facilityServiceBookings.set(list),
      error: () => this.facilityServiceBookings.set([]),
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap(this.form.latitude, this.form.longitude);
    this.setMapToCurrentLocation();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  findLocation(): void {
    const query = (this.locationSearch || this.form.addressText || '').trim();
    if (!query) {
      this.error.set('Enter an address or landmark to search on the map.');
      return;
    }

    this.error.set(null);
    this.geo.search(query, 1).subscribe({
      next: (places) => {
        const place = places[0];
        if (!place) {
          this.error.set('Could not find that location on OpenStreetMap.');
          return;
        }
        this.locationSearch = place.displayName;
        this.setCoordinates(place.lat, place.lng, false, place.displayName);
      },
      error: () => this.error.set('Could not search the map right now.'),
    });
  }

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    const editId = this.editingFacilityId();
    const request = editId
      ? this.parking.updateFacility(editId, this.form)
      : this.parking.createFacility(this.form);

    request.subscribe({
      next: (facility) => {
        this.loading.set(false);
        this.success.set(editId
          ? `Facility "${facility.name}" updated successfully.`
          : `Facility "${facility.name}" saved successfully.`);
        this.cancelEdit();
        this.loadFacilities();
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.error?.message ?? 'Could not save facility.');
      },
    });
  }

  startEdit(facility: FacilitySummaryDto): void {
    this.error.set(null);
    this.success.set(null);
    this.photoError.set(null);
    this.photoSuccess.set(null);
    this.editingFacilityId.set(facility.id);
    
    // Load full facility details including photos
    this.parking.getFacility(facility.id).subscribe({
      next: (detail) => this.currentFacility.set(detail),
      error: () => this.currentFacility.set(null),
    });
    
    this.form = {
      ...this.form,
      name: facility.name,
      addressText: facility.addressText,
      latitude: facility.latitude,
      longitude: facility.longitude,
      accessInstructions: facility.accessInstructions ?? '',
      level: facility.level ?? 'Ground',
      slotLabel: facility.slotLabel ?? 'A-1',
      maxVehicleType: facility.maxVehicleType,
      totalSlots: facility.totalSlots,
      availableSlots: facility.availableSlots,
      costType: facility.costType,
      hourlyPrice: facility.hourlyPrice ?? this.form.hourlyPrice,
      securityLevel: facility.securityLevel,
      covered: facility.covered,
      gated: facility.gated,
      cctv: facility.cctv,
      evCharging: facility.evCharging,
      lift: facility.lift,
      handicappedAccess: facility.handicappedAccess,
      guard: facility.guard,
      wellLit: facility.wellLit,
      twoWheeler: facility.twoWheeler,
      is24x7: facility.is24x7,
    };
    this.locationSearch = facility.addressText;
    this.selectedLocation.set(facility.addressText);
    this.syncMap();
  }

  cancelEdit(): void {
    this.editingFacilityId.set(null);
    this.currentFacility.set(null);
    this.form = this.newFacilityForm();
    this.locationSearch = '';
    this.selectedLocation.set(null);
    this.photoError.set(null);
    this.photoSuccess.set(null);
    this.setMapToCurrentLocation();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError.set('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.photoError.set('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      this.uploadPhoto(file.name, base64Data);
    };
    reader.onerror = () => {
      this.photoError.set('Failed to read the image file.');
    };
    reader.readAsDataURL(file);

    // Reset input for same file selection
    input.value = '';
  }

  private uploadPhoto(fileName: string, base64Data: string): void {
    const facilityId = this.editingFacilityId();
    if (!facilityId) return;

    this.photoUploading.set(true);
    this.photoError.set(null);
    this.photoSuccess.set(null);

    this.parking.uploadFacilityPhoto(facilityId, { fileName, base64Data: `data:image/jpeg;base64,${base64Data}` }).subscribe({
      next: () => {
        this.photoUploading.set(false);
        this.photoSuccess.set('Photo uploaded successfully.');
        this.reloadFacilityDetails();
      },
      error: (e) => {
        this.photoUploading.set(false);
        this.photoError.set(e?.error?.error?.message ?? 'Failed to upload photo.');
      },
    });
  }

  deletePhoto(photoId: string): void {
    if (!confirm('Delete this photo?')) return;

    this.photoDeleting.set(true);
    this.photoError.set(null);
    this.photoSuccess.set(null);

    this.parking.deleteFacilityPhoto(photoId).subscribe({
      next: () => {
        this.photoDeleting.set(false);
        this.photoSuccess.set('Photo deleted successfully.');
        this.reloadFacilityDetails();
      },
      error: (e) => {
        this.photoDeleting.set(false);
        this.photoError.set(e?.error?.error?.message ?? 'Failed to delete photo.');
      },
    });
  }

  private reloadFacilityDetails(): void {
    const facilityId = this.editingFacilityId();
    if (!facilityId) return;
    this.parking.getFacility(facilityId).subscribe({
      next: (detail) => this.currentFacility.set(detail),
      error: () => { /* keep existing data */ },
    });
  }

  private loadFacilities(): void {
    this.parking.myFacilities().subscribe({
      next: (items) => {
        this.facilities.set(items);
        this.renderFacilityMarkers(true);
      },
      error: () => {
        this.facilities.set([]);
        this.renderFacilityMarkers();
      },
    });
  }

  private setCoordinates(lat: number, lng: number, reverseLookup: boolean, label?: string): void {
    this.form.latitude = lat;
    this.form.longitude = lng;
    this.marker?.setLatLng([lat, lng]);
    this.map?.panTo([lat, lng]);

    if (reverseLookup) {
      this.geo.reverse(lat, lng).subscribe({
        next: (place: GeoPlace) => {
          this.form.addressText = place.displayName;
          this.locationSearch = place.displayName;
          this.selectedLocation.set(place.displayName);
        },
        error: () => {
          this.selectedLocation.set(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        },
      });
      return;
    }

    const resolved = label ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    this.form.addressText = resolved;
    this.selectedLocation.set(resolved);
    this.syncMap();
  }

  private syncMap(): void {
    if (!this.marker || !this.map) return;
    this.marker.setLatLng([this.form.latitude, this.form.longitude]);
    this.map.setView([this.form.latitude, this.form.longitude], 15);
  }

  private initializeMap(lat: number, lng: number): void {
    this.map = L.map(this.facilityMapEl.nativeElement, { center: [lat, lng], zoom: 15 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.facilityMarkers = L.layerGroup().addTo(this.map);
    this.marker.on('dragend', () => {
      const pos = this.marker?.getLatLng();
      if (!pos) return;
      this.setCoordinates(pos.lat, pos.lng, true);
    });

    this.map.on('click', (ev: L.LeafletMouseEvent) => this.setCoordinates(ev.latlng.lat, ev.latlng.lng, true));
    setTimeout(() => {
      this.map?.invalidateSize();
      this.renderFacilityMarkers(true);
    }, 0);
  }

  private renderFacilityMarkers(zoomToFit = false): void {
    if (!this.map || !this.facilityMarkers) return;
    this.facilityMarkers.clearLayers();

    const items = this.facilities();
    if (!items.length) return;

    const bounds = L.latLngBounds([]);
    for (const facility of items) {
      const point = L.latLng(facility.latitude, facility.longitude);
      bounds.extend(point);

      const marker = L.circleMarker(point, {
        radius: 8,
        color: facility.isApproved ? '#29c17e' : '#e0a531',
        fillColor: facility.isApproved ? '#29c17e' : '#e0a531',
        fillOpacity: 0.85,
        weight: 2,
      });

      const popupContent = document.createElement('div');
      const title = document.createElement('b');
      title.textContent = facility.name;
      const address = document.createElement('div');
      address.textContent = facility.addressText;
      const availability = document.createElement('div');
      availability.textContent = `${facility.availableSlots}/${facility.totalSlots} available`;
      popupContent.append(title, address, availability);

      marker.bindPopup(popupContent);
      marker.addTo(this.facilityMarkers);
    }

    if (zoomToFit && bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
    }
  }

  private setMapToCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.setCoordinates(this.form.latitude, this.form.longitude, true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => this.setCoordinates(pos.coords.latitude, pos.coords.longitude, true, 'Current location'),
      () => this.setCoordinates(this.form.latitude, this.form.longitude, true),
    );
  }

  private newFacilityForm(): FacilityCreateRequest {
    return {
      name: '',
      addressText: '',
      latitude: 13.085,
      longitude: 80.21,
      accessInstructions: '',
      businessName: '',
      level: 'Ground',
      slotLabel: 'A-1',
      maxVehicleType: VehicleType.SUV,
      totalSlots: 5,
      availableSlots: 5,
      costType: CostType.Paid,
      hourlyPrice: 40,
      securityLevel: 3,
      covered: true,
      gated: true,
      cctv: true,
      evCharging: false,
      lift: false,
      handicappedAccess: false,
      guard: true,
      wellLit: true,
      twoWheeler: false,
      is24x7: true,
    };
  }
}
