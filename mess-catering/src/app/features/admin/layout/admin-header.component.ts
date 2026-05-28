import { Component, inject, OnInit, OnDestroy, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { GlobalSearchService } from '../../../services/global-search.service';
import { AsyncPipe } from '@angular/common';
import { debounceTime, distinctUntilChanged, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule,
    MatFormFieldModule, MatInputModule, AsyncPipe,
  ],
  template: `
    <header class="admin-header">
      <button mat-icon-button class="menu-toggle" (click)="menuToggle.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <mat-form-field appearance="outline" class="header-search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Search orders, clients, packages, equipment..." />
        @if (searchControl.value) {
          <button mat-icon-button matSuffix type="button" (click)="clearSearch()"><mat-icon>close</mat-icon></button>
        }
      </mat-form-field>
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
export class AdminHeaderComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly globalSearch = inject(GlobalSearchService);
  readonly menuToggle = output<void>();
  readonly searchControl = new FormControl(this.globalSearch.current, { nonNullable: true });
  private sub?: Subscription;

  readonly pendingCount$ = this.orderService.getStats().pipe(map((s) => s.kitchenPending));

  ngOnInit(): void {
    this.sub = this.searchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((q) => this.globalSearch.setQuery(q.trim()));
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.globalSearch.clear();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
