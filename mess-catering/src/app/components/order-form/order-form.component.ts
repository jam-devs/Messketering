import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CateringApiService } from '../../services/catering-api.service';
import { MenuItem, PendingOrderItem } from '../../models/catering-manager.model';
import { getApiErrorMessage } from '../../shared/utils/api-error.utils';

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel">
      <h2>New Order</h2>
      <form class="order-form" [formGroup]="orderForm" (ngSubmit)="createOrder()">
        <div class="field">
          <label for="customerName">Customer Name</label>
          <input id="customerName" type="text" formControlName="customer_name">
        </div>

        <div class="field">
          <label for="contactNumber">Contact Number</label>
          <input id="contactNumber" type="text" formControlName="contact_number">
        </div>

        <div class="field">
          <label for="deliveryDate">Delivery Date</label>
          <input id="deliveryDate" type="date" formControlName="delivery_date">
        </div>

        <div class="field field-wide">
          <label for="address">Address</label>
          <input id="address" type="text" formControlName="address">
        </div>

        <div class="field field-wide">
          <label for="notes">Notes</label>
          <textarea id="notes" rows="2" formControlName="notes"></textarea>
        </div>

        <div class="order-picker field-wide">
          <div class="field">
            <label for="menuItem">Menu Item</label>
            <select id="menuItem" [formControl]="selectedMenuItemId">
              @for (item of availableMenuItems; track item.id) {
                <option [value]="item.id">{{ item.name }} - PHP {{ item.price }}</option>
              }
            </select>
          </div>

          <div class="field">
            <label for="quantity">Quantity</label>
            <input id="quantity" type="number" min="1" [formControl]="selectedQuantity">
          </div>

          <button type="button" (click)="addOrderItem()">Add to Order</button>
        </div>

        @if (pendingOrderItems.length) {
          <div class="line-items field-wide">
            @for (item of pendingOrderItems; track item.menu_item_id) {
              <div class="line-item">
                <span>{{ item.name }} x {{ item.quantity }}</span>
                <strong>PHP {{ item.line_total.toFixed(2) }}</strong>
                <button type="button" class="danger compact" (click)="removeOrderItem(item.menu_item_id)">Remove</button>
              </div>
            }
            <div class="line-total">
              <span>Total</span>
              <strong>PHP {{ orderTotal.toFixed(2) }}</strong>
            </div>
          </div>
        }

        <div class="form-actions field-wide">
          <button type="submit" [disabled]="orderForm.invalid || !pendingOrderItems.length || isCreatingOrder">
            Create Order
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .panel {
      margin-bottom: 28px;
      padding-top: 8px;
    }

    h2 {
      margin: 0 0 16px;
      font-size: 1.6rem;
      line-height: 1.15;
    }

    .order-form {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-weight: 700;
    }

    .field-wide {
      grid-column: 1 / -1;
    }

    input,
    textarea,
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

    .order-picker {
      display: grid;
      grid-template-columns: 1fr 160px auto;
      gap: 16px;
      align-items: end;
    }

    .form-actions {
      display: flex;
      align-items: end;
      gap: 10px;
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

    .danger {
      background: #a83c2d;
    }

    .compact {
      min-height: 32px;
      padding: 0 10px;
      font-size: 0.9rem;
    }

    .line-items {
      display: grid;
      gap: 10px;
      padding: 14px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #faf7f1;
    }

    .line-item,
    .line-total {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      align-items: center;
    }

    .line-total {
      grid-template-columns: 1fr auto;
      padding-top: 10px;
      border-top: 1px solid #ded6ca;
      font-size: 1.15rem;
    }

    @media (max-width: 760px) {
      .order-form,
      .order-picker {
        grid-template-columns: 1fr;
      }

      .line-item {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      .line-item span {
        grid-column: 1 / -1;
      }
    }
  `],
})
export class OrderFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(CateringApiService);

  @Output() orderCreated = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<string>();

  pendingOrderItems: PendingOrderItem[] = [];
  isCreatingOrder = false;

  orderForm = this.fb.nonNullable.group({
    customer_name: ['', Validators.required],
    contact_number: ['', Validators.required],
    address: [''],
    delivery_date: [''],
    notes: [''],
  });

  selectedMenuItemId = this.fb.nonNullable.control(0, Validators.required);
  selectedQuantity = this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]);

  private currentMenuItems: MenuItem[] = [];

  @Input({ required: true })
  set menuItems(items: MenuItem[]) {
    this.currentMenuItems = items;

    if (!this.selectedMenuItemId.value && this.availableMenuItems.length) {
      this.selectedMenuItemId.setValue(this.availableMenuItems[0].id);
    }
  }

  get availableMenuItems() {
    return this.currentMenuItems.filter((item) => item.is_available);
  }

  get orderTotal() {
    return this.pendingOrderItems.reduce((total, item) => total + item.line_total, 0);
  }

  addOrderItem() {
    const menuItem = this.currentMenuItems.find((item) => item.id === Number(this.selectedMenuItemId.value));
    const quantity = Number(this.selectedQuantity.value);

    if (!menuItem || quantity < 1) {
      return;
    }

    const existing = this.pendingOrderItems.find((item) => item.menu_item_id === menuItem.id);
    const unitPrice = Number(menuItem.price);

    if (existing) {
      existing.quantity += quantity;
      existing.line_total = existing.quantity * existing.unit_price;
      return;
    }

    this.pendingOrderItems = [
      ...this.pendingOrderItems,
      {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity,
        unit_price: unitPrice,
        line_total: unitPrice * quantity,
      },
    ];
  }

  removeOrderItem(menuItemId: number) {
    this.pendingOrderItems = this.pendingOrderItems.filter((item) => item.menu_item_id !== menuItemId);
  }

  createOrder() {
    if (this.orderForm.invalid || !this.pendingOrderItems.length) {
      return;
    }

    this.isCreatingOrder = true;
    const formValue = this.orderForm.getRawValue();
    const payload = {
      ...formValue,
      delivery_date: formValue.delivery_date || null,
      items: this.pendingOrderItems.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      })),
    };

    this.api.createOrder(payload).subscribe({
      next: () => {
        this.statusChanged.emit('Order created.');
        this.orderForm.reset({
          customer_name: '',
          contact_number: '',
          address: '',
          delivery_date: '',
          notes: '',
        });
        this.pendingOrderItems = [];
        this.selectedQuantity.setValue(1);
        this.orderCreated.emit();
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to create order.'));
        console.error(err);
      },
      complete: () => {
        this.isCreatingOrder = false;
      },
    });
  }
}
