import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../core/payment.service';
import { ParkingService } from '../../core/parking.service';
import { BookingDto, PaymentMethod, SavedPaymentMethodDto } from '../../core/models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <h1>Payments</h1>

    <h2>Payment Methods</h2>
    <div class="facility-list">
      @for (m of methods(); track m.id) {
        <div class="card facility-item">
          <div>
            <strong>{{ methodLabel(m) }}</strong>
            @if (m.isDefault) { <span class="badge ok">Default</span> }
          </div>
          <div class="chip-row">
            @if (!m.isDefault) { <button class="ghost sm" (click)="setDefault(m)">Make default</button> }
            <button class="ghost sm" (click)="remove(m)">Remove</button>
          </div>
        </div>
      } @empty {
        <p class="muted">No saved payment methods yet.</p>
      }
    </div>

    @if (!adding()) {
      <button class="primary sm" (click)="adding.set(true)">+ Add Payment Method</button>
    } @else {
      <form class="card owner-grid" (ngSubmit)="add()">
        <label>Type
          <select [(ngModel)]="method" name="method">
            <option [ngValue]="PaymentMethod.Card">Card</option>
            <option [ngValue]="PaymentMethod.UPI">UPI</option>
            <option [ngValue]="PaymentMethod.Wallet">Wallet</option>
            <option [ngValue]="PaymentMethod.FASTag">FASTag</option>
          </select>
        </label>
        @if (method === PaymentMethod.Card) {
          <label>Brand <input [(ngModel)]="brand" name="brand" placeholder="Visa" /></label>
          <label>Last 4 digits <input [(ngModel)]="last4" name="last4" maxlength="4" placeholder="4567" /></label>
          <label>Expiry month <input type="number" [(ngModel)]="expiryMonth" name="expiryMonth" min="1" max="12" /></label>
          <label>Expiry year <input type="number" [(ngModel)]="expiryYear" name="expiryYear" min="2024" /></label>
        }
        <div class="chip-row">
          <button class="primary sm" type="submit">Save</button>
          <button class="ghost sm" type="button" (click)="adding.set(false)">Cancel</button>
        </div>
      </form>
    }

    <h2>Payment History</h2>
    @if (loading()) { <p class="muted">Loading…</p> }
    <div class="facility-list">
      @for (b of paymentHistory(); track b.id) {
        <div class="card facility-item">
          <div>
            <strong>{{ b.facilityName }}</strong>
            <p class="muted">{{ b.startTime | date: 'medium' }}</p>
          </div>
          <div>₹{{ b.amount }}</div>
        </div>
      } @empty {
        @if (!loading()) { <p class="muted">No payments yet.</p> }
      }
    </div>
  `,
})
export class PaymentsComponent implements OnInit {
  readonly PaymentMethod = PaymentMethod;
  methods = signal<SavedPaymentMethodDto[]>([]);
  paymentHistory = signal<BookingDto[]>([]);
  loading = signal(false);
  adding = signal(false);

  method: PaymentMethod = PaymentMethod.Card;
  brand = '';
  last4 = '';
  expiryMonth: number | null = null;
  expiryYear: number | null = null;

  constructor(private payments: PaymentService, private parking: ParkingService) {}

  ngOnInit(): void {
    this.payments.list().subscribe((m) => this.methods.set(m));

    this.loading.set(true);
    this.parking.myBookings().subscribe({
      next: (bookings) => {
        this.paymentHistory.set(bookings.filter((b) => b.paymentStatus !== null && b.paymentStatus !== undefined));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  methodLabel(m: SavedPaymentMethodDto): string {
    if (m.method === PaymentMethod.Card) return `${m.brand ?? 'Card'} … ${m.last4} (exp ${m.expiryMonth}/${m.expiryYear})`;
    return PaymentMethod[m.method];
  }

  add(): void {
    this.payments.add({
      method: this.method,
      brand: this.method === PaymentMethod.Card ? this.brand : null,
      last4: this.method === PaymentMethod.Card ? this.last4 : null,
      expiryMonth: this.method === PaymentMethod.Card ? this.expiryMonth : null,
      expiryYear: this.method === PaymentMethod.Card ? this.expiryYear : null,
    }).subscribe((m) => {
      this.methods.update((list) => [...list, m]);
      this.adding.set(false);
      this.brand = '';
      this.last4 = '';
      this.expiryMonth = null;
      this.expiryYear = null;
    });
  }

  setDefault(m: SavedPaymentMethodDto): void {
    this.payments.setDefault(m.id).subscribe(() =>
      this.methods.update((list) => list.map((x) => ({ ...x, isDefault: x.id === m.id }))));
  }

  remove(m: SavedPaymentMethodDto): void {
    this.payments.remove(m.id).subscribe(() =>
      this.methods.update((list) => list.filter((x) => x.id !== m.id)));
  }
}
