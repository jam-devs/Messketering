import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CateringApiService } from '../../services/catering-api.service';
import { Order } from '../../models/catering-manager.model';
import { getApiErrorMessage } from '../../shared/utils/api-error.utils';

@Component({
  selector: 'app-order-list',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel">
      <h2>Recent Orders</h2>
      <form class="filters" [formGroup]="filtersForm">
        <label class="field">
          Search
          <input type="search" placeholder="Customer or contact" formControlName="search">
        </label>
        <label class="field">
          Status
          <select formControlName="status">
            <option value="All">All statuses</option>
            @for (status of orderStatuses; track status) {
              <option [value]="status">{{ status }}</option>
            }
          </select>
        </label>
        <label class="field">
          Payment
          <select formControlName="paymentState">
            <option value="All">All payments</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </label>
        <label class="field">
          Delivery Date
          <input type="date" formControlName="deliveryDate">
        </label>
        <button type="button" class="secondary" (click)="clearFilters()">Clear</button>
      </form>

      @if (selectedOrder; as order) {
        <article class="details-panel">
          <div class="details-header">
            <div>
              <p class="category">Order #{{ order.id }}</p>
              <h3>{{ order.customer_name }}</h3>
              <span class="status-pill" [class]="statusClass(order.status)">{{ order.status }}</span>
            </div>
            <div class="details-actions">
              <button type="button" class="secondary" (click)="printReceipt(order)">Print Receipt</button>
              <button type="button" class="secondary" (click)="closeDetails()">Close</button>
            </div>
          </div>

          <div class="details-grid">
            <section>
              <h4>Customer</h4>
              <p class="description">{{ order.contact_number }}</p>
              <p class="description">{{ order.address || 'No address set' }}</p>
              <p class="description">Delivery: {{ order.delivery_date || 'Not set' }}</p>
              @if (order.notes) {
                <p class="description">Notes: {{ order.notes }}</p>
              }
            </section>

            <section class="totals-box">
              <h4>Totals</h4>
              <dl>
                <div>
                  <dt>Total</dt>
                  <dd>PHP {{ order.total_amount }}</dd>
                </div>
                <div>
                  <dt>Paid</dt>
                  <dd>PHP {{ order.paid_amount }}</dd>
                </div>
                <div>
                  <dt>Balance</dt>
                  <dd>PHP {{ order.balance_amount }}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section>
            <h4>Items</h4>
            <div class="detail-table">
              <div class="table-row table-head">
                <span>Item</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Total</span>
              </div>
              @for (item of order.items; track item.name) {
                <div class="table-row">
                  <span>{{ item.name }}</span>
                  <span>{{ item.quantity }}</span>
                  <span>PHP {{ item.unit_price }}</span>
                  <span>PHP {{ item.line_total }}</span>
                </div>
              }
            </div>
          </section>

          <section>
            <h4>Payments</h4>
            <div class="detail-table">
              <div class="table-row table-head">
                <span>Amount</span>
                <span>Method</span>
                <span>Date</span>
                <span>Notes</span>
              </div>
              @for (payment of order.payments; track payment.id) {
                <div class="table-row">
                  <span>PHP {{ payment.amount }}</span>
                  <span>{{ payment.payment_method }}</span>
                  <span>{{ payment.paid_at || 'Not set' }}</span>
                  <span>{{ payment.notes || '-' }}</span>
                </div>
              } @empty {
                <p class="description">No payments recorded.</p>
              }
            </div>
          </section>
        </article>
      }

      <div class="orders-list">
        @for (order of filteredOrders; track order.id) {
          <article class="order-card">
            <div>
              <p class="category">Order #{{ order.id }}</p>
              <h3>{{ order.customer_name }}</h3>
              <span class="status-pill" [class]="statusClass(order.status)">{{ order.status }}</span>
              <p class="description">
                {{ order.contact_number }}
                @if (order.delivery_date) {
                  <span> | Delivery: {{ order.delivery_date }}</span>
                }
              </p>
              @if (order.address) {
                <p class="description">{{ order.address }}</p>
              }
              <p class="order-line">{{ order.items.length }} item(s)</p>
            </div>
            <div class="order-side">
              <strong class="price">PHP {{ order.total_amount }}</strong>
              <div class="payment-summary">
                <span>Paid: PHP {{ order.paid_amount }}</span>
                <span>Balance: PHP {{ order.balance_amount }}</span>
              </div>
              <label class="field">
                Status
                <select #statusSelect [value]="order.status">
                  @for (status of orderStatuses; track status) {
                    <option [value]="status">{{ status }}</option>
                  }
                </select>
              </label>
              <button type="button" class="secondary" (click)="viewDetails(order)">View Details</button>
              <button type="button" (click)="updateOrderStatus(order, statusSelect.value)">Update</button>
              @if (order.status !== 'Cancelled') {
                <button type="button" class="secondary" (click)="cancelOrder(order)">Cancel Order</button>
              }
              <button type="button" class="danger" (click)="deleteOrder(order)">Delete Order</button>
              <button type="button" class="secondary" (click)="printReceipt(order)">Print Receipt</button>
            </div>
            <div class="payment-box">
              <div class="payment-form">
                <label class="field">
                  Amount
                  <input #paymentAmount type="number" min="1" step="0.01" [value]="order.balance_amount">
                </label>
                <label class="field">
                  Method
                  <select #paymentMethod>
                    @for (method of paymentMethods; track method) {
                      <option [value]="method">{{ method }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  Notes
                  <input #paymentNotes type="text" placeholder="Optional">
                </label>
                <button
                  type="button"
                  [disabled]="Number(order.balance_amount) <= 0"
                  (click)="recordPayment(order, paymentAmount.value, paymentMethod.value, paymentNotes.value)"
                >
                  Record Payment
                </button>
              </div>

              @if (order.payments.length) {
                <div class="payment-history">
                  @for (payment of order.payments; track payment.id) {
                    <p>
                      PHP {{ payment.amount }} via {{ payment.payment_method }}
                      @if (payment.paid_at) {
                        <span> | {{ payment.paid_at }}</span>
                      }
                    </p>
                  }
                </div>
              }
            </div>
          </article>
        } @empty {
          <p class="description">No orders match the current filters.</p>
        }
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
    h4 {
      margin: 0;
      line-height: 1.15;
    }

    h2 {
      margin-bottom: 16px;
      font-size: 1.6rem;
    }

    h3 {
      font-size: 1.15rem;
    }

    h4 {
      margin-bottom: 10px;
      font-size: 1rem;
    }

    .orders-list {
      display: grid;
      gap: 12px;
    }

    .filters {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1fr auto;
      gap: 12px;
      align-items: end;
      margin-bottom: 16px;
      padding: 16px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
    }

    .order-card {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: start;
      justify-content: space-between;
      gap: 20px;
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    .details-panel {
      display: grid;
      gap: 20px;
      margin-bottom: 16px;
      padding: 20px;
      border: 1px solid #c8bca9;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 10px 28px rgb(33 31 28 / 10%);
    }

    .details-header,
    .details-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      align-items: start;
    }

    .details-actions {
      display: flex;
      gap: 10px;
    }

    .totals-box {
      min-width: 240px;
    }

    dl {
      display: grid;
      gap: 8px;
      margin: 0;
    }

    dl div {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }

    dt {
      color: #645d54;
      font-weight: 700;
    }

    dd {
      margin: 0;
      color: #19624a;
      font-weight: 700;
      text-align: right;
    }

    .detail-table {
      display: grid;
      overflow-x: auto;
      border: 1px solid #ded6ca;
      border-radius: 8px;
    }

    .table-row {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 80px 120px 120px;
      gap: 12px;
      min-width: 560px;
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

    .category {
      margin: 0 0 8px;
      color: #9a4b1f;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .description,
    .order-line {
      margin: 10px 0 0;
      color: #645d54;
      line-height: 1.5;
    }

    .price {
      color: #19624a;
      font-size: 1.25rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-weight: 700;
    }

    input,
    select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #cfc6b8;
      border-radius: 6px;
      padding: 10px 12px;
      color: #211f1c;
      font: inherit;
      background: #ffffff;
    }

    button {
      min-height: 40px;
      border: 0;
      border-radius: 6px;
      padding: 0 14px;
      color: #ffffff;
      font: inherit;
      font-weight: 700;
      background: #19624a;
      cursor: pointer;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .secondary {
      border: 1px solid #cfc6b8;
      color: #211f1c;
      background: #ffffff;
    }

    .danger {
      background: #a83c2d;
    }

    .status-pill {
      display: inline-flex;
      width: fit-content;
      margin-top: 10px;
      border-radius: 999px;
      padding: 5px 10px;
      color: #211f1c;
      font-size: 0.8rem;
      font-weight: 700;
      background: #eadfce;
    }

    .status-confirmed {
      color: #174a79;
      background: #dcecff;
    }

    .status-preparing {
      color: #7a4a00;
      background: #ffe7bf;
    }

    .status-delivery {
      color: #5b3578;
      background: #eadcff;
    }

    .status-completed {
      color: #19624a;
      background: #d9f1e6;
    }

    .status-cancelled {
      color: #8f2e24;
      background: #f7d8d3;
    }

    .order-side {
      display: grid;
      min-width: 190px;
      gap: 12px;
      justify-items: end;
    }

    .payment-summary,
    .payment-history {
      display: grid;
      gap: 6px;
      color: #645d54;
      font-size: 0.95rem;
      text-align: right;
    }

    .payment-box {
      grid-column: 1 / -1;
      display: grid;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #ded6ca;
    }

    .payment-form {
      display: grid;
      grid-template-columns: 160px 180px 1fr auto;
      gap: 12px;
      align-items: end;
    }

    .payment-history {
      padding: 10px 12px;
      border-radius: 8px;
      background: #faf7f1;
      text-align: left;
    }

    .payment-history p {
      margin: 0;
    }

    @media (max-width: 760px) {
      .filters,
      .details-header,
      .details-grid,
      .order-card,
      .payment-form {
        grid-template-columns: 1fr;
      }

      .details-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
    }
  `],
})
export class OrderListComponent {
  private fb = inject(FormBuilder);
  private api = inject(CateringApiService);

  @Input({ required: true }) orders: Order[] = [];
  @Output() ordersChanged = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<string>();

  selectedOrderId: number | null = null;
  orderStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Completed', 'Cancelled'];
  paymentMethods = ['Cash', 'GCash', 'Bank Transfer'];
  protected readonly Number = Number;

  filtersForm = this.fb.nonNullable.group({
    search: [''],
    status: ['All'],
    paymentState: ['All'],
    deliveryDate: [''],
  });

  get filteredOrders() {
    const filters = this.filtersForm.getRawValue();
    const search = filters.search.trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesSearch = !search
        || order.customer_name.toLowerCase().includes(search)
        || order.contact_number.toLowerCase().includes(search);
      const matchesStatus = filters.status === 'All' || order.status === filters.status;
      const matchesDeliveryDate = !filters.deliveryDate || order.delivery_date === filters.deliveryDate;
      const matchesPaymentState = this.matchesPaymentState(order, filters.paymentState);

      return matchesSearch && matchesStatus && matchesDeliveryDate && matchesPaymentState;
    });
  }

  get selectedOrder() {
    if (!this.selectedOrderId) {
      return null;
    }

    return this.orders.find((order) => order.id === this.selectedOrderId) ?? null;
  }

  clearFilters() {
    this.filtersForm.reset({
      search: '',
      status: 'All',
      paymentState: 'All',
      deliveryDate: '',
    });
  }

  viewDetails(order: Order) {
    this.selectedOrderId = order.id;
  }

  closeDetails() {
    this.selectedOrderId = null;
  }

  updateOrderStatus(order: Order, status: string) {
    if (order.status === status) {
      return;
    }

    this.api.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.statusChanged.emit(`Order #${order.id} status updated to ${status}.`);
        this.ordersChanged.emit();
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to update order status.'));
        console.error(err);
      },
    });
  }

  cancelOrder(order: Order) {
    const shouldCancel = confirm(`Cancel order #${order.id}? This keeps the order history.`);

    if (!shouldCancel) {
      return;
    }

    this.updateOrderStatus(order, 'Cancelled');
  }

  deleteOrder(order: Order) {
    const shouldDelete = confirm(`Delete order #${order.id}? This removes the order permanently.`);

    if (!shouldDelete) {
      return;
    }

    this.api.deleteOrder(order.id).subscribe({
      next: () => {
        this.statusChanged.emit(`Order #${order.id} deleted.`);
        if (this.selectedOrderId === order.id) {
          this.selectedOrderId = null;
        }
        this.ordersChanged.emit();
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to delete order.'));
        console.error(err);
      },
    });
  }

  recordPayment(order: Order, amountValue: string, paymentMethod: string, notes: string) {
    const amount = Number(amountValue);
    const balance = Number(order.balance_amount);

    if (!amount || amount <= 0) {
      this.statusChanged.emit('Enter a valid payment amount.');
      return;
    }

    if (amount > balance) {
      this.statusChanged.emit(`Payment amount cannot exceed PHP ${order.balance_amount}.`);
      return;
    }

    this.api.recordPayment(order.id, {
      amount,
      payment_method: paymentMethod,
      notes,
    }).subscribe({
      next: () => {
        this.statusChanged.emit(`Payment recorded for order #${order.id}.`);
        this.ordersChanged.emit();
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to record payment.'));
        console.error(err);
      },
    });
  }

  printReceipt(order: Order) {
    const receiptWindow = window.open('', '_blank', 'width=820,height=900');

    if (!receiptWindow) {
      this.statusChanged.emit('Allow pop-ups to print the receipt.');
      return;
    }

    receiptWindow.document.write(this.buildReceiptHtml(order));
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  }

  statusClass(status: string) {
    return {
      Pending: 'status-pending',
      Confirmed: 'status-confirmed',
      Preparing: 'status-preparing',
      'Out for Delivery': 'status-delivery',
      Completed: 'status-completed',
      Cancelled: 'status-cancelled',
    }[status] ?? 'status-pending';
  }

  private matchesPaymentState(order: Order, paymentState: string) {
    const paid = Number(order.paid_amount);
    const balance = Number(order.balance_amount);

    if (paymentState === 'Paid') {
      return balance <= 0;
    }

    if (paymentState === 'Partial') {
      return paid > 0 && balance > 0;
    }

    if (paymentState === 'Unpaid') {
      return paid <= 0;
    }

    return true;
  }

  private buildReceiptHtml(order: Order) {
    const itemRows = order.items.map((item) => `
      <tr>
        <td>${this.escapeHtml(item.name)}</td>
        <td>${item.quantity}</td>
        <td>PHP ${item.unit_price}</td>
        <td>PHP ${item.line_total}</td>
      </tr>
    `).join('');

    const paymentRows = order.payments.length
      ? order.payments.map((payment) => `
        <tr>
          <td>PHP ${payment.amount}</td>
          <td>${this.escapeHtml(payment.payment_method)}</td>
          <td>${this.escapeHtml(payment.paid_at ?? '')}</td>
          <td>${this.escapeHtml(payment.notes ?? '')}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4">No payments recorded.</td></tr>';

    return `
      <!doctype html>
      <html>
        <head>
          <title>Receipt Order #${order.id}</title>
          <style>
            body {
              margin: 0;
              padding: 32px;
              color: #211f1c;
              font-family: Arial, Helvetica, sans-serif;
            }

            .receipt {
              max-width: 760px;
              margin: 0 auto;
            }

            header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              border-bottom: 2px solid #211f1c;
              padding-bottom: 18px;
              margin-bottom: 22px;
            }

            h1, h2, p {
              margin: 0;
            }

            h1 {
              font-size: 28px;
            }

            h2 {
              margin: 24px 0 10px;
              font-size: 16px;
            }

            .muted {
              color: #645d54;
              margin-top: 6px;
            }

            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px 24px;
              margin-bottom: 16px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }

            th, td {
              border-bottom: 1px solid #ded6ca;
              padding: 10px 8px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f7f4ef;
            }

            .totals {
              display: grid;
              justify-content: end;
              gap: 8px;
              margin-top: 18px;
              text-align: right;
            }

            .totals strong {
              font-size: 18px;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <main class="receipt">
            <header>
              <div>
                <h1>Mess Ketering</h1>
                <p class="muted">Catering Order Receipt</p>
              </div>
              <div>
                <p><strong>Order #${order.id}</strong></p>
                <p class="muted">Status: ${this.escapeHtml(order.status)}</p>
              </div>
            </header>

            <section class="details">
              <p><strong>Customer:</strong> ${this.escapeHtml(order.customer_name)}</p>
              <p><strong>Contact:</strong> ${this.escapeHtml(order.contact_number)}</p>
              <p><strong>Delivery:</strong> ${this.escapeHtml(order.delivery_date ?? 'Not set')}</p>
              <p><strong>Address:</strong> ${this.escapeHtml(order.address ?? 'Not set')}</p>
            </section>

            <h2>Ordered Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div class="totals">
              <span>Total: <strong>PHP ${order.total_amount}</strong></span>
              <span>Paid: <strong>PHP ${order.paid_amount}</strong></span>
              <span>Balance: <strong>PHP ${order.balance_amount}</strong></span>
            </div>

            <h2>Payments</h2>
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>${paymentRows}</tbody>
            </table>
          </main>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
