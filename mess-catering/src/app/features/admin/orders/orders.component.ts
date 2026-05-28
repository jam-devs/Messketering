import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { combineLatest, map, startWith, Subject, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { SearchBarComponent } from '../../../shared/components/search-bar.component';
import { OrderService } from '../../../services/order.service';
import { GlobalSearchService } from '../../../services/global-search.service';
import { AuthService } from '../../../services/auth.service';
import { getKitchenLabel, getLogisticsLabel, getKitchenColor, getLogisticsColor } from '../../../shared/utils/status.utils';
import { KitchenStatus, LogisticsStatus } from '../../../models/order.model';
import { MANUAL_ORDER_STATUS_LABELS } from '../../../models/custom-order.model';
import { ManualOrderComponent } from './manual-order.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    AsyncPipe, CurrencyPipe, DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatDialogModule,
    PageHeaderComponent, SearchBarComponent,
  ],
  template: `
    <app-page-header title="Orders Management" subtitle="Manual bookings — phone, email, Facebook, in-person">
      @if (isAdmin()) {
        <button mat-flat-button type="button" (click)="openManualCustomOrder()"><mat-icon>add_circle</mat-icon> Manual Custom Order</button>
      }
    </app-page-header>

    <app-search-bar
      label="Search orders"
      placeholder="Booking ref, client, event, date, status..."
      [initialValue]="globalSearch.current"
      (searchChange)="onSearch($event)"
    />

    <div class="orders-list">
      @for (order of orders$ | async; track order.id) {
        <mat-card class="order-card" [class.draft]="order.isDraft" [class.custom]="order.isCustom">
          <div class="order-card-header">
            <div>
              <strong>{{ order.bookingRef }}</strong>
              @if (order.isDraft) { <mat-chip class="draft-chip">Draft</mat-chip> }
              @if (order.isCustom) { <mat-chip class="custom-chip">Custom</mat-chip> }
              <span>{{ order.eventName }}</span>
            </div>
            <div class="dual-status">
              <span class="status-pill kitchen" [style.background]="kColor(order.kitchenStatus)">{{ kLabel(order.kitchenStatus) }}</span>
              <span class="status-pill logistics" [style.background]="lColor(order.logisticsStatus)">{{ lLabel(order.logisticsStatus) }}</span>
            </div>
          </div>
          <div class="order-meta">
            <span><mat-icon>person</mat-icon>{{ order.clientName }}</span>
            <span><mat-icon>event</mat-icon>{{ order.eventDate | date:'mediumDate' }} · {{ order.eventTime }}</span>
            <span><mat-icon>place</mat-icon>{{ order.venue }}</span>
            <span><mat-icon>payments</mat-icon>{{ order.totalAmount | currency }} · {{ order.guestCount }} guests</span>
            <span><mat-icon>flag</mat-icon>{{ statusLabels[order.orderStatus] }}</span>
          </div>
          @if (order.customFoodItems.length || order.customEquipmentItems.length) {
            <div class="equipment-tags">
              @for (f of order.customFoodItems; track f.id) { <mat-chip>{{ f.quantity }}× {{ f.name }}</mat-chip> }
              @for (e of order.customEquipmentItems; track e.id) { <mat-chip>{{ e.quantity }}× {{ e.name }}</mat-chip> }
            </div>
          }
          <div class="order-actions">
            <a *ngIf="auth.hasRole('admin','kitchen')" mat-button routerLink="/admin/kitchen">Kitchen</a>
            <a *ngIf="auth.hasRole('admin','logistics')" mat-button routerLink="/admin/logistics">Logistics</a>
          </div>
        </mat-card>
      } @empty {
        <p class="empty-state">No orders match your search.</p>
      }
    </div>
  `,
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  readonly globalSearch = inject(GlobalSearchService);
  private readonly search$ = new Subject<string>();
  readonly statusLabels = MANUAL_ORDER_STATUS_LABELS;

  isAdmin = () => this.auth.hasRole('admin');

  readonly orders$ = this.search$.pipe(
    startWith(this.globalSearch.current),
    switchMap((q) => this.orderService.search(q))
  );

  ngOnInit(): void {
    if (this.globalSearch.current) this.search$.next(this.globalSearch.current);
  }

  onSearch(q: string): void {
    this.globalSearch.setQuery(q);
    this.search$.next(q);
  }

  openManualCustomOrder(): void {
    this.dialog.open(ManualOrderComponent, {
      width: 'min(980px, 94vw)',
      maxWidth: '94vw',
      maxHeight: '92vh',
      disableClose: true,
      autoFocus: false,
      data: { mode: 'create' },
    });
  }

  kLabel = getKitchenLabel;
  kColor = (s: KitchenStatus) => getKitchenColor(s) + '33';
  lLabel = getLogisticsLabel;
  lColor = (s: LogisticsStatus) => getLogisticsColor(s) + '33';
}
