import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ParkingService } from '../../core/parking.service';
import { UpsertVehicleRequest, VehicleDto, VehicleType } from '../../core/models';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <a class="back-link" routerLink="/search">&larr; Back to Find parking</a>
    <div class="card">
      <h1>My vehicles</h1>
      <p class="muted">Add every vehicle you own so you can pick the right one while booking a slot.</p>

      @if (vehicles().length === 0) {
        <p class="muted">No vehicles added yet.</p>
      } @else {
        <div class="facility-list">
          @for (v of vehicles(); track v.id) {
            <div class="facility-item">
              <div>
                <h3>{{ v.registrationNumber }}</h3>
                <p class="meta">{{ vehicleTypeLabel(v.type) }}</p>
              </div>
              <span class="badge" [class.ok]="v.isVerified" [class.warn]="!v.isVerified">
                {{ v.isVerified ? 'Verified' : 'Unverified' }}
              </span>
              <button class="ghost sm" type="button" (click)="startEdit(v)">Edit</button>
              <button class="ghost sm" type="button" (click)="remove(v)">Delete</button>
            </div>
          }
        </div>
      }
    </div>

    <div class="card">
      <h2>{{ editingId() ? 'Edit vehicle' : 'Add vehicle' }}</h2>
      <div class="owner-grid">
        <div>
          <label>Registration number</label>
          <input [(ngModel)]="form.registrationNumber" placeholder="TN 09 AB 1234" />
        </div>
        <div>
          <label>Vehicle type</label>
          <select [(ngModel)]="form.type">
            <option [ngValue]="VehicleType.TwoWheeler">Motorcycle</option>
            <option [ngValue]="VehicleType.Hatchback">Hatchback</option>
            <option [ngValue]="VehicleType.Sedan">Sedan / Car</option>
            <option [ngValue]="VehicleType.SUV">SUV</option>
            <option [ngValue]="VehicleType.MUV">MUV</option>
            <option [ngValue]="VehicleType.Luxury">Luxury</option>
            <option [ngValue]="VehicleType.EV">Electric vehicle</option>
            <option [ngValue]="VehicleType.Commercial">Commercial vehicle</option>
          </select>
        </div>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (success()) { <p class="success">{{ success() }}</p> }

      <div class="action-row">
        <button class="primary" type="button" [disabled]="loading()" (click)="submit()">
          {{ loading() ? 'Saving…' : (editingId() ? 'Update vehicle' : 'Add vehicle') }}
        </button>
        @if (editingId()) {
          <button class="ghost" type="button" [disabled]="loading()" (click)="cancelEdit()">Cancel edit</button>
        }
      </div>
    </div>
  `,
})
export class VehiclesComponent {
  readonly VehicleType = VehicleType;
  vehicles = signal<VehicleDto[]>([]);
  editingId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form: UpsertVehicleRequest = this.emptyForm();

  private readonly typeLabels: Record<number, string> = {
    [VehicleType.Hatchback]: 'Hatchback',
    [VehicleType.Sedan]: 'Sedan / Car',
    [VehicleType.SUV]: 'SUV',
    [VehicleType.MUV]: 'MUV',
    [VehicleType.Luxury]: 'Luxury',
    [VehicleType.EV]: 'Electric vehicle',
    [VehicleType.Commercial]: 'Commercial vehicle',
    [VehicleType.TwoWheeler]: 'Motorcycle',
  };

  constructor(private parking: ParkingService) {
    this.load();
  }

  vehicleTypeLabel(type: VehicleType): string {
    return this.typeLabels[type] ?? `Type ${type}`;
  }

  startEdit(v: VehicleDto): void {
    this.editingId.set(v.id);
    this.form = { registrationNumber: v.registrationNumber, type: v.type, length: v.length, width: v.width, height: v.height };
    this.error.set(null);
    this.success.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
  }

  submit(): void {
    if (!this.form.registrationNumber?.trim()) {
      this.error.set('Enter a registration number.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    const editId = this.editingId();
    const request = editId ? this.parking.updateVehicle(editId, this.form) : this.parking.addVehicle(this.form);

    request.subscribe({
      next: (v) => {
        this.loading.set(false);
        this.success.set(editId ? `Vehicle "${v.registrationNumber}" updated.` : `Vehicle "${v.registrationNumber}" added.`);
        this.cancelEdit();
        this.load();
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.error?.message ?? 'Could not save vehicle.');
      },
    });
  }

  remove(v: VehicleDto): void {
    this.parking.deleteVehicle(v.id).subscribe({
      next: () => this.vehicles.update((list) => list.filter((x) => x.id !== v.id)),
      error: (e) => this.error.set(e?.error?.error?.message ?? 'Could not delete vehicle.'),
    });
  }

  private load(): void {
    this.parking.vehicles().subscribe({
      next: (v) => this.vehicles.set(v),
      error: () => this.vehicles.set([]),
    });
  }

  private emptyForm(): UpsertVehicleRequest {
    return { registrationNumber: '', type: VehicleType.Sedan, length: null, width: null, height: null };
  }
}
