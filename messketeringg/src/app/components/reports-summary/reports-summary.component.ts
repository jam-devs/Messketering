import { Component, Input } from '@angular/core';
import { ReportsSummary } from '../../models/catering-manager.model';

@Component({
  selector: 'app-reports-summary',
  template: `
    <section class="panel">
      <h2>Reports</h2>

      <div class="report-grid">
        <article class="report-card">
          <h3>Sales Summary</h3>
          <dl>
            <div>
              <dt>Total Sales</dt>
              <dd>PHP {{ reports?.sales_summary?.total_sales ?? '0.00' }}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>PHP {{ reports?.sales_summary?.paid_amount ?? '0.00' }}</dd>
            </div>
            <div>
              <dt>Unpaid</dt>
              <dd>PHP {{ reports?.sales_summary?.unpaid_balance ?? '0.00' }}</dd>
            </div>
          </dl>
        </article>

        <article class="report-card">
          <h3>Orders by Status</h3>
          @for (row of reports?.orders_by_status ?? []; track row.status) {
            <p class="line"><span>{{ row.status }}</span><strong>{{ row.count }}</strong></p>
          } @empty {
            <p class="muted">No orders yet.</p>
          }
        </article>

        <article class="report-card">
          <h3>Payments by Method</h3>
          @for (row of reports?.payments_by_method ?? []; track row.payment_method) {
            <p class="line">
              <span>{{ row.payment_method }} ({{ row.payment_count }})</span>
              <strong>PHP {{ row.total_amount }}</strong>
            </p>
          } @empty {
            <p class="muted">No payments yet.</p>
          }
        </article>

        <article class="report-card wide">
          <h3>Best-Selling Items</h3>
          <div class="table">
            <div class="table-row table-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Sales</span>
            </div>
            @for (item of reports?.best_selling_items ?? []; track item.name) {
              <div class="table-row">
                <span>{{ item.name }}</span>
                <span>{{ item.quantity_sold }}</span>
                <span>PHP {{ item.sales_total }}</span>
              </div>
            } @empty {
              <p class="muted">No item sales yet.</p>
            }
          </div>
        </article>

        <article class="report-card wide">
          <h3>Unpaid Orders</h3>
          <div class="table">
            <div class="table-row table-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Balance</span>
            </div>
            @for (order of reports?.unpaid_orders ?? []; track order.id) {
              <div class="table-row">
                <span>#{{ order.id }}</span>
                <span>{{ order.customer_name }}</span>
                <span>PHP {{ order.balance_amount }}</span>
              </div>
            } @empty {
              <p class="muted">No unpaid orders.</p>
            }
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .panel {
      margin-bottom: 28px;
      padding-top: 8px;
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    h2 {
      margin-bottom: 16px;
      font-size: 1.6rem;
      line-height: 1.15;
    }

    h3 {
      margin-bottom: 14px;
      font-size: 1.1rem;
      line-height: 1.15;
    }

    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    .report-card {
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    .wide {
      grid-column: span 2;
    }

    dl {
      display: grid;
      gap: 10px;
      margin: 0;
    }

    dl div,
    .line {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: #645d54;
    }

    dt {
      color: #645d54;
      font-weight: 700;
    }

    dd,
    strong {
      margin: 0;
      color: #19624a;
      font-weight: 700;
      text-align: right;
    }

    .table {
      display: grid;
      overflow-x: auto;
      border: 1px solid #ded6ca;
      border-radius: 8px;
    }

    .table-row {
      display: grid;
      grid-template-columns: minmax(150px, 1fr) 100px 130px;
      gap: 12px;
      min-width: 420px;
      padding: 10px 12px;
      border-bottom: 1px solid #ded6ca;
    }

    .table-row:last-child {
      border-bottom: 0;
    }

    .table-head {
      color: #645d54;
      font-weight: 700;
      background: #faf7f1;
    }

    .muted {
      color: #645d54;
      line-height: 1.5;
    }

    @media (max-width: 760px) {
      .wide {
        grid-column: auto;
      }
    }
  `],
})
export class ReportsSummaryComponent {
  @Input() reports: ReportsSummary | null = null;
}
