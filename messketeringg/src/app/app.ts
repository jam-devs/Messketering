import { Component, OnInit } from '@angular/core';
import { CateringApiService } from './services/catering-api.service';
import { Customer, DashboardSummary, MenuItem, Order, ReportsSummary, ScheduleEvent } from './models/catering-manager.model';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { MenuManagerComponent } from './components/menu-manager/menu-manager.component';
import { OrderListComponent } from './components/order-list/order-list.component';
import { DashboardSummaryComponent } from './components/dashboard-summary/dashboard-summary.component';
import { getApiErrorMessage } from './shared/utils/api-error.utils';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { CustomerManagerComponent } from './components/customer-manager/customer-manager.component';
import { ReportsSummaryComponent } from './components/reports-summary/reports-summary.component';
import { ScheduleViewComponent } from './components/schedule-view/schedule-view.component';

@Component({
  selector: 'app-root',
  imports: [
    LoginFormComponent,
    ChangePasswordComponent,
    CustomerManagerComponent,
    ReportsSummaryComponent,
    ScheduleViewComponent,
    DashboardSummaryComponent,
    OrderFormComponent,
    MenuManagerComponent,
    OrderListComponent,
  ],
  template: `
    @if (!isLoggedIn) {
      <app-login-form [message]="statusMessage" (loggedIn)="handleLogin()" />
    } @else {
      <main class="app-shell">
        <aside class="sidebar">
          <div>
            <p class="eyebrow">Mess Ketering</p>
            <h1>Catering Manager</h1>
          </div>

          <nav class="nav" aria-label="Main sections">
            <button type="button" [class.active]="activeSection === 'dashboard'" (click)="setSection('dashboard')">
              Dashboard
            </button>
            <button type="button" [class.active]="activeSection === 'customers'" (click)="setSection('customers')">
              <span>Customers</span>
              <strong>{{ customers.length }}</strong>
            </button>
            <button type="button" [class.active]="activeSection === 'orders'" (click)="setSection('orders')">
              <span>Orders</span>
              <strong>{{ orders.length }}</strong>
            </button>
            <button type="button" [class.active]="activeSection === 'menu'" (click)="setSection('menu')">
              <span>Menu</span>
              <strong>{{ menuItems.length }}</strong>
            </button>
            <button type="button" [class.active]="activeSection === 'reports'" (click)="setSection('reports')">
              <span>Reports</span>
              <strong>{{ pendingOrdersCount }}</strong>
            </button>
            <button type="button" [class.active]="activeSection === 'schedule'" (click)="setSection('schedule')">
              <span>Schedule</span>
              <strong>{{ schedule.length }}</strong>
            </button>
            <button type="button" [class.active]="activeSection === 'settings'" (click)="setSection('settings')">
              Settings
            </button>
          </nav>

          <button type="button" class="logout" (click)="logout()">Logout</button>
        </aside>

        <section class="content">
          <header class="header">
            <div>
              <p class="eyebrow">{{ sectionTitle }}</p>
              <h2>{{ sectionHeading }}</h2>
              <p class="status">{{ statusMessage }}</p>
            </div>
          </header>

          @if (activeSection === 'dashboard') {
            @if (isLoadingDashboard) {
              <p class="state-message">Loading dashboard...</p>
            } @else {
              <app-dashboard-summary [summary]="dashboardSummary" />
              <section class="quick-actions" aria-label="Quick actions">
                <button type="button" (click)="openCreateOrder()">Create Order</button>
                <button type="button" class="secondary-action" (click)="openManageOrders()">Manage Orders</button>
                <button type="button" class="secondary-action" (click)="setSection('menu')">Manage Menu</button>
                <button type="button" class="secondary-action" (click)="setSection('customers')">View Customers</button>
                <button type="button" class="secondary-action" (click)="setSection('reports')">View Reports</button>
              </section>
            }
          }

          @if (activeSection === 'customers') {
            @if (isLoadingCustomers) {
              <p class="state-message">Loading customers...</p>
            } @else {
              <app-customer-manager
                [customers]="customers"
                (customersChanged)="refreshCustomersAndOrders()"
                (statusChanged)="setStatus($event)"
              />
            }
          }

          @if (activeSection === 'orders') {
            @if (isLoadingMenuItems || isLoadingOrders) {
              <p class="state-message">Loading orders...</p>
            } @else {
              <div class="tabs" role="tablist" aria-label="Order tools">
                <button
                  type="button"
                  role="tab"
                  [class.active]="activeOrderTab === 'create'"
                  (click)="activeOrderTab = 'create'"
                >
                  Create Order
                </button>
                <button
                  type="button"
                  role="tab"
                  [class.active]="activeOrderTab === 'manage'"
                  (click)="activeOrderTab = 'manage'"
                >
                  Manage Orders
                </button>
              </div>

              @if (activeOrderTab === 'create') {
                <app-order-form
                  [menuItems]="menuItems"
                  (orderCreated)="handleOrderCreated()"
                  (statusChanged)="setStatus($event)"
                />
              }

              @if (activeOrderTab === 'manage') {
                <app-order-list
                  [orders]="orders"
                  (ordersChanged)="refreshOrdersAndDashboard()"
                  (statusChanged)="setStatus($event)"
                />
              }
            }
          }

          @if (activeSection === 'menu') {
            @if (isLoadingMenuItems) {
              <p class="state-message">Loading menu items...</p>
            } @else {
              <app-menu-manager
                [menuItems]="menuItems"
                (menuChanged)="loadMenuItems()"
                (statusChanged)="setStatus($event)"
              />
            }
          }

          @if (activeSection === 'reports') {
            @if (isLoadingReports) {
              <p class="state-message">Loading reports...</p>
            } @else {
              <app-reports-summary [reports]="reportsSummary" />
            }
          }

          @if (activeSection === 'schedule') {
            @if (isLoadingSchedule) {
              <p class="state-message">Loading schedule...</p>
            } @else {
              <app-schedule-view [schedule]="schedule" />
            }
          }

          @if (activeSection === 'settings') {
            <app-change-password (statusChanged)="setStatus($event)" />
          }
        </section>
      </main>
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f7f4ef;
      color: #211f1c;
      font-family: Arial, Helvetica, sans-serif;
    }

    .app-shell {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      position: sticky;
      top: 0;
      display: flex;
      height: 100vh;
      box-sizing: border-box;
      flex-direction: column;
      justify-content: space-between;
      gap: 24px;
      padding: 24px;
      border-right: 1px solid #ded6ca;
      background: #fffdf9;
    }

    .content {
      min-width: 0;
      padding: 32px;
    }

    .header {
      margin-bottom: 24px;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: #9a4b1f;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 1.4rem;
      line-height: 1.15;
    }

    h2 {
      margin: 0;
      font-size: clamp(1.8rem, 4vw, 3rem);
      line-height: 1.15;
    }

    .status {
      max-width: 620px;
      margin: 14px 0 0;
      color: #5f5a52;
      font-size: 1rem;
      line-height: 1.5;
    }

    .state-message {
      margin: 0;
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      color: #645d54;
      font-weight: 700;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 18px;
      border-bottom: 1px solid #ded6ca;
    }

    .tabs button {
      min-height: 40px;
      border: 1px solid #ded6ca;
      border-bottom: 0;
      border-radius: 8px 8px 0 0;
      padding: 0 14px;
      color: #211f1c;
      font: inherit;
      font-weight: 700;
      background: #fffdf9;
      cursor: pointer;
    }

    .tabs button.active {
      color: #ffffff;
      border-color: #19624a;
      background: #19624a;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 28px;
    }

    .quick-actions button {
      min-height: 48px;
      border: 0;
      border-radius: 8px;
      padding: 0 16px;
      color: #ffffff;
      font: inherit;
      font-weight: 700;
      background: #19624a;
      cursor: pointer;
    }

    .quick-actions .secondary-action {
      border: 1px solid #cfc6b8;
      color: #211f1c;
      background: #fffdf9;
    }

    .nav {
      display: grid;
      gap: 8px;
    }

    .nav button,
    .logout {
      min-height: 40px;
      border: 1px solid #cfc6b8;
      border-radius: 6px;
      padding: 0 14px;
      color: #211f1c;
      font: inherit;
      font-weight: 700;
      background: #ffffff;
      cursor: pointer;
    }

    .nav button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      text-align: left;
    }

    .nav strong {
      min-width: 28px;
      border-radius: 999px;
      padding: 3px 8px;
      color: #19624a;
      font-size: 0.82rem;
      line-height: 1;
      text-align: center;
      background: #d9f1e6;
    }

    .nav button.active {
      border-color: #19624a;
      color: #ffffff;
      background: #19624a;
    }

    .nav button.active strong {
      color: #19624a;
      background: #ffffff;
    }

    @media (max-width: 760px) {
      .app-shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid #ded6ca;
      }

      .content {
        padding: 20px 16px;
      }
    }
  `],
})
export class AppComponent implements OnInit {
  private readonly activeSectionKey = 'mess_ketering_active_section';
  private readonly sections = ['dashboard', 'customers', 'orders', 'menu', 'reports', 'schedule', 'settings'] as const;
  activeSection: 'dashboard' | 'customers' | 'orders' | 'menu' | 'reports' | 'schedule' | 'settings' = 'dashboard';
  activeOrderTab: 'create' | 'manage' = 'manage';
  isLoggedIn = false;
  dashboardSummary: DashboardSummary | null = null;
  reportsSummary: ReportsSummary | null = null;
  schedule: ScheduleEvent[] = [];
  customers: Customer[] = [];
  menuItems: MenuItem[] = [];
  orders: Order[] = [];
  statusMessage = 'Loading data from the database...';
  isLoadingDashboard = false;
  isLoadingReports = false;
  isLoadingSchedule = false;
  isLoadingCustomers = false;
  isLoadingMenuItems = false;
  isLoadingOrders = false;

