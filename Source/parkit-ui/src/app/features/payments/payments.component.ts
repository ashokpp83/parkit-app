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
    <div class="page-head">
      <div>
        <h1>Payments</h1>
        <p class="hint">Saved methods and payment history</p>
      </div>
      @if (!adding()) {
        <button class="primary sm" (click)="adding.set(true)">+ Add</button>
      }
    </div>

    @if (adding()) {
      <form class="card" (ngSubmit)="add()">
        <h3>New payment method</h3>
        <label>Type</label>
        <div class="seg-tabs">
          <button type="button" [class.active]="method === PaymentMethod.Card" (click)="method = PaymentMethod.Card">Card</button>
          <button type="button" [class.active]="method === PaymentMethod.UPI" (click)="method = PaymentMethod.UPI">UPI</button>
          <button type="button" [class.active]="method === PaymentMethod.Wallet" (click)="method = PaymentMethod.Wallet">Wallet</button>
          <button type="button" [class.active]="method === PaymentMethod.FASTag" (click)="method = PaymentMethod.FASTag">FASTag</button>
        </div>
        @if (method === PaymentMethod.Card) {
          <div class="pay-grid">
            <div><label>Brand</label><input [(ngModel)]="brand" name="brand" placeholder="Visa" /></div>
            <div><label>Last 4 digits</label><input [(ngModel)]="last4" name="last4" maxlength="4" inputmode="numeric" placeholder="4567" /></div>
            <div><label>Expiry month</label><input type="number" inputmode="numeric" [(ngModel)]="expiryMonth" name="expiryMonth" min="1" max="12" placeholder="MM" /></div>
            <div><label>Expiry year</label><input type="number" inputmode="numeric" [(ngModel)]="expiryYear" name="expiryYear" min="2024" placeholder="YYYY" /></div>
          </div>
        }
        <div class="card-actions">
          <button class="ghost sm" type="button" (click)="adding.set(false)">Cancel</button>
          <button class="primary sm" type="submit">Save method</button>
        </div>
      </form>
    }

    <h2>Payment methods</h2>
    <div class="card list-card">
      @for (m of methods(); track m.id) {
        <div class="list-row">
          <span class="row-icon">{{ methodIcon(m) }}</span>
          <div class="row-main">
            <strong>{{ methodLabel(m) }}</strong>
            @if (m.isDefault) { <span class="badge ok">Default</span> }
          </div>
          <div class="row-actions">
            @if (!m.isDefault) { <button class="ghost sm" (click)="setDefault(m)">Set default</button> }
            <button class="ghost sm" (click)="remove(m)" aria-label="Remove">✕</button>
          </div>
        </div>
      } @empty {
        <div class="empty-state"><span class="icon">💳</span>No saved payment methods yet.</div>
      }
    </div>

    <h2>Payment history</h2>
    @if (loading()) { <p class="muted">Loading…</p> }
    <div class="card list-card">
      @for (b of paymentHistory(); track b.id) {
        <div class="list-row">
          <span class="row-icon">🅿️</span>
          <div class="row-main">
            <strong>{{ b.facilityName }}</strong>
            <span class="hint">{{ b.startTime | date: 'd MMM y, h:mm a' }}</span>
          </div>
          <strong class="amount">₹{{ b.amount }}</strong>
        </div>
      } @empty {
        @if (!loading()) { <div class="empty-state"><span class="icon">🧾</span>No payments yet.</div> }
      }
    </div>
  `,
  styles: [`
    .page-head .primary.sm { width: auto; margin: 0; }
    form.card h3 { margin-bottom: 4px; }
    .pay-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 12px; }
  `],
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

  methodIcon(m: SavedPaymentMethodDto): string {
    switch (m.method) {
      case PaymentMethod.Card: return '💳';
      case PaymentMethod.UPI: return '📱';
      case PaymentMethod.Wallet: return '👛';
      case PaymentMethod.FASTag: return '🏷️';
      default: return '💰';
    }
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
