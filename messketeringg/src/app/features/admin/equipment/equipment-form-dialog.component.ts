import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { EquipmentItem, EquipmentCategory, EquipmentStatus } from '../../../models/equipment.model';
import { FormDraftService } from '../../../services/form-draft.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface EquipmentDialogData {
  mode: 'create' | 'edit';
  item?: EquipmentItem;
}

interface EquipmentDialogDraft {
  form: {
    name: string | null;
    description: string | null;
    category: EquipmentCategory | null;
    totalQuantity: number | null;
    pricePerUnit: number | null;
    status: EquipmentStatus | null;
    condition: 'good' | 'fair' | 'maintenance' | null;
  };
}

@Component({
  selector: 'app-equipment-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add Equipment' : 'Edit Equipment' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full"><mat-label>Name</mat-label>
          <input matInput formControlName="name" required /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Category</mat-label>
          <mat-select formControlName="category">
            <mat-option value="tables">Tables</mat-option>
            <mat-option value="chairs">Chairs</mat-option>
            <mat-option value="umbrellas">Umbrellas</mat-option>
            <mat-option value="utensils">Utensils</mat-option>
            <mat-option value="linens">Linens</mat-option>
            <mat-option value="other">Other</mat-option>
          </mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Quantity</mat-label>
          <input matInput type="number" formControlName="totalQuantity" min="0" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Price per unit (₱)</mat-label>
          <input matInput type="number" formControlName="pricePerUnit" min="0" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="available">Available</mat-option>
            <mat-option value="unavailable">Unavailable</mat-option>
          </mat-select></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Cancel</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
})
export class EquipmentFormDialogComponent {
  readonly data = inject<EquipmentDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EquipmentFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly draftService = inject(FormDraftService);
  private readonly snack = inject(MatSnackBar);
  private readonly draftKey = `equipment-form:${this.data.mode}:${this.data.item?.id ?? 'new'}`;

  readonly form = this.fb.group({
    name: [this.data.item?.name ?? '', Validators.required],
    description: [this.data.item?.description ?? ''],
    category: [this.data.item?.category ?? 'other' as EquipmentCategory],
    totalQuantity: [this.data.item?.totalQuantity ?? 1, [Validators.min(0)]],
    pricePerUnit: [this.data.item?.pricePerUnit ?? 0, [Validators.min(0)]],
    status: [this.data.item?.status ?? 'available' as EquipmentStatus],
    condition: [this.data.item?.condition ?? 'good'],
  });

  constructor() {
    this.ref.disableClose = true;
    this.restoreDraft();
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.persistDraft());
  }

  submit(): void {
    this.draftService.clearDraft(this.draftKey);
    this.ref.close(this.form.getRawValue());
  }

  cancel(): void {
    if (this.form.dirty && !confirm('Discard equipment form changes?')) return;
    this.draftService.clearDraft(this.draftKey);
    this.ref.close();
  }

  private persistDraft(): void {
    const value = this.form.getRawValue();
    const hasContent = !!value.name?.trim() || !!value.description?.trim();
    if (!hasContent) return;
    this.draftService.saveDraft(this.draftKey, { form: value });
  }

  private restoreDraft(): void {
    const draft = this.draftService.getDraft<EquipmentDialogDraft>(this.draftKey);
    if (!draft) return;
    this.form.patchValue(draft.form);
    this.snack.open('Your unfinished form has been restored.', 'OK', { duration: 2200 });
  }
}
