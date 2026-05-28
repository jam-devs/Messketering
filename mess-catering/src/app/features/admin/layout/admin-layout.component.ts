import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminHeaderComponent } from './admin-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminHeaderComponent],
  template: `
    <div class="admin-shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-admin-sidebar [collapsed]="sidebarCollapsed()" />
      <div class="admin-main">
        <app-admin-header (menuToggle)="toggleSidebar()" />
        <main class="admin-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
