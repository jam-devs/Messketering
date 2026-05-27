import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { LogisticsService } from '../../../services/logistics.service';
import { OrderService } from '../../../services/order.service';
import {
  LOGISTICS_STATUS_LABELS,
  LogisticsStatus,
} from '../../../models/order.model';
import {
  getLogisticsColor,
  getNextLogisticsStatus,
} from '../../../shared/utils/status.utils';

@Component({
  selector: 'app-logistics-monitoring',
  standalone: true,
  imports: [
    AsyncPipe, DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="Logistics Monitoring"
      subtitle="Equipment deployment, delivery tracking, and event setup coordination"
    />

    @if (stats$ | async; as s) {
      <div class="stats-grid">
        <mat-card class="stat-card"><mat-icon>inventory</mat-icon><div><span class="stat-label">Preparing</span><span class="stat-value">{{ s.preparing }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>local_shipping</mat-icon><div><span class="stat-label">Out for Delivery</span><span class="stat-value">{{ s.outForDelivery }}</span></div></mat-card>
        <mat-card class="stat-card accent"><mat-icon>done_all</mat-icon><div><span class="stat-label">Delivered</span><span class="stat-value">{{ s.delivered }}</span></div></mat-card>
        <mat-card class="stat-card"><mat-icon>replay</mat-icon><div><span class="stat-label">Returned</span><span class="stat-value">{{ s.returned }}</span></div></mat-card>
      </div>
    }

    <div class="monitoring-grid">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Deployment Queue</mat-card-title>
          <a mat-button routerLink="/admin/equipment">Inventory</a>
        </mat-card-header>
        <mat-card-content>
          @for (task of queue$ | async; track task.orderId) {
            <div class="monitor-task">
              <div class="task-main">
                <strong>{{ task.bookingRef }}</strong>
                <span>{{ task.eventName }} · {{ task.clientName }}</span>
                <small>{{ task.venue }} · {{ task.eventDate | date:'mediumDate' }} {{ task.eventTime }}</small>
                <small>{{ task.equipmentCount }} equipment items</small>
              </div>
              <mat-chip [class]="'priority-' + task.priority">{{ task.priority }}</mat-chip>
              <span class="status-pill logistics" [style.background]="pillColor(task.logisticsStatus)">
                {{ labels[task.logisticsStatus] }}
              </span>
              @if (nextLogistics(task.logisticsStatus); as next) {
                <button mat-flat-button (click)="advance(task.orderId, next)">
                  Mark {{ labels[next] }}
                </button>
              }
            </div>
          } @empty {
            <p class="empty-state">No deployments in queue.</p>
          }
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Active Deployments</mat-card-title></mat-card-header>
        <mat-card-content>
          @for (task of active$ | async; track task.orderId) {
            <div class="monitor-task compact">
              <strong>{{ task.eventName }}</strong>
              @if (task.assignedStaff) {
                <small><mat-icon>person</mat-icon>{{ task.assignedStaff }}</small>
              }
              <span class="status-pill logistics" [style.background]="pillColor(task.logisticsStatus)">
                {{ labels[task.logisticsStatus] }}
              </span>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class LogisticsMonitoringComponent {
  private readonly logisticsService = inject(LogisticsService);
  private readonly orderService = inject(OrderService);
  readonly labels = LOGISTICS_STATUS_LABELS;
  readonly stats$ = this.logisticsService.getStats();
  readonly queue$ = this.logisticsService.getDeploymentQueue();
  readonly active$ = this.logisticsService.getActiveDeployments();

  pillColor = (s: LogisticsStatus) => getLogisticsColor(s) + '33';
  nextLogistics = getNextLogisticsStatus;

  advance(id: string, status: LogisticsStatus): void {
    this.orderService.updateLogisticsStatus(id, status);
  }
}
