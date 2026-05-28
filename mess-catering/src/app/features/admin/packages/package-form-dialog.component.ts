import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { CateringPackage } from '../../../models/catering-package.model';
import { FoodLinePickerComponent } from '../../../shared/components/food-line-picker.component';
import { EquipmentLinePickerComponent } from '../../../shared/components/equipment-line-picker.component';
import { buildBreakdown, formatPhp } from '../../../shared/utils/pricing.utils';
import { FormDraftService } from '../../../services/form-draft.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface PackageDialogData {
  mode: 'create' | 'edit';
  pkg?: CateringPackage;
}

interface PackageDialogDraft {
  form: {
    name: string | null;
    description: string | null;
    goodForPersons: number | null;
    minGuests: number | null;
    maxGuests: number | null;
    isActive: boolean | null;
  };
  foodRows: Array<{ foodId: string; quantity: number; lineTotal: number }>;
  equipmentRows: Array<{ equipmentId: string; quantity: number; lineTotal: number }>;
  imagePreview?: string;
}

@Component({
  selector: 'app-package-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule, MatIconModule, MatCardModule,
    FoodLinePickerComponent, EquipmentLinePickerComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add Package' : 'Edit Package' }}</h2>
    <mat-dialog-content class="package-dialog-content">
      <form [formGroup]="form" class="dialog-form">
        <div class="image-upload" (click)="fileInput.click()">
          @if (imagePreview()) { <img [src]="imagePreview()" alt="" /> }
          @else { <mat-icon>cloud_upload</mat-icon><p>Package image</p> }
          <input #fileInput type="file" accept="image/*" hidden (change)="onFile($event)" />
        </div>
        <mat-form-field appearance="outline" class="full"><mat-label>Package Name</mat-label>
          <input matInput formControlName="name" required /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Good for (persons)</mat-label>
          <input matInput type="number" formControlName="goodForPersons" min="1" /></mat-form-field>

        <app-food-line-picker [rows]="foodRows" title="Foods (from menu)" />
        <app-equipment-line-picker [rows]="equipmentRows" title="Equipment (from inventory)" />

        <mat-card class="total-card">
          <p>Food: <strong>{{ formatPhp(foodTotal()) }}</strong></p>
          <p>Equipment: <strong>{{ formatPhp(equipTotal()) }}</strong></p>
          <p class="grand">Package total: <strong>{{ formatPhp(grandTotal()) }}</strong></p>
        </mat-card>
        <mat-slide-toggle formControlName="isActive">Available</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Cancel</button>
      <button mat-flat-button [disabled]="form.invalid || equipPicker.hasStockErrors()" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
})
export class PackageFormDialogComponent {
  readonly data = inject<PackageDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PackageFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly draftService = inject(FormDraftService);
  private readonly snack = inject(MatSnackBar);
  private readonly draftKey = `package-form:${this.data.mode}:${this.data.pkg?.id ?? 'new'}`;
  readonly formatPhp = formatPhp;
  readonly imagePreview = signal<string | undefined>(this.data.pkg?.imageUrl);

  @ViewChild(EquipmentLinePickerComponent) equipPicker!: EquipmentLinePickerComponent;
  @ViewChild(FoodLinePickerComponent) foodPicker!: FoodLinePickerComponent;

  readonly foodRows = this.fb.array<any>([]);
  readonly equipmentRows = this.fb.array<any>([]);

  readonly form = this.fb.group({
    name: [this.data.pkg?.name ?? '', Validators.required],
    description: [this.data.pkg?.description ?? ''],
    goodForPersons: [this.data.pkg?.goodForPersons ?? 50, Validators.min(1)],
    minGuests: [this.data.pkg?.minGuests ?? 20],
    maxGuests: [this.data.pkg?.maxGuests ?? 200],
    isActive: [this.data.pkg?.isActive ?? true],
  });

  constructor() {
    this.ref.disableClose = true;
    this.restoreDraft();
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.persistDraft());
    this.foodRows.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.persistDraft());
    this.equipmentRows.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.persistDraft());
  }

  foodTotal(): number {
    return this.foodRows.controls.reduce((s, c) => s + (c.get('lineTotal')?.value ?? 0), 0);
  }
  equipTotal(): number {
    return this.equipmentRows.controls.reduce((s, c) => s + (c.get('lineTotal')?.value ?? 0), 0);
  }
  grandTotal(): number {
    return buildBreakdown(this.foodTotal(), this.equipTotal()).total;
  }

  onFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
      this.persistDraft();
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    const v = this.form.getRawValue();
    const foodSelections = this.foodPicker?.getSelections() ?? [];
    const equipmentSelections = this.equipPicker?.getSelections() ?? [];
    const breakdown = buildBreakdown(
      sumSelections(foodSelections),
      sumSelections(equipmentSelections)
    );
    this.draftService.clearDraft(this.draftKey);
    this.ref.close({
      name: v.name!,
      description: v.description ?? '',
      pricePerHead: 0,
      basePrice: 0,
      goodForPersons: v.goodForPersons ?? 50,
      minGuests: v.minGuests ?? 20,
      maxGuests: v.maxGuests ?? 200,
      foodSelections,
      equipmentSelections,
      foodSubtotal: breakdown.foodSubtotal,
      equipmentSubtotal: breakdown.equipmentSubtotal,
      totalPrice: breakdown.total,
      imageUrl: this.imagePreview(),
      isActive: v.isActive ?? true,
    });
  }

  cancel(): void {
    if ((this.form.dirty || this.foodRows.length > 0 || this.equipmentRows.length > 0) && !confirm('Discard package form changes?')) {
      return;
    }
    this.draftService.clearDraft(this.draftKey);
    this.ref.close();
  }

  private persistDraft(): void {
    const value = this.form.getRawValue();
    const foodRows = this.foodRows.getRawValue() as Array<{ foodId: string; quantity: number; lineTotal: number }>;
    const equipmentRows = this.equipmentRows.getRawValue() as Array<{ equipmentId: string; quantity: number; lineTotal: number }>;
    const hasContent =
      !!value.name?.trim() ||
      !!value.description?.trim() ||
      foodRows.some((r) => !!r.foodId) ||
      equipmentRows.some((r) => !!r.equipmentId) ||
      !!this.imagePreview();
    if (!hasContent) return;
    this.draftService.saveDraft(this.draftKey, {
      form: value,
      foodRows,
      equipmentRows,
      imagePreview: this.imagePreview(),
    });
  }

  private restoreDraft(): void {
    const draft = this.draftService.getDraft<PackageDialogDraft>(this.draftKey);
    if (!draft) return;
    this.form.patchValue(draft.form);
    this.foodRows.clear();
    this.equipmentRows.clear();
    (draft.foodRows ?? []).forEach((row) => {
      this.foodRows.push(
        this.fb.group({
          foodId: [row.foodId],
          quantity: [row.quantity, [Validators.required, Validators.min(1)]],
          lineTotal: [row.lineTotal],
        }) as any
      );
    });
    (draft.equipmentRows ?? []).forEach((row) => {
      this.equipmentRows.push(
        this.fb.group({
          equipmentId: [row.equipmentId],
          quantity: [row.quantity, [Validators.required, Validators.min(1)]],
          lineTotal: [row.lineTotal],
        }) as any
      );
    });
    this.imagePreview.set(draft.imagePreview);
    this.snack.open('Your unfinished form has been restored.', 'OK', { duration: 2200 });
  }
}

function sumSelections<T extends { lineTotal: number }>(items: T[]): number {
  return items.reduce((s, i) => s + i.lineTotal, 0);
}
