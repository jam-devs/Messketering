import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { DashboardService } from '../../../services/dashboard.service';
import { OrderService } from '../../../services/order.service';
import { getKitchenLabel, getKitchenColor, getLogisticsLabel, getLogisticsColor } from '../../../shared/utils/status.utils';
import { KitchenStatus, LogisticsStatus } from '../../../models/order.model';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    AsyncPipe, DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule, MatProgressBarModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="Dashboard Overview"
      subtitle="Centralized catering operations — kitchen, logistics, and bookings"
    />

    @if (metrics$ | async; as m) {
      <div class="stats-grid">
        <mat-card class="stat-card"><mat-icon>receipt_long</mat-icon><div><span class="stat-label">Total Bookings</span><span class="stat-value">{{ m.totalOrders }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>event</mat-icon><div><span class="stat-label">Today's Events</span><span class="stat-value">{{ m.todayEvents }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>soup_kitchen</mat-icon><div><span class="stat-label">Kitchen Preparing</span><span class="stat-value">{{ m.kitchenPreparing }}</span></div></mat-card>
        <mat-card class="stat-card accent"><mat-icon>local_shipping</mat-icon><div><span class="stat-label">Logistics Active</span><span class="stat-value">{{ m.logisticsActive }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>hourglass_empty</mat-icon><div><span class="stat-label">Kitchen Pending</span><span class="stat-value">{{ m.kitchenPending }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>done_all</mat-icon><div><span class="stat-label">Delivered</span><span class="stat-value">{{ m.logisticsDelivered }}</span></div></mat-card>
      </div>

      <div class="overview-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Equipment Utilization</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="utilization-display"><span class="util-pct">{{ m.equipmentUtilization }}%</span></div>
            <mat-progress-bar mode="determinate" [value]="m.equipmentUtilization" />
            <p class="meta-text">{{ m.lowStockItems }} items low on stock · <a routerLink="/admin/equipment">View inventory</a></p>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Quick Access</mat-card-title></mat-card-header>
          <mat-card-content class="quick-links">
            <a mat-stroked-button routerLink="/admin/kitchen"><mat-icon>soup_kitchen</mat-icon> Kitchen</a>
            <a mat-stroked-button routerLink="/admin/logistics"><mat-icon>local_shipping</mat-icon> Logistics</a>
            <a mat-stroked-button routerLink="/admin/orders"><mat-icon>receipt_long</mat-icon> Orders</a>
            <a mat-stroked-button routerLink="/admin/schedule"><mat-icon>calendar_month</mat-icon> Schedule</a>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title>Recent Bookings</mat-card-title>
        <a mat-button routerLink="/admin/orders">View All</a>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="(recentOrders$ | async) ?? []">
          <ng-container matColumnDef="bookingRef"><th mat-header-cell *matHeaderCellDef>Booking</th><td mat-cell *matCellDef="let o">{{ o.bookingRef }}</td></ng-container>
          <ng-container matColumnDef="event"><th mat-header-cell *matHeaderCellDef>Event</th><td mat-cell *matCellDef="let o">{{ o.eventName }}</td></ng-container>
          <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let o">{{ o.eventDate | date:'mediumDate' }}</td></ng-container>
          <ng-container matColumnDef="kitchen"><th mat-header-cell *matHeaderCellDef>Kitchen</th><td mat-cell *matCellDef="let o"><span class="status-pill kitchen" [style.background]="kColor(o.kitchenStatus)">{{ kLabel(o.kitchenStatus) }}</span></td></ng-container>
          <ng-container matColumnDef="logistics"><th mat-header-cell *matHeaderCellDef>Logistics</th><td mat-cell *matCellDef="let o"><span class="status-pill logistics" [style.background]="lColor(o.logisticsStatus)">{{ lLabel(o.logisticsStatus) }}</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
})
export class OverviewComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly orderService = inject(OrderService);
  readonly metrics$ = this.dashboardService.getMetrics();
  readonly recentOrders$ = this.orderService.getRecent(6);
  readonly cols = ['bookingRef', 'event', 'date', 'kitchen', 'logistics'];
  kLabel = (s: KitchenStatus) => getKitchenLabel(s);
  kColor = (s: KitchenStatus) => getKitchenColor(s) + '33';
  lLabel = (s: LogisticsStatus) => getLogisticsLabel(s);
  lColor = (s: LogisticsStatus) => getLogisticsColor(s) + '33';
}
