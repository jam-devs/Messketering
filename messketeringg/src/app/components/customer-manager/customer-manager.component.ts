import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CateringApiService } from '../../services/catering-api.service';
import { Customer } from '../../models/catering-manager.model';
import { getApiErrorMessage } from '../../shared/utils/api-error.utils';

@Component({
  selector: 'app-customer-manager',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Customers</h2>
          <p class="description">Search customers and update contact details.</p>
        </div>
        <label class="field search-field">
          Search
          <input type="search" placeholder="Name or contact" [formControl]="searchControl">
        </label>
      </div>

      @if (editingCustomer) {
        <form class="customer-form" [formGroup]="customerForm" (ngSubmit)="saveCustomer()">
          <div class="field">
            <label for="customerEditName">Name</label>
            <input id="customerEditName" type="text" formControlName="name">
          </div>
          <div class="field">
            <label for="customerEditContact">Contact Number</label>
            <input id="customerEditContact" type="text" formControlName="contact_number">
          </div>
          <div class="field field-wide">
            <label for="customerEditAddress">Address</label>
            <input id="customerEditAddress" type="text" formControlName="address">
          </div>
          <div class="form-actions field-wide">
            <button type="submit" [disabled]="customerForm.invalid || isSaving">Save Customer</button>
            <button type="button" class="secondary" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      }

      <div class="customer-grid">
        @for (customer of filteredCustomers; track customer.id) {
          <article class="customer-card">
            <div>
              <h3>{{ customer.name }}</h3>
              <p class="description">{{ customer.contact_number }}</p>
              @if (customer.address) {
                <p class="description">{{ customer.address }}</p>
              }
            </div>
            <dl>
              <div>
                <dt>Orders</dt>
                <dd>{{ customer.order_count }}</dd>
              </div>
              <div>
                <dt>Total Spent</dt>
                <dd>PHP {{ customer.total_spent }}</dd>
              </div>
              <div>
                <dt>Last Order</dt>
                <dd>{{ customer.last_order_at || 'None' }}</dd>
              </div>
            </dl>
            <button type="button" class="secondary" (click)="editCustomer(customer)">Edit</button>
          </article>
        } @empty {
          <p class="description">No customers match your search.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .panel {
      margin-bottom: 28px;
      padding-top: 8px;
    }

    .panel-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    h2 {
      font-size: 1.6rem;
      line-height: 1.15;
    }

    h3 {
      font-size: 1.15rem;
      line-height: 1.15;
    }

    .description {
      margin-top: 8px;
      color: #645d54;
      line-height: 1.5;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-weight: 700;
    }

    .search-field {
      width: min(320px, 100%);
    }

    .field-wide {
      grid-column: 1 / -1;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #cfc6b8;
      border-radius: 6px;
      padding: 10px 12px;
      color: #211f1c;
      font: inherit;
      background: #ffffff;
    }

    .customer-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 16px;
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
    }

    .customer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .customer-card {
      display: grid;
      gap: 16px;
      align-content: start;
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    dl {
      display: grid;
      gap: 8px;
      margin: 0;
    }

    dl div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
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

    .form-actions {
      display: flex;
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

    .secondary {
      border: 1px solid #cfc6b8;
      color: #211f1c;
      background: #ffffff;
    }

    @media (max-width: 760px) {
      .panel-header {
        align-items: stretch;
        flex-direction: column;
      }

      .customer-form {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class CustomerManagerComponent {
  private fb = inject(FormBuilder);
  private api = inject(CateringApiService);

  @Input({ required: true }) customers: Customer[] = [];
  @Output() customersChanged = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<string>();

  editingCustomer: Customer | null = null;
  isSaving = false;
  searchControl = this.fb.nonNullable.control('');

  customerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    contact_number: ['', Validators.required],
    address: [''],
  });

  get filteredCustomers() {
    const search = this.searchControl.value.trim().toLowerCase();

    if (!search) {
      return this.customers;
    }

    return this.customers.filter((customer) =>
      customer.name.toLowerCase().includes(search)
      || customer.contact_number.toLowerCase().includes(search)
      || (customer.address ?? '').toLowerCase().includes(search)
    );
  }

  editCustomer(customer: Customer) {
    this.editingCustomer = customer;
    this.customerForm.setValue({
      name: customer.name,
      contact_number: customer.contact_number,
      address: customer.address ?? '',
    });
  }

  cancelEdit() {
    this.editingCustomer = null;
    this.customerForm.reset({
      name: '',
      contact_number: '',
      address: '',
    });
  }

  saveCustomer() {
    if (!this.editingCustomer || this.customerForm.invalid) {
      return;
    }

    this.isSaving = true;

    this.api.updateCustomer(this.editingCustomer.id, this.customerForm.getRawValue()).subscribe({
      next: () => {
        this.statusChanged.emit('Customer updated.');
        this.cancelEdit();
        this.customersChanged.emit();
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to update customer.'));
        console.error(err);
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }
}