  constructor(private api: CateringApiService) {}

  get pendingOrdersCount() {
    return this.orders.filter((order) => order.status === 'Pending').length;
  }

  get sectionTitle() {
    return {
      dashboard: 'Overview',
      customers: 'Customer Management',
      orders: 'Order Workflow',
      menu: 'Menu Management',
      reports: 'Business Reports',
      schedule: 'Delivery Schedule',
      settings: 'Admin Settings',
    }[this.activeSection];
  }

  get sectionHeading() {
    return {
      dashboard: 'Dashboard',
      customers: 'Customers',
      orders: 'Orders',
      menu: 'Menu Items',
      reports: 'Reports',
      schedule: 'Schedule',
      settings: 'Settings',
    }[this.activeSection];
  }

  setSection(section: typeof this.activeSection) {
    this.activeSection = section;
    this.saveActiveSection(section);
  }

  openCreateOrder() {
    this.activeOrderTab = 'create';
    this.setSection('orders');
  }

  openManageOrders() {
    this.activeOrderTab = 'manage';
    this.setSection('orders');
  }

  ngOnInit() {
    this.api.unauthorized$.subscribe(() => {
      this.handleUnauthorized();
    });

    this.activeSection = this.loadActiveSection();
    this.isLoggedIn = this.api.isLoggedIn();

    if (!this.isLoggedIn) {
      return;
    }

    this.loadInitialData();
  }

