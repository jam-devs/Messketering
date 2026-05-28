import { Component, inject, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentItem } from '../../models/equipment.model';
import { EquipmentSelection } from '../../models/equipment.model';
import { formatPhp, equipmentLineTotal } from '../utils/pricing.utils';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-equipment-line-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="line-picker">
      <h4>{{ title }}</h4>
      @for (row of rows.controls; track $index; let i = $index) {
        <div class="line-row" [formGroup]="getGroup(i)">
          <mat-form-field appearance="outline" class="equip-select">
            <mat-label>Select equipment</mat-label>
            <mat-select formControlName="equipmentId" (selectionChange)="onEquipChange(i)">
              <mat-option>
                <input class="filter-input" placeholder="Search..." (keyup)="filterEquip($event)" (click)="$event.stopPropagation()" />
              </mat-option>
              @for (e of filteredEquip(); track e.id) {
                <mat-option [value]="e.id" [disabled]="e.availableQuantity === 0">
                  {{ e.name }} — {{ formatPhp(e.pricePerUnit) }}/unit — Stock: {{ e.availableQuantity }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="qty-field">
            <mat-label>Qty</mat-label>
            <input matInput type="number" formControlName="quantity" min="1" [max]="maxQty(i)" (input)="onQtyChange(i)" />
          </mat-form-field>
          @if (stockError(i)) {
            <span class="stock-warn">Exceeds available stock</span>
          }
          <span class="line-total">{{ formatPhp(lineTotal(i)) }}</span>
          <button mat-icon-button type="button" (click)="removeRow(i)"><mat-icon>delete</mat-icon></button>
        </div>
      }
      <button mat-stroked-button type="button" (click)="addRow()"><mat-icon>add</mat-icon> Add Equipment</button>
      <p class="picker-subtotal">Equipment subtotal: <strong>{{ formatPhp(equipSubtotal()) }}</strong></p>
    </div>
  `,
})
export class EquipmentLinePickerComponent implements OnInit {
  @Input({ required: true }) rows!: FormArray;
  @Input() title = 'Equipment';

  private readonly fb = inject(FormBuilder);
  private readonly equipmentService = inject(EquipmentService);
  readonly formatPhp = formatPhp;

  readonly equipment = toSignal(this.equipmentService.getAvailable(), { initialValue: [] as EquipmentItem[] });
  private filterText = '';

  filteredEquip(): EquipmentItem[] {
    const q = this.filterText.toLowerCase();
    const list = this.equipment();
    return !q ? list : list.filter((e) => e.name.toLowerCase().includes(q));
  }

  filterEquip(e: Event): void {
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
        equipmentId: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        lineTotal: [0],
      })
    );
  }

  removeRow(i: number): void {
    this.rows.removeAt(i);
  }

  selectedEquip(i: number): EquipmentItem | undefined {
    const id = this.getGroup(i).get('equipmentId')?.value;
    return id ? this.equipmentService.getById(id) : undefined;
  }

  maxQty(i: number): number {
    return this.selectedEquip(i)?.availableQuantity ?? 9999;
  }

  stockError(i: number): boolean {
    const eq = this.selectedEquip(i);
    const qty = this.getGroup(i).get('quantity')?.value ?? 0;
    return !!eq && qty > eq.availableQuantity;
  }

  onEquipChange(i: number): void {
    this.onQtyChange(i);
  }

  onQtyChange(i: number): void {
    const g = this.getGroup(i);
    const eq = this.selectedEquip(i);
    const qty = g.get('quantity')?.value ?? 1;
    if (eq) {
      g.patchValue({ lineTotal: equipmentLineTotal(eq.pricePerUnit, qty) }, { emitEvent: false });
    }
  }

  lineTotal(i: number): number {
    return this.getGroup(i).get('lineTotal')?.value ?? 0;
  }

  equipSubtotal(): number {
    return this.rows.controls.reduce((s, c) => s + (c.get('lineTotal')?.value ?? 0), 0);
  }

  getSelections(): EquipmentSelection[] {
    const result: EquipmentSelection[] = [];
    for (let i = 0; i < this.rows.length; i++) {
      if (this.stockError(i)) continue;
      const g = this.getGroup(i);
      const equipmentId = g.get('equipmentId')?.value;
      const qty = g.get('quantity')?.value ?? 1;
      if (!equipmentId) continue;
      const sel = this.equipmentService.toSelection(equipmentId, qty);
      if (sel) result.push(sel);
    }
    return result;
  }

  hasStockErrors(): boolean {
    return this.rows.controls.some((_, i) => this.stockError(i));
  }
}
