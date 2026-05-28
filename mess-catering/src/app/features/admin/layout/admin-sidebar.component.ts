import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgForOf, NgIf } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  section?: 'main' | 'operations';
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, NgForOf, NgIf],
  template: `
    <aside class="admin-sidebar" [class.collapsed]="collapsed()">
      <div class="brand">
        <mat-icon>restaurant</mat-icon>
        <div>
          <strong>CaterDash</strong>
          <span>Admin Dashboard</span>
        </div>
      </div>
      <nav>
        <span class="nav-section">Main</span>
        <ng-container *ngFor="let item of mainNav">
          <a *ngIf="
            (item.route === '/admin' && auth.hasRole('admin')) ||
            (item.route === '/admin/orders' && auth.hasRole('admin','kitchen','logistics')) ||
            (item.route === '/admin/food-menu' && auth.hasRole('admin')) ||
            (item.route === '/admin/packages' && auth.hasRole('admin')) ||
            (item.route === '/admin/equipment' && auth.hasRole('admin')) ||
            (item.route === '/admin/clients' && auth.hasRole('admin')) ||
            (item.route === '/admin/schedule' && auth.hasRole('admin'))
          " [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.route === '/admin' }">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        </ng-container>

        <span class="nav-section">Operations</span>
        <ng-container *ngFor="let item of opsNav">
          <a *ngIf="
            (item.route === '/admin/kitchen' && auth.hasRole('admin','kitchen')) ||
            (item.route === '/admin/logistics' && auth.hasRole('admin','logistics')) ||
            (item.route === '/admin/reports' && auth.hasRole('admin'))
          " [routerLink]="item.route" routerLinkActive="active">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>
      <div class="sidebar-footer">
        <mat-icon>account_circle</mat-icon>
        <div>
          <small>{{ auth.user()?.name }}</small>
          <span class="role-badge">{{ auth.user()?.role }}</span>
        </div>
      </div>
    </aside>
  `,
})
export class AdminSidebarComponent {
  readonly auth = inject(AuthService);
  readonly collapsed = input(false);

  readonly mainNav: NavItem[] = [
    { label: 'Overview', icon: 'dashboard', route: '/admin' },
    { label: 'Orders', icon: 'receipt_long', route: '/admin/orders' },
    { label: 'Food Menu', icon: 'restaurant_menu', route: '/admin/food-menu' },
    { label: 'Packages', icon: 'lunch_dining', route: '/admin/packages' },
    { label: 'Equipment', icon: 'inventory_2', route: '/admin/equipment' },
    { label: 'Clients', icon: 'groups', route: '/admin/clients' },
    { label: 'Event Schedule', icon: 'calendar_month', route: '/admin/schedule' },
  ];

  readonly opsNav: NavItem[] = [
    { label: 'Kitchen Monitoring', icon: 'soup_kitchen', route: '/admin/kitchen' },
    { label: 'Logistics Monitoring', icon: 'local_shipping', route: '/admin/logistics' },
    { label: 'Reports & Analytics', icon: 'analytics', route: '/admin/reports' },
  ];
}
