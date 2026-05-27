import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { KitchenService } from '../../../services/kitchen.service';
import { OrderService } from '../../../services/order.service';
import {
  KITCHEN_STATUS_LABELS,
  KitchenStatus,
} from '../../../models/order.model';
import {
  getKitchenColor,
  getKitchenLabel,
  getNextKitchenStatus,
} from '../../../shared/utils/status.utils';

@Component({
  selector: 'app-kitchen-monitoring',
  standalone: true,
  imports: [
    AsyncPipe, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="Kitchen Monitoring"
      subtitle="Food preparation progress and kitchen workload — integrated in admin"
    />

    @if (workload$ | async; as w) {
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon>hourglass_empty</mat-icon>
          <div><span class="stat-label">Pending</span><span class="stat-value">{{ w.pending }}</span></div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>soup_kitchen</mat-icon>
          <div><span class="stat-label">Preparing</span><span class="stat-value">{{ w.preparing }}</span></div>
        </mat-card>
        <mat-card class="stat-card accent">
          <mat-icon>check_circle</mat-icon>
          <div><span class="stat-label">Ready for Transport</span><span class="stat-value">{{ w.ready }}</span></div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>groups</mat-icon>
          <div><span class="stat-label">Guests in Queue</span><span class="stat-value">{{ w.totalGuests }}</span></div>
        </mat-card>
      </div>
    }

    <div class="monitoring-grid">
      <mat-card>
        <mat-card-header><mat-card-title>Preparation Queue</mat-card-title></mat-card-header>
        <mat-card-content>
          @for (task of active$ | async; track task.orderId) {
            <div class="monitor-task">
              <div class="task-main">
                <strong>{{ task.bookingRef }}</strong>
                <span>{{ task.eventName }} · {{ task.packageName }}</span>
                <small>{{ task.eventDate | date:'mediumDate' }} {{ task.eventTime }} · {{ task.guestCount }} guests</small>
              </div>
              <span class="status-pill kitchen" [style.background]="pillColor(task.kitchenStatus)">
                {{ labels[task.kitchenStatus] }}
              </span>
              @if (nextKitchen(task.kitchenStatus); as next) {
                <button mat-stroked-button (click)="advance(task.orderId, next)">
                  → {{ labels[next] }}
                </button>
              }
            </div>
          } @empty {
            <p class="empty-state">No active kitchen orders.</p>
          }
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Upcoming Schedule</mat-card-title></mat-card-header>
        <mat-card-content>
          @for (task of upcoming$ | async; track task.orderId) {
            <div class="monitor-task compact">
              <strong>{{ task.eventName }}</strong>
              <small>{{ task.eventDate | date:'shortDate' }} · {{ task.guestCount }} pax</small>
              <span class="status-pill kitchen" [style.background]="pillColor(task.kitchenStatus)">
                {{ labels[task.kitchenStatus] }}
              </span>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class KitchenMonitoringComponent {
  private readonly kitchenService = inject(KitchenService);
  private readonly orderService = inject(OrderService);
  readonly labels = KITCHEN_STATUS_LABELS;
  readonly workload$ = this.kitchenService.getWorkload();
  readonly active$ = this.kitchenService.getActiveOrders();
  readonly upcoming$ = this.kitchenService.getUpcomingSchedule();

  pillColor = (s: KitchenStatus) => getKitchenColor(s) + '33';
  nextKitchen = getNextKitchenStatus;

  advance(id: string, status: KitchenStatus): void {
    this.orderService.updateKitchenStatus(id, status);
  }
}
