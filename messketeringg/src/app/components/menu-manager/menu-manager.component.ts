import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CateringApiService } from '../../services/catering-api.service';
import { MenuItem } from '../../models/catering-manager.model';
import { getApiErrorMessage } from '../../shared/utils/api-error.utils';

@Component({
  selector: 'app-menu-manager',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel">
      <h2>Menu Items</h2>

      <div class="tabs" role="tablist" aria-label="Menu tools">
        <button
          type="button"
          role="tab"
          [class.active]="activeMenuTab === 'form'"
          (click)="activeMenuTab = 'form'"
        >
          {{ editingId ? 'Edit Menu Item' : 'Add Menu Item' }}
        </button>
        <button
          type="button"
          role="tab"
          [class.active]="activeMenuTab === 'manage'"
          (click)="activeMenuTab = 'manage'"
        >
          Manage Menu
        </button>
      </div>

      @if (activeMenuTab === 'form') {
        <form class="menu-form" [formGroup]="menuForm" (ngSubmit)="saveMenuItem()">
          <div class="field">
            <label for="name">Name</label>
            <input id="name" type="text" formControlName="name">
          </div>

          <div class="field">
            <label for="category">Category</label>
            <input id="category" type="text" formControlName="category">
          </div>

          <div class="field">
            <label for="price">Price</label>
            <input id="price" type="number" min="0" step="0.01" formControlName="price">
          </div>

          <div class="field field-wide">
            <label for="description">Description</label>
            <textarea id="description" rows="3" formControlName="description"></textarea>
          </div>

          <label class="check-field">
            <input type="checkbox" formControlName="is_available">
            Available
          </label>

          <div class="form-actions">
            <button type="submit" [disabled]="menuForm.invalid || isSaving">
              {{ editingId ? 'Update item' : 'Add item' }}
            </button>
            @if (editingId) {
              <button type="button" class="secondary" (click)="cancelEdit()">Cancel</button>
            }
          </div>
        </form>
      }

      @if (activeMenuTab === 'manage') {
        <div class="menu-grid" aria-label="Catering menu">
          @for (item of menuItems; track item.id) {
            <article class="menu-card">
              <div>
                <p class="category">{{ item.category }}</p>
                <h3>{{ item.name }}</h3>
                <p class="description">{{ item.description }}</p>
              </div>
              <div class="card-footer">
                <div>
                  <strong class="price">PHP {{ item.price }}</strong>
                  <span class="availability" [class.unavailable]="!item.is_available">
                    {{ item.is_available ? 'Available' : 'Unavailable' }}
                  </span>
                </div>
                <div class="card-actions">
                  <button type="button" class="secondary" (click)="editMenuItem(item)">Edit</button>
                  <button type="button" class="danger" (click)="deleteMenuItem(item)">Delete</button>
                </div>
              </div>
            </article>
          } @empty {
            <p class="description">No menu items yet.</p>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .panel {
      margin-bottom: 28px;
      padding-top: 8px;
    }

    h2,
    h3 {
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

    .menu-form {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
    }

    .field,
    .check-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-weight: 700;
    }

    .field-wide {
      grid-column: 1 / -1;
    }

    .check-field {
      flex-direction: row;
      align-items: center;
    }

    input,
    textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #cfc6b8;
      border-radius: 6px;
      padding: 10px 12px;
      color: #211f1c;
      font: inherit;
      background: #ffffff;
    }

    input[type="checkbox"] {
      width: auto;
    }

    .form-actions,
    .card-actions {
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

    .secondary {
      border: 1px solid #cfc6b8;
      color: #211f1c;
      background: #ffffff;
    }

    .danger {
      background: #a83c2d;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .menu-card {
      display: flex;
      min-height: 220px;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    .category {
      margin: 0 0 8px;
      color: #9a4b1f;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .description {
      margin: 10px 0 0;
      color: #645d54;
      line-height: 1.5;
    }

    .price {
      color: #19624a;
      font-size: 1.25rem;
    }

    .card-footer {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
    }

    .availability {
      display: block;
      margin-top: 6px;
      color: #19624a;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .availability.unavailable {
      color: #a83c2d;
    }

    @media (max-width: 760px) {
      .menu-form {
        grid-template-columns: 1fr;
      }

      .card-footer {
        align-items: stretch;
        flex-direction: column;
      }

      .card-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
    }
  `],
})
export class MenuManagerComponent {
  private fb = inject(FormBuilder);
  private api = inject(CateringApiService);

  @Input({ required: true }) menuItems: MenuItem[] = [];
  @Output() menuChanged = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<string>();

  editingId: number | null = null;
  isSaving = false;
  activeMenuTab: 'form' | 'manage' = 'manage';

  menuForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['Meal', Validators.required],
    is_available: [true],
  });

  saveMenuItem() {
    if (this.menuForm.invalid) {
      return;
    }

    this.isSaving = true;
    const payload = this.menuForm.getRawValue();
    const request = this.editingId
      ? this.api.updateMenuItem(this.editingId, payload)
      : this.api.createMenuItem(payload);

    request.subscribe({
      next: () => {
        this.statusChanged.emit(this.editingId ? 'Menu item updated.' : 'Menu item added.');
        this.resetMenuForm();
        this.activeMenuTab = 'manage';
        this.menuChanged.emit();
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to save menu item.'));
        console.error(err);
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }

  editMenuItem(item: MenuItem) {
    this.editingId = item.id;
    this.activeMenuTab = 'form';
    this.menuForm.setValue({
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price),
      category: item.category,
      is_available: item.is_available,
    });
  }

  cancelEdit() {
    this.resetMenuForm();
    this.activeMenuTab = 'manage';
  }

  deleteMenuItem(item: MenuItem) {
    const shouldDelete = confirm(`Delete "${item.name}"?`);

    if (!shouldDelete) {
      return;
    }

    this.api.deleteMenuItem(item.id).subscribe({
      next: () => {
        this.statusChanged.emit('Menu item deleted.');
        this.menuChanged.emit();
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to delete menu item.'));
        console.error(err);
      },
    });
  }

  private resetMenuForm() {
    this.editingId = null;
    this.menuForm.reset({
      name: '',
      description: '',
      price: 0,
      category: 'Meal',
      is_available: true,
    });
  }
}