  handleLogin() {
    this.isLoggedIn = true;
    this.statusMessage = 'Logged in.';
    this.loadInitialData();
  }

  logout() {
    this.api.logout().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.dashboardSummary = null;
        this.reportsSummary = null;
        this.schedule = [];
        this.customers = [];
        this.menuItems = [];
        this.orders = [];
        this.statusMessage = 'Logged out.';
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Failed to logout.');
        console.error(err);
      },
    });
  }

  private loadInitialData() {
    this.loadDashboardSummary();
    this.loadReports();
    this.loadSchedule();
    this.loadCustomers();
    this.loadMenuItems();
    this.loadOrders();
  }

  loadDashboardSummary() {
    this.isLoadingDashboard = true;

    this.api.getDashboardSummary().subscribe({
      next: (response) => {
        this.dashboardSummary = response.data;
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Failed to load dashboard summary from the backend.');
        console.error(err);
      },
      complete: () => {
        this.isLoadingDashboard = false;
      },
    });
  }

  loadReports() {
    this.isLoadingReports = true;

    this.api.getReports().subscribe({
      next: (response) => {
        this.reportsSummary = response.data;
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Failed to load reports from the backend.');
        console.error(err);
      },
      complete: () => {
        this.isLoadingReports = false;
      },
    });
  }

  loadSchedule() {
    this.isLoadingSchedule = true;

    this.api.getSchedule().subscribe({
      next: (response) => {
        this.schedule = response.data;
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Failed to load schedule from the backend.');
        console.error(err);
      },
      complete: () => {
        this.isLoadingSchedule = false;
      },
    });
  }

  loadMenuItems() {
    this.isLoadingMenuItems = true;

    this.api.getMenuItems().subscribe({
      next: (response) => {
        this.menuItems = response.data;
        this.statusMessage = `Showing ${response.data.length} menu items from MySQL.`;
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Failed to load menu items from the backend.');
        console.error(err);
      },
      complete: () => {
        this.isLoadingMenuItems = false;
      },
    });
  }

  loadCustomers() {
    this.isLoadingCustomers = true;

    this.api.getCustomers().subscribe({
      next: (response) => {
        this.customers = response.data;
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Failed to load customers from the backend.');
        console.error(err);
      },
      complete: () => {
        this.isLoadingCustomers = false;
      },
    });
  }

  loadOrders() {
    this.isLoadingOrders = true;

    this.api.getOrders().subscribe({
      next: (response) => {
        this.orders = response.data;
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Failed to load orders from the backend.');
        console.error(err);
      },
      complete: () => {
        this.isLoadingOrders = false;
      },
    });
  }

  refreshOrdersAndDashboard() {
    this.loadOrders();
    this.loadDashboardSummary();
    this.loadReports();
    this.loadSchedule();
    this.loadCustomers();
  }

  handleOrderCreated() {
    this.activeOrderTab = 'manage';
    this.refreshOrdersAndDashboard();
  }

  refreshCustomersAndOrders() {
    this.loadCustomers();
    this.loadOrders();
  }

  setStatus(message: string) {
    this.statusMessage = message;
  }

  private handleUnauthorized() {
    this.isLoggedIn = false;
    this.dashboardSummary = null;
    this.reportsSummary = null;
    this.schedule = [];
    this.customers = [];
    this.menuItems = [];
    this.orders = [];
    this.isLoadingDashboard = false;
    this.isLoadingReports = false;
    this.isLoadingSchedule = false;
    this.isLoadingCustomers = false;
    this.isLoadingMenuItems = false;
    this.isLoadingOrders = false;
    this.statusMessage = 'Session expired. Please login again.';
  }

  private loadActiveSection(): typeof this.activeSection {
    if (!this.hasBrowserStorage()) {
      return 'dashboard';
    }

    const savedSection = localStorage.getItem(this.activeSectionKey);

    if (this.sections.includes(savedSection as typeof this.activeSection)) {
      return savedSection as typeof this.activeSection;
    }

    return 'dashboard';
  }

  private saveActiveSection(section: typeof this.activeSection) {
    if (!this.hasBrowserStorage()) {
      return;
    }

    localStorage.setItem(this.activeSectionKey, section);
  }

  private hasBrowserStorage() {
    return typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
  }
}
