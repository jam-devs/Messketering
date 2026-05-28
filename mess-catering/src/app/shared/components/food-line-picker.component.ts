import { Component, inject, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FoodMenuService } from '../../services/food-menu.service';
import { FoodMenuItem } from '../../models/food-menu.model';
import { FoodSelection } from '../../models/food-menu.model';
import { formatPhp, foodLineTotal } from '../utils/pricing.utils';
import { toSignal } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-food-line-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatAutocompleteModule,
  ],
  template: `
    <div class="line-picker">
      <h4>{{ title }}</h4>
      @for (row of rows.controls; track $index; let i = $index) {
        <div class="line-row" [formGroup]="getGroup(i)">
          <mat-form-field appearance="outline" class="food-select">
            <mat-label>Select food</mat-label>
            <mat-select formControlName="foodId" (selectionChange)="onFoodChange(i)">
              <mat-option>
                <input class="filter-input" placeholder="Search..." (keyup)="filterFood($event)" (click)="$event.stopPropagation()" />
              </mat-option>
              @for (f of filteredFoods(); track f.id) {
                <mat-option [value]="f.id">
                  {{ f.name }} — {{ formatPhp(f.price) }} — Good for {{ f.servesPersons }} persons
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (selectedFood(i); as food) {
            <span class="line-meta">{{ food.servingSize }} · Serves {{ food.servesPersons }}</span>
          }
          <mat-form-field appearance="outline" class="qty-field">
            <mat-label>Qty</mat-label>
            <input matInput type="number" formControlName="quantity" min="1" (input)="onQtyChange(i)" />
          </mat-form-field>
          <span class="line-total">{{ formatPhp(lineTotal(i)) }}</span>
          <button mat-icon-button type="button" (click)="removeRow(i)"><mat-icon>delete</mat-icon></button>
        </div>
      }
      <button mat-stroked-button type="button" (click)="addRow()"><mat-icon>add</mat-icon> Add Food</button>
      <p class="picker-subtotal">Food subtotal: <strong>{{ formatPhp(foodSubtotal()) }}</strong></p>
    </div>
  `,
})
export class FoodLinePickerComponent implements OnInit {
  @Input({ required: true }) rows!: FormArray;
  @Input() title = 'Food Items';

  private readonly fb = inject(FormBuilder);
  private readonly foodMenu = inject(FoodMenuService);
  readonly formatPhp = formatPhp;

  readonly foods = toSignal(this.foodMenu.getAvailable(), { initialValue: [] as FoodMenuItem[] });
  private filterText = '';

  filteredFoods(): FoodMenuItem[] {
    const q = this.filterText.toLowerCase();
    const list = this.foods();
    return !q ? list : list.filter((f) => f.name.toLowerCase().includes(q));
  }

  filterFood(e: Event): void {
    this.filterText = (e.target as HTMLInputElement).value;
  }

  ngOnInit(): void {
    if (this.rows.length === 0) this.addRow();
  }

  getGroup(i: number): FormGroup {
    return this.rows.at(i) as FormGroup;
  }

  addRow(): void {
    this.rows.push(
      this.fb.group({
        foodId: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        lineTotal: [0],
      })
    );
  }

  removeRow(i: number): void {
    this.rows.removeAt(i);
  }

  selectedFood(i: number): FoodMenuItem | undefined {
    const id = this.getGroup(i).get('foodId')?.value;
    return id ? this.foodMenu.getById(id) : undefined;
  }

  onFoodChange(i: number): void {
    this.onQtyChange(i);
  }

  onQtyChange(i: number): void {
    const g = this.getGroup(i);
    const food = this.selectedFood(i);
    const qty = g.get('quantity')?.value ?? 1;
    if (food) {
      g.patchValue({ lineTotal: foodLineTotal(food.price, qty) }, { emitEvent: false });
    }
  }

  lineTotal(i: number): number {
    return this.getGroup(i).get('lineTotal')?.value ?? 0;
  }

  foodSubtotal(): number {
    return this.rows.controls.reduce((s, c) => s + (c.get('lineTotal')?.value ?? 0), 0);
  }

  /** Build selections for save */
  getSelections(): FoodSelection[] {
    const result: FoodSelection[] = [];
    for (let i = 0; i < this.rows.length; i++) {
      const g = this.getGroup(i);
      const foodId = g.get('foodId')?.value;
      const qty = g.get('quantity')?.value ?? 1;
      if (!foodId) continue;
      const sel = this.foodMenu.toSelection(foodId, qty);
      if (sel) result.push(sel);
    }
    return result;
  }
}
