import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FacilitySummaryDto, OwnerDashboardStatisticsDto } from '../../core/models';
import { ParkingService } from '../../core/parking.service';

interface FacilityStatistics extends FacilitySummaryDto {
  occupancyRate: number;
}

interface DashboardStats {
  totalFacilities: number;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  facilities: FacilityStatistics[];
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dash">
      <header class="dash-head">
        <div>
          <p class="eyebrow">Facility owner</p>
          <h1>Dashboard</h1>
        </div>
        <a routerLink="/owner/facilities" class="head-action">+ Facility</a>
      </header>

      @if (loading()) {
        <p class="muted">Loading dashboard…</p>
      } @else if (error()) {
        <div class="banner error">{{ error() }}</div>
      } @else {
        <section class="hero">
          <span class="hero-label">Total revenue</span>
          <div class="hero-value">₹{{ (adv()?.totalRevenue ?? 0) | number: '1.0-0' }}</div>
          <div class="hero-meta">
            <div><strong>{{ adv()?.totalBookings ?? 0 }}</strong><span>Bookings</span></div>
            <div><strong>₹{{ (adv()?.averageRevenuePerBooking ?? 0) | number: '1.0-0' }}</strong><span>Avg / booking</span></div>
          </div>
        </section>

        <section class="kpis">
          <div class="kpi"><span class="kpi-icon">🏢</span><strong>{{ stats()!.totalFacilities }}</strong><span>Facilities</span></div>
          <div class="kpi"><span class="kpi-icon">🅿️</span><strong>{{ stats()!.totalSpaces }}</strong><span>Total slots</span></div>
          <div class="kpi"><span class="kpi-icon">✅</span><strong [class.warn]="stats()!.availableSpaces < 5">{{ stats()!.availableSpaces }}</strong><span>Available now</span></div>
          <div class="kpi"><span class="kpi-icon">📈</span><strong>{{ occupancyNow() | number: '1.0-0' }}%</strong><span>Occupied now</span></div>
        </section>

        @if (adv()?.occupancyByHour?.length) {
          <section class="panel">
            <div class="panel-head">
              <h2>Occupancy by hour</h2>
              @if (peakHour(); as peak) {
                <span class="pill">Peak {{ peak.hour }}:00 · {{ peak.occupancyPercentage | number: '1.0-0' }}%</span>
              }
            </div>
            <div class="chart" role="list">
              @for (h of adv()!.occupancyByHour; track h.hour) {
                <div class="bar" role="listitem" [title]="h.hour + ':00 – ' + (h.occupancyPercentage | number: '1.0-0') + '%'">
                  <div class="bar-track">
                    <div class="bar-fill" [style.height.%]="h.occupancyPercentage"
                      [class.high]="h.occupancyPercentage > 75"
                      [class.mid]="h.occupancyPercentage >= 50 && h.occupancyPercentage <= 75"></div>
                  </div>
                  <span class="bar-label">{{ h.hour }}</span>
                </div>
              }
            </div>
            <p class="hint swipe-hint">Swipe to see all hours</p>
          </section>
        }

        @if (adv()?.revenueByFacility?.length) {
          <section class="panel">
            <div class="panel-head">
              <h2>Revenue by facility</h2>
              <a routerLink="/owner/facilities" class="link">Manage</a>
            </div>
            <ul class="rows">
              @for (f of adv()!.revenueByFacility; track f.facilityId) {
                <li class="row">
                  <div class="row-main">
                    <h3>{{ f.facilityName }}</h3>
                    <p class="muted">{{ f.bookingCount }} bookings · ₹{{ f.averageRevenuePerBooking | number: '1.0-0' }} avg</p>
                    <div class="share"><div class="share-fill" [style.width.%]="share(f.totalRevenue)"></div></div>
                  </div>
                  <strong class="amount">₹{{ f.totalRevenue | number: '1.0-0' }}</strong>
                </li>
              }
            </ul>
          </section>
        }

        @if (adv()?.topCustomers?.length) {
          <section class="panel">
            <div class="panel-head"><h2>Top customers</h2></div>
            <ul class="rows">
              @for (c of adv()!.topCustomers; track c.customerEmail) {
                <li class="row">
                  <span class="avatar">{{ initials(c.customerName) }}</span>
                  <div class="row-main">
                    <h3>{{ c.customerName }}</h3>
                    <p class="muted">{{ c.bookingCount }} bookings · last {{ c.lastBookingDate | date: 'd MMM' }}</p>
                  </div>
                  <strong class="amount">₹{{ c.totalRevenue | number: '1.0-0' }}</strong>
                </li>
              }
            </ul>
          </section>
        }

        @if (adv()?.customerStickiness?.length) {
          <section class="panel">
            <div class="panel-head"><h2>Repeat customers</h2></div>
            <div class="carousel">
              @for (c of adv()!.customerStickiness; track c.customerEmail) {
                <article class="loyal">
                  <div class="loyal-head">
                    <span class="avatar">{{ initials(c.customerName) }}</span>
                    <h3>{{ c.customerName }}</h3>
                    <span class="score" [class.high]="c.stickinessScore > 70" [class.mid]="c.stickinessScore >= 40 && c.stickinessScore <= 70">
                      {{ c.stickinessScore | number: '1.0-0' }}%
                    </span>
                  </div>
                  <div class="loyal-stats">
                    <div><strong>{{ c.totalBookings }}</strong><span>Bookings</span></div>
                    <div><strong>{{ c.uniqueFacilities }}</strong><span>Facilities</span></div>
                    <div><strong>{{ c.daysSinceLastBooking }}d</strong><span>Since last</span></div>
                  </div>
                  <p class="hint">Since {{ c.firstBookingDate | date: 'd MMM y' }}</p>
                </article>
              }
            </div>
          </section>
        }

        <section class="panel">
          <div class="panel-head">
            <h2>Your facilities</h2>
            <a routerLink="/owner/facilities" class="link">View all</a>
          </div>
          @if (stats()!.facilities.length) {
            <ul class="rows">
              @for (f of stats()!.facilities; track f.id) {
                <li class="row facility">
                  <div class="row-main">
                    <div class="facility-title">
                      <h3>{{ f.name }}</h3>
                      <span class="badge" [class.ok]="f.isApproved" [class.warn]="!f.isApproved">{{ f.isApproved ? 'Live' : 'Pending' }}</span>
                    </div>
                    <p class="muted">{{ f.addressText }}</p>
                    <div class="occ">
                      <div class="share"><div class="share-fill" [class.busy]="f.occupancyRate > 75" [style.width.%]="f.occupancyRate"></div></div>
                      <span>{{ f.availableSlots }}/{{ f.totalSlots }} free</span>
                    </div>
                  </div>
                </li>
              }
            </ul>
          } @else {
            <p class="muted">No facilities yet. <a routerLink="/owner/facilities" class="link">Add your first parking facility</a>.</p>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .dash { display: grid; gap: 16px; }
    .dash-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
    .eyebrow { margin: 0; color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .head-action { padding: 10px 14px; border-radius: 10px; background: var(--primary); color: #fff; font-weight: 600; font-size: 14px; text-decoration: none; white-space: nowrap; }
    .hero { padding: 20px; border-radius: 16px; background: linear-gradient(135deg, #2f6bff, #1b3fa8); color: #fff; }
    .hero-label { font-size: 13px; opacity: .85; }
    .hero-value { font-size: 34px; font-weight: 800; margin: 4px 0 16px; }
    .hero-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.2); }
    .hero-meta div, .kpi, .loyal-stats div { display: flex; flex-direction: column; gap: 2px; }
    .hero-meta strong { font-size: 18px; }
    .hero-meta span { font-size: 12px; opacity: .85; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .kpi, .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
    .kpi { padding: 14px; }
    .kpi-icon { font-size: 18px; }
    .kpi strong { font-size: 22px; margin-top: 6px; }
    .kpi strong.warn { color: var(--warn); }
    .kpi span:last-child, .loyal-stats span { color: var(--muted); font-size: 12px; }
    .panel { padding: 16px; min-width: 0; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
    .panel-head h2 { margin: 0; font-size: 16px; }
    .pill { padding: 4px 10px; border-radius: 999px; background: var(--surface-2); color: var(--muted); font-size: 12px; white-space: nowrap; }
    .link { color: var(--primary); text-decoration: none; font-size: 14px; font-weight: 600; }
    .chart { display: flex; gap: 6px; overflow-x: auto; scroll-snap-type: x proximity; padding-bottom: 4px; }
    .bar { flex: 1 0 22px; display: flex; flex-direction: column; align-items: center; gap: 6px; scroll-snap-align: start; }
    .bar-track { width: 100%; height: 110px; display: flex; align-items: flex-end; background: var(--surface-2); border-radius: 6px; overflow: hidden; }
    .bar-fill { width: 100%; min-height: 2px; background: var(--ok); border-radius: 6px 6px 0 0; }
    .bar-fill.mid { background: var(--warn); }
    .bar-fill.high { background: var(--danger); }
    .bar-label { font-size: 11px; color: var(--muted); }
    .swipe-hint { display: none; margin: 8px 0 0; }
    .rows { list-style: none; margin: 0; padding: 0; display: grid; }
    .row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--border); }
    .row:first-child { border-top: none; padding-top: 0; }
    .row-main { flex: 1; min-width: 0; }
    .row h3, .loyal h3 { margin: 0; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row p { margin: 2px 0 0; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .amount { color: var(--ok); white-space: nowrap; }
    .share { height: 6px; margin-top: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; flex: 1; }
    .share-fill { height: 100%; background: var(--primary); border-radius: 999px; }
    .share-fill.busy { background: var(--danger); }
    .avatar { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--surface-2); color: var(--text); font-size: 13px; font-weight: 700; }
    .carousel { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(240px, 1fr); gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; }
    .loyal { scroll-snap-align: start; padding: 14px; border-radius: 12px; border: 1px solid var(--border); min-width: 0; }
    .loyal-head { display: flex; align-items: center; gap: 10px; }
    .loyal-head h3 { flex: 1; min-width: 0; }
    .score { padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(224,90,90,.15); color: var(--danger); }
    .score.mid { background: rgba(224,165,49,.15); color: var(--warn); }
    .score.high { background: rgba(41,193,126,.15); color: var(--ok); }
    .loyal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
    .loyal .hint { margin: 10px 0 0; }
    .facility-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .occ { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .occ .share { margin: 0; }
    .occ span { font-size: 12px; color: var(--muted); }
    @media (max-width: 640px) {
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .hero-value { font-size: 30px; }
      .panel { padding: 14px; }
      .bar { flex: 0 0 22px; }
      .swipe-hint { display: block; }
      .carousel { grid-auto-columns: 82%; }
    }
  `],
})
export class OwnerDashboardComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);
  adv = signal<OwnerDashboardStatisticsDto | null>(null);

  readonly occupancyNow = computed(() => {
    const s = this.stats();
    return s && s.totalSpaces > 0 ? (s.occupiedSpaces / s.totalSpaces) * 100 : 0;
  });

  readonly peakHour = computed(() => {
    const hours = this.adv()?.occupancyByHour ?? [];
    return hours.length ? hours.reduce((a, b) => (b.occupancyPercentage > a.occupancyPercentage ? b : a)) : null;
  });

  private readonly maxFacilityRevenue = computed(() =>
    Math.max(0, ...(this.adv()?.revenueByFacility ?? []).map((f) => f.totalRevenue)));

  constructor(private parking: ParkingService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  share(revenue: number): number {
    const max = this.maxFacilityRevenue();
    return max > 0 ? (revenue / max) * 100 : 0;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.parking.myFacilities().subscribe({
      next: (facilities) => {
        this.stats.set({
          totalFacilities: facilities.length,
          totalSpaces: facilities.reduce((sum, f) => sum + f.totalSlots, 0),
          occupiedSpaces: facilities.reduce((sum, f) => sum + (f.totalSlots - f.availableSlots), 0),
          availableSpaces: facilities.reduce((sum, f) => sum + f.availableSlots, 0),
          facilities: facilities.map((f) => ({
            ...f,
            occupancyRate: f.totalSlots > 0 ? ((f.totalSlots - f.availableSlots) / f.totalSlots) * 100 : 0,
          })),
        });

        this.parking.ownerDashboardStatistics().subscribe({
          next: (advStats) => {
            this.adv.set(advStats);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Failed to load advanced statistics:', err);
            this.loading.set(false);
          },
        });
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.error?.message ?? 'Failed to load dashboard data.');
      },
    });
  }
}
