import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  FacilitySummaryDto, 
  BookingDto,
  OwnerDashboardStatisticsDto,
  RevenueByCustomerDto,
  RevenueByFacilityDto,
  OccupancyByHourDto,
  CustomerStickinessDto
} from '../../core/models';
import { ParkingService } from '../../core/parking.service';

interface FacilityStatistics extends FacilitySummaryDto {
  occupancyRate: number;
}

interface DashboardStats {
  totalFacilities: number;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  totalBookings: number;
  facilities: FacilityStatistics[];
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="container owner-dashboard">
      <div class="dashboard-header">
        <h1>Owner Dashboard</h1>
        <p class="muted">Manage your parking facilities and view detailed statistics</p>
      </div>

      @if (loading()) {
        <p class="muted">Loading dashboard data…</p>
      } @else if (error()) {
        <div class="banner error">{{ error() }}</div>
      } @else {
        <!-- Basic Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.totalFacilities }}</div>
            <div class="stat-label">Total Facilities</div>
            <p class="stat-desc">Parking locations you manage</p>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.totalSpaces }}</div>
            <div class="stat-label">Total Spaces</div>
            <p class="stat-desc">Parking slots available</p>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.availableSpaces }}</div>
            <div class="stat-label">Available Now</div>
            <p class="stat-desc" [class.low]="stats()!.availableSpaces < 5">Slots free to book</p>
          </div>
          <div class="stat-card">
            <div class="stat-value">₹{{ advancedStats()?.totalRevenue | number: '1.0-0' }}</div>
            <div class="stat-label">Total Revenue</div>
            <p class="stat-desc">Cumulative earnings</p>
          </div>
        </div>

        <!-- Revenue Summary Cards -->
        <div class="revenue-summary">
          <div class="summary-card">
            <div class="summary-label">Total Bookings</div>
            <div class="summary-value">{{ advancedStats()?.totalBookings }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Avg Revenue/Booking</div>
            <div class="summary-value">₹{{ advancedStats()?.averageRevenuePerBooking | number: '1.0-0' }}</div>
          </div>
        </div>

        <!-- Occupancy by Hour Chart -->
        @if (advancedStats()?.occupancyByHour && advancedStats()!.occupancyByHour.length) {
          <div class="chart-section">
            <div class="section-header">
              <h2>Occupancy Rate by Hour of Day</h2>
            </div>
            <div class="occupancy-chart">
              @for (hour of advancedStats()!.occupancyByHour; track hour.hour) {
                <div class="hour-bar">
                  <div class="bar-container">
                    <div 
                      class="bar-fill" 
                      [style.height.%]="hour.occupancyPercentage"
                      [class.high]="hour.occupancyPercentage > 75"
                      [class.medium]="hour.occupancyPercentage >= 50 && hour.occupancyPercentage <= 75"
                      [class.low]="hour.occupancyPercentage < 50">
                    </div>
                  </div>
                  <div class="bar-label">{{ hour.hour }}:00</div>
                  <div class="bar-value">{{ hour.occupancyPercentage | number: '1.0-0' }}%</div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Revenue by Facility -->
        @if (advancedStats()?.revenueByFacility && advancedStats()!.revenueByFacility.length) {
          <div class="section">
            <div class="section-header">
              <h2>Revenue by Facility</h2>
              <a routerLink="/owner/facilities" class="link-btn">Manage Facilities</a>
            </div>
            <div class="facility-revenue-table">
              <div class="table-header">
                <div class="col-name">Facility Name</div>
                <div class="col-bookings">Bookings</div>
                <div class="col-revenue">Revenue</div>
                <div class="col-avg">Avg per Booking</div>
              </div>
              @for (facility of advancedStats()!.revenueByFacility; track facility.facilityId) {
                <div class="table-row">
                  <div class="col-name">
                    <h4>{{ facility.facilityName }}</h4>
                  </div>
                  <div class="col-bookings">
                    <span>{{ facility.bookingCount }}</span>
                  </div>
                  <div class="col-revenue">
                    <span class="highlight">₹{{ facility.totalRevenue | number: '1.0-0' }}</span>
                  </div>
                  <div class="col-avg">
                    <span>₹{{ facility.averageRevenuePerBooking | number: '1.0-0' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Top Customers by Revenue -->
        @if (advancedStats()?.topCustomers && advancedStats()!.topCustomers.length) {
          <div class="section">
            <div class="section-header">
              <h2>Top Customers by Revenue</h2>
            </div>
            <div class="customers-table">
              <div class="table-header">
                <div class="col-name">Customer Name</div>
                <div class="col-email">Email</div>
                <div class="col-bookings">Bookings</div>
                <div class="col-revenue">Total Revenue</div>
                <div class="col-date">Last Booking</div>
              </div>
              @for (customer of advancedStats()!.topCustomers; track customer.customerEmail) {
                <div class="table-row">
                  <div class="col-name">
                    <h4>{{ customer.customerName }}</h4>
                  </div>
                  <div class="col-email">
                    <p class="muted">{{ customer.customerEmail }}</p>
                  </div>
                  <div class="col-bookings">
                    <span>{{ customer.bookingCount }}</span>
                  </div>
                  <div class="col-revenue">
                    <span class="highlight">₹{{ customer.totalRevenue | number: '1.0-0' }}</span>
                  </div>
                  <div class="col-date">
                    <p class="muted">{{ customer.lastBookingDate | date: 'short' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Customer Stickiness -->
        @if (advancedStats()?.customerStickiness && advancedStats()!.customerStickiness.length) {
          <div class="section">
            <div class="section-header">
              <h2>Customer Stickiness (Repeat Customers)</h2>
            </div>
            <div class="stickiness-cards">
              @for (customer of advancedStats()!.customerStickiness; track customer.customerEmail) {
                <div class="stickiness-card">
                  <div class="card-header">
                    <h4>{{ customer.customerName }}</h4>
                    <span class="stickiness-score" [class.high]="customer.stickinessScore > 70" [class.medium]="customer.stickinessScore >= 40 && customer.stickinessScore <= 70" [class.low]="customer.stickinessScore < 40">
                      {{ customer.stickinessScore | number: '1.0-0' }}%
                    </span>
                  </div>
                  <p class="muted email">{{ customer.customerEmail }}</p>
                  <div class="card-stats">
                    <div class="stat">
                      <span class="label">Total Bookings</span>
                      <span class="value">{{ customer.totalBookings }}</span>
                    </div>
                    <div class="stat">
                      <span class="label">Unique Facilities</span>
                      <span class="value">{{ customer.uniqueFacilities }}</span>
                    </div>
                    <div class="stat">
                      <span class="label">Days Since Last</span>
                      <span class="value">{{ customer.daysSinceLastBooking }}d</span>
                    </div>
                  </div>
                  <div class="date-range">
                    <p class="muted">First: {{ customer.firstBookingDate | date: 'short' }}</p>
                    <p class="muted">Last: {{ customer.lastBookingDate | date: 'short' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Your Facilities -->
        @if (stats()!.facilities.length > 0) {
          <div class="section">
            <div class="section-header">
              <h2>Your Facilities</h2>
            </div>
            <div class="facilities-table">
              <div class="table-header">
                <div class="col-name">Facility Name</div>
                <div class="col-address">Address</div>
                <div class="col-slots">Total Slots</div>
                <div class="col-available">Available</div>
                <div class="col-occupancy">Occupancy</div>
                <div class="col-status">Status</div>
              </div>
              @for (facility of stats()!.facilities; track facility.id) {
                <div class="table-row">
                  <div class="col-name">
                    <h4>{{ facility.name }}</h4>
                  </div>
                  <div class="col-address">
                    <p class="muted">{{ facility.addressText }}</p>
                  </div>
                  <div class="col-slots">
                    <span>{{ facility.totalSlots }}</span>
                  </div>
                  <div class="col-available">
                    <span [class.low]="facility.availableSlots < 2" [class.ok]="facility.availableSlots >= 2">
                      {{ facility.availableSlots }}
                    </span>
                  </div>
                  <div class="col-occupancy">
                    <div class="occupancy-bar">
                      <div 
                        class="occupancy-fill" 
                        [style.width.%]="(100 - (facility.availableSlots / facility.totalSlots) * 100)">
                      </div>
                    </div>
                    <span class="occupancy-text">{{ (100 - (facility.availableSlots / facility.totalSlots) * 100) | number: '1.0-0' }}%</span>
                  </div>
                  <div class="col-status">
                    <span class="badge" [class.ok]="facility.isApproved" [class.warn]="!facility.isApproved">
                      {{ facility.isApproved ? 'Live' : 'Pending' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <p>No facilities yet. <a routerLink="/owner/facilities" class="link">Add your first parking facility</a>.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .owner-dashboard {
      padding: 28px 20px;
    }

    .dashboard-header {
      margin-bottom: 28px;
    }

    .dashboard-header h1 {
      margin: 0 0 8px;
      font-size: 28px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 8px;
    }

    .stat-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 4px;
    }

    .stat-desc {
      font-size: 12px;
      color: var(--muted);
      margin: 0;
    }

    .stat-desc.low {
      color: var(--danger);
    }

    /* Revenue Summary Cards */
    .revenue-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .summary-card {
      background: linear-gradient(135deg, var(--primary), #0080ff);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: white;
    }

    .summary-label {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
    }

    /* Occupancy Chart */
    .chart-section {
      margin-bottom: 28px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .link-btn {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .link-btn:hover {
      background: var(--surface-2);
    }

    .occupancy-chart {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 12px;
      align-items: flex-end;
    }

    .hour-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar-container {
      width: 100%;
      height: 200px;
      background: var(--surface-2);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: flex-end;
    }

    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, var(--primary), #0080ff);
      transition: all 0.3s;
    }

    .bar-fill.high {
      background: linear-gradient(180deg, #ff6b6b, #ff8787);
    }

    .bar-fill.medium {
      background: linear-gradient(180deg, #ffd93d, #ffed4e);
    }

    .bar-fill.low {
      background: linear-gradient(180deg, #29c17e, #4ee89b);
    }

    .bar-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
    }

    .bar-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
    }

    /* Tables */
    .section {
      margin-bottom: 28px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }

    .facility-revenue-table,
    .customers-table,
    .facilities-table {
      display: flex;
      flex-direction: column;
    }

    .table-header,
    .table-row {
      display: grid;
      gap: 16px;
      padding: 16px;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }

    .facility-revenue-table .table-header,
    .facility-revenue-table .table-row {
      grid-template-columns: 1.5fr 100px 120px 150px;
    }

    .customers-table .table-header,
    .customers-table .table-row {
      grid-template-columns: 1fr 1.5fr 100px 120px 150px;
    }

    .facilities-table .table-header,
    .facilities-table .table-row {
      grid-template-columns: 1.5fr 2fr 100px 100px 150px 100px;
    }

    .table-header {
      background: var(--surface-2);
      font-weight: 600;
      font-size: 13px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row h4 {
      margin: 0;
      font-size: 15px;
    }

    .col-name p {
      margin: 0;
    }

    .col-bookings,
    .col-slots,
    .col-available {
      text-align: center;
      font-weight: 600;
    }

    .col-available span.ok {
      color: var(--ok);
    }

    .col-available span.low {
      color: var(--warn);
    }

    .col-revenue .highlight,
    .col-avg {
      font-weight: 600;
    }

    .occupancy-bar {
      width: 100%;
      height: 8px;
      background: var(--surface-2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .occupancy-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), #00d4ff);
      transition: width 0.3s;
    }

    .occupancy-text {
      font-size: 12px;
      color: var(--muted);
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      background: var(--surface-2);
      color: var(--text);
    }

    .badge.ok {
      background: rgba(41, 193, 126, 0.15);
      color: var(--ok);
    }

    .badge.warn {
      background: rgba(224, 165, 49, 0.15);
      color: var(--warn);
    }

    /* Stickiness Cards */
    .stickiness-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      padding: 20px;
    }

    .stickiness-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }

    .card-header h4 {
      margin: 0;
      font-size: 15px;
      flex: 1;
    }

    .stickiness-score {
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
    }

    .stickiness-score.high {
      background: rgba(41, 193, 126, 0.15);
      color: var(--ok);
    }

    .stickiness-score.medium {
      background: rgba(224, 165, 49, 0.15);
      color: var(--warn);
    }

    .stickiness-score.low {
      background: rgba(255, 107, 107, 0.15);
      color: var(--danger);
    }

    .email {
      margin: 0 0 12px;
    }

    .card-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }

    .stat {
      text-align: center;
    }

    .stat .label {
      display: block;
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 4px;
    }

    .stat .value {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
    }

    .date-range {
      border-top: 1px solid var(--border);
      padding-top: 12px;
    }

    .date-range p {
      margin: 4px 0;
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      background: var(--surface);
      border: 1px dashed var(--border);
      border-radius: 12px;
    }

    .empty-state p {
      color: var(--muted);
      margin: 0;
    }

    .link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .link:hover {
      text-decoration: underline;
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .occupancy-chart {
        grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
      }

      .stickiness-cards {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      }
    }

    @media (max-width: 640px) {
      .stats-grid,
      .revenue-summary {
        grid-template-columns: 1fr;
      }

      .occupancy-chart {
        grid-template-columns: repeat(6, 1fr);
      }

      .bar-container {
        height: 100px;
      }

      .table-header {
        display: none;
      }

      .facility-revenue-table .table-row,
      .customers-table .table-row,
      .facilities-table .table-row {
        grid-template-columns: 1fr;
        padding: 12px;
      }

      .stickiness-cards {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class OwnerDashboardComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);
  advancedStats = signal<OwnerDashboardStatisticsDto | null>(null);

  constructor(private parking: ParkingService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load facilities
    this.parking.myFacilities().subscribe({
      next: (facilities) => {
        const stats: DashboardStats = {
          totalFacilities: facilities.length,
          totalSpaces: facilities.reduce((sum, f) => sum + f.totalSlots, 0),
          occupiedSpaces: facilities.reduce((sum, f) => sum + (f.totalSlots - f.availableSlots), 0),
          availableSpaces: facilities.reduce((sum, f) => sum + f.availableSlots, 0),
          totalBookings: 0,
          facilities: facilities.map(f => ({
            ...f,
            occupancyRate: f.totalSlots > 0 ? ((f.totalSlots - f.availableSlots) / f.totalSlots) * 100 : 0,
          })),
        };

        this.stats.set(stats);

        // Load advanced statistics
        this.parking.ownerDashboardStatistics().subscribe({
          next: (advStats) => {
            console.log('Advanced stats loaded:', advStats);
            this.advancedStats.set(advStats);
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
