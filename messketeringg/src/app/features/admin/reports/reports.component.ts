import { Component, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { ChartCardComponent } from '../../../shared/components/chart-card.component';
import { AnalyticsService, AnalyticsPeriod } from '../../../services/analytics.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    AsyncPipe, CurrencyPipe, MatCardModule, MatIconModule, MatButtonToggleModule,
    PageHeaderComponent, ChartCardComponent,
  ],
  template: `
    <app-page-header title="Reports & Analytics" subtitle="Sales graphs, bookings trends, and operational insights" />

    @if (summary$ | async; as s) {
      <div class="stats-grid analytics-summary">
        <mat-card class="stat-card accent"><mat-icon>payments</mat-icon><div><span class="stat-label">Total Revenue</span><span class="stat-value">{{ s.totalRevenue | currency:'PHP':'symbol-narrow':'1.0-0' }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>restaurant</mat-icon><div><span class="stat-label">Food Revenue</span><span class="stat-value">{{ s.foodRevenue | currency:'PHP':'symbol-narrow':'1.0-0' }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>inventory_2</mat-icon><div><span class="stat-label">Equipment Revenue</span><span class="stat-value">{{ s.equipmentRevenue | currency:'PHP':'symbol-narrow':'1.0-0' }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>star</mat-icon><div><span class="stat-label">Top Food</span><span class="stat-value stat-sm">{{ s.topFood }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>chair</mat-icon><div><span class="stat-label">Top Equipment</span><span class="stat-value stat-sm">{{ s.topEquipment }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>event</mat-icon><div><span class="stat-label">Upcoming Events</span><span class="stat-value">{{ s.upcomingEvents }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>inventory_2</mat-icon><div><span class="stat-label">Equipment Use</span><span class="stat-value">{{ s.equipmentUtilization }}%</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>pending</mat-icon><div><span class="stat-label">Pending</span><span class="stat-value">{{ s.pendingOrders }}</span></div></mat-card>
      </div>
    }

    <mat-button-toggle-group [value]="period()" (change)="period.set($event.value)">
      <mat-button-toggle value="daily">Daily</mat-button-toggle>
      <mat-button-toggle value="weekly">Weekly</mat-button-toggle>
      <mat-button-toggle value="monthly">Monthly</mat-button-toggle>
      <mat-button-toggle value="yearly">Yearly</mat-button-toggle>
    </mat-button-toggle-group>

    <div class="charts-grid">
      <mat-card>
        <mat-card-header><mat-card-title>Monthly Sales Revenue</mat-card-title></mat-card-header>
        <mat-card-content>
          @if (revenueChart$ | async; as cfg) { <app-chart-card [config]="cfg" /> }
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Weekly Bookings</mat-card-title></mat-card-header>
        <mat-card-content>
          @if (bookingsChart$ | async; as cfg) { <app-chart-card [config]="cfg" /> }
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Popular Packages</mat-card-title></mat-card-header>
        <mat-card-content>
          @if (packagesChart$ | async; as cfg) { <app-chart-card [config]="cfg" /> }
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Pending vs Completed</mat-card-title></mat-card-header>
        <mat-card-content>
          @if (statusChart$ | async; as cfg) { <app-chart-card [config]="cfg" /> }
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Food Sales Revenue</mat-card-title></mat-card-header>
        <mat-card-content>@if (foodRevChart$ | async; as cfg) { <app-chart-card [config]="cfg" /> }</mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Equipment Rental Revenue</mat-card-title></mat-card-header>
        <mat-card-content>@if (equipRevChart$ | async; as cfg) { <app-chart-card [config]="cfg" /> }</mat-card-content>
      </mat-card>
      <mat-card class="chart-wide">
        <mat-card-header><mat-card-title>Equipment Stock Usage</mat-card-title></mat-card-header>
        <mat-card-content>@if (equipmentChart$ | async; as cfg) { <app-chart-card [config]="cfg" /> }</mat-card-content>
      </mat-card>
    </div>
  `,
})
export class ReportsComponent {
  private readonly analytics = inject(AnalyticsService);
  readonly period = signal<AnalyticsPeriod>('monthly');
  private readonly period$ = toObservable(this.period);

  readonly summary$ = this.analytics.getSummary();
  readonly revenueChart$ = this.period$.pipe(switchMap((p) => this.analytics.getRevenueChart(p)));
  readonly bookingsChart$ = this.period$.pipe(switchMap((p) => this.analytics.getBookingsChart(p)));
  readonly packagesChart$ = this.analytics.getPopularPackagesChart();
  readonly statusChart$ = this.analytics.getOrderStatusChart();
  readonly equipmentChart$ = this.analytics.getEquipmentUsageChart();
  readonly foodRevChart$ = this.analytics.getFoodRevenueChart();
  readonly equipRevChart$ = this.analytics.getEquipmentRevenueChart();
}
