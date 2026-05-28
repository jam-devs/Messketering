import { Component, inject, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule,
    AsyncPipe,
  ],
  template: `
    <header class="admin-header">
      <button mat-icon-button class="menu-toggle" (click)="menuToggle.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <div class="header-actions">
        @if (pendingCount$ | async; as count) {
          <button mat-icon-button [matBadge]="count" matBadgeColor="warn" matBadgeSize="small">
            <mat-icon>notifications</mat-icon>
          </button>
        }
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
          <mat-icon>account_circle</mat-icon>
          <span>{{ auth.user()?.name }}</span>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="menu-user-info">
            <strong>{{ auth.user()?.name }}</strong>
            <small>{{ auth.user()?.email }}</small>
            <span class="role-tag">{{ auth.user()?.role }}</span>
          </div>
          <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon> Sign out</button>
        </mat-menu>
      </div>
    </header>
  `,
})
export class AdminHeaderComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  readonly menuToggle = output<void>();

  readonly pendingCount$ = this.orderService.getStats().pipe(map((s) => s.kitchenPending));

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
