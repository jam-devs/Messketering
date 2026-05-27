import { Component, Input } from '@angular/core';
import { DashboardSummary } from '../../models/catering-manager.model';

@Component({
  selector: 'app-dashboard-summary',
  template: `
    <section class="summary-grid" aria-label="Business summary">
      <article class="summary-card">
        <span>Total Orders</span>
        <strong>{{ summary?.total_orders ?? 0 }}</strong>
      </article>
      <article class="summary-card">
        <span>Pending</span>
        <strong>{{ summary?.pending_orders ?? 0 }}</strong>
      </article>
      <article class="summary-card">
        <span>Completed</span>
        <strong>{{ summary?.completed_orders ?? 0 }}</strong>
      </article>
      <article class="summary-card">
        <span>Total Sales</span>
        <strong>PHP {{ summary?.total_sales ?? '0.00' }}</strong>
      </article>
      <article class="summary-card">
        <span>Paid</span>
        <strong>PHP {{ summary?.paid_amount ?? '0.00' }}</strong>
      </article>
      <article class="summary-card warning">
        <span>Unpaid Balance</span>
        <strong>PHP {{ summary?.unpaid_balance ?? '0.00' }}</strong>
      </article>
    </section>
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 28px;
    }

    .summary-card {
      display: grid;
      gap: 8px;
      min-height: 96px;
      align-content: center;
      padding: 16px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    span {
      color: #645d54;
      font-size: 0.88rem;
      font-weight: 700;
    }

    strong {
      color: #19624a;
      font-size: 1.35rem;
      line-height: 1.15;
    }

    .warning strong {
      color: #a83c2d;
    }
  `],
})
export class DashboardSummaryComponent {
  @Input() summary: DashboardSummary | null = null;
}
