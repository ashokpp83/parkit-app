import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ParkingService } from '../../core/parking.service';
import { BookingDto, PaymentMethod, PaymentStatus } from '../../core/models';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule],
  template: `
    <a class="back-link" routerLink="/search">&larr; Back to Find parking</a>
    <h1>My bookings</h1>
    @if (loading()) { <p class="muted">Loading…</p> }
    <div class="results">
      @for (b of bookings(); track b.id) {
        <div class="card space">
          <div class="space-top">
            <div>
              <h3>{{ b.facilityName }}</h3>
              <p class="meta">Slot {{ b.slotLabel }} · {{ b.vehicleRegistration }}</p>
              <p class="meta">Facility owner: {{ b.ownerName || 'N/A' }} · {{ b.ownerPhoneNumber || 'N/A' }}</p>
              <p class="meta">Email: {{ b.ownerEmail || 'N/A' }}</p>
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
            @if (b.qrToken) { <code class="qr">QR {{ b.qrToken.slice(0, 8) }}</code> }
            @if (needsPayment(b)) {
              <button class="primary sm" (click)="startPay(b)">Pay now</button>
            }
            @if (b.status !== 4 && b.status !== 3) {
              <button class="ghost sm" (click)="cancel(b)">Cancel</button>
            }
          </div>
          @if (payingId() === b.id) {
            <div class="space-bottom hours-row">
              <label class="hours-input">
                Payment method
                <select [(ngModel)]="payMethod" name="payMethod">
                  <option [ngValue]="PaymentMethod.UPI">UPI</option>
                  <option [ngValue]="PaymentMethod.Card">Card</option>
                  <option [ngValue]="PaymentMethod.Wallet">Wallet</option>
                </select>
              </label>
              <button class="primary sm" (click)="confirmPay(b)">Pay ₹{{ b.amount }}</button>
              <button class="ghost sm" (click)="payingId.set(null)">Cancel</button>
            </div>
          }
        </div>
      } @empty {
        @if (!loading()) { <p class="muted">No bookings yet.</p> }
      }
    </div>
  `,
})
export class BookingsComponent implements OnInit {
  readonly PaymentStatus = PaymentStatus;
  readonly PaymentMethod = PaymentMethod;
  bookings = signal<BookingDto[]>([]);
  loading = signal(false);
  payingId = signal<string | null>(null);
  payMethod: PaymentMethod = PaymentMethod.UPI;

  private labels = ['Pending', 'Confirmed', 'Checked in', 'Completed', 'Cancelled', 'No-show', 'Overstay', 'Failover'];
  private paymentLabels: Record<number, string> = {
    [PaymentStatus.Pending]: 'Payment pending',
    [PaymentStatus.Held]: 'Payment held',
    [PaymentStatus.Captured]: 'Paid',
    [PaymentStatus.Refunded]: 'Refunded',
    [PaymentStatus.PartialRefund]: 'Partially refunded',
    [PaymentStatus.Failed]: 'Payment failed',
  };

  constructor(private parking: ParkingService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.parking.myBookings().subscribe((b) => { this.bookings.set(b); this.loading.set(false); });
  }

  cancel(b: BookingDto): void {
    this.parking.cancel(b.id).subscribe((updated) =>
      this.bookings.update((list) => list.map((x) => (x.id === updated.id ? updated : x))));
  }

  needsPayment(b: BookingDto): boolean {
    return b.amount > 0 && b.paymentStatus !== null && b.paymentStatus !== undefined
      && b.paymentStatus !== PaymentStatus.Captured && b.status !== 4;
  }

  startPay(b: BookingDto): void {
    this.payMethod = PaymentMethod.UPI;
    this.payingId.set(b.id);
  }

  confirmPay(b: BookingDto): void {
    this.parking.pay(b.id, this.payMethod).subscribe({
      next: (updated) => {
        this.bookings.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.payingId.set(null);
      },
    });
  }

  statusLabel(s: number): string {
    return this.labels[s] ?? String(s);
  }

  paymentStatusLabel(s: PaymentStatus): string {
    return this.paymentLabels[s] ?? `Status ${s}`;
  }
}

