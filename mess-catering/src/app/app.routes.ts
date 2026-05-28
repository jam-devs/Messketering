import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { LoginComponent } from './features/admin/login/login.component';
import { OverviewComponent } from './features/admin/overview/overview.component';
import { OrdersComponent } from './features/admin/orders/orders.component';
import { EquipmentComponent } from './features/admin/equipment/equipment.component';
import { PackagesComponent } from './features/admin/packages/packages.component';
import { ClientsComponent } from './features/admin/clients/clients.component';
import { ScheduleComponent } from './features/admin/schedule/schedule.component';
import { KitchenMonitoringComponent } from './features/admin/kitchen/kitchen-monitoring.component';
import { LogisticsMonitoringComponent } from './features/admin/logistics/logistics-monitoring.component';
import { ReportsComponent } from './features/admin/reports/reports.component';
import { FoodMenuManagementComponent } from './features/admin/food-menu/food-menu-management.component';
import { InboxComponent } from './features/admin/inbox/inbox.component';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: OverviewComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'food-menu', component: FoodMenuManagementComponent },
      { path: 'packages', component: PackagesComponent },
      { path: 'equipment', component: EquipmentComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'schedule', component: ScheduleComponent },
      { path: 'inbox', component: InboxComponent },
      { path: 'kitchen', component: KitchenMonitoringComponent },
      { path: 'logistics', component: LogisticsMonitoringComponent },
      { path: 'reports', component: ReportsComponent },
    ],
  },
  { path: '**', redirectTo: 'admin' },
];
