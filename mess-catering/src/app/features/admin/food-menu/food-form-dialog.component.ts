import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import {
  FoodMenuItem,
  FoodCategory,
  FOOD_CATEGORY_LABELS,
  FoodAvailability,
} from '../../../models/food-menu.model';
import { FormDraftService } from '../../../services/form-draft.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface FoodDialogData {
  mode: 'create' | 'edit';
  item?: FoodMenuItem;
}

interface FoodDialogDraft {
  form: {
    name: string | null;
    description: string | null;
    category: FoodCategory | null;
    servingSize: string | null;
    price: number | null;
    servesPersons: number | null;
    availability: FoodAvailability | null;
  };
  imagePreview?: string;
}

@Component({
  selector: 'app-food-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add Food Item' : 'Edit Food Item' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="image-upload" (click)="fileInput.click()">
          @if (imagePreview()) { <img [src]="imagePreview()" alt="Food" /> }
          @else { <mat-icon>restaurant</mat-icon><p>Upload food image</p> }
          <input #fileInput type="file" accept="image/*" hidden (change)="onFile($event)" />
        </div>
        <mat-form-field appearance="outline" class="full"><mat-label>Food Name</mat-label>
          <input matInput formControlName="name" required /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (c of categories; track c) {
              <mat-option [value]="c">{{ categoryLabels[c] }}</mat-option>
            }
          </mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Serving Size</mat-label>
          <input matInput formControlName="servingSize" placeholder="Full tray" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Price (₱)</mat-label>
          <input matInput type="number" formControlName="price" min="0" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Good for (persons)</mat-label>
          <input matInput type="number" formControlName="servesPersons" min="1" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Availability</mat-label>
          <mat-select formControlName="availability">
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
export class FoodFormDialogComponent {
  readonly data = inject<FoodDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<FoodFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly draftService = inject(FormDraftService);
  private readonly snack = inject(MatSnackBar);
  private readonly draftKey = `food-form:${this.data.mode}:${this.data.item?.id ?? 'new'}`;
  readonly imagePreview = signal<string | undefined>(this.data.item?.imageUrl);
  readonly categories = Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[];
  readonly categoryLabels = FOOD_CATEGORY_LABELS;

  readonly form = this.fb.group({
    name: [this.data.item?.name ?? '', Validators.required],
    description: [this.data.item?.description ?? ''],
    category: [this.data.item?.category ?? 'main_dish' as FoodCategory, Validators.required],
    servingSize: [this.data.item?.servingSize ?? 'Full tray', Validators.required],
    price: [this.data.item?.price ?? 0, [Validators.required, Validators.min(0)]],
    servesPersons: [this.data.item?.servesPersons ?? 10, [Validators.required, Validators.min(1)]],
    availability: [this.data.item?.availability ?? 'available' as FoodAvailability],
  });

  constructor() {
    this.ref.disableClose = true;
    this.restoreDraft();
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.persistDraft());
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
    this.draftService.clearDraft(this.draftKey);
    this.ref.close({
      ...v,
      imageUrl: this.imagePreview(),
    });
  }

  cancel(): void {
    if (this.form.dirty && !confirm('Discard food form changes?')) return;
    this.draftService.clearDraft(this.draftKey);
    this.ref.close();
  }

  private persistDraft(): void {
    const value = this.form.getRawValue();
    const hasContent = !!value.name?.trim() || !!value.description?.trim() || !!this.imagePreview();
    if (!hasContent) return;
    this.draftService.saveDraft(this.draftKey, { form: value, imagePreview: this.imagePreview() });
  }

  private restoreDraft(): void {
    const draft = this.draftService.getDraft<FoodDialogDraft>(this.draftKey);
    if (!draft) return;
    this.form.patchValue(draft.form);
    this.imagePreview.set(draft.imagePreview);
    this.snack.open('Your unfinished form has been restored.', 'OK', { duration: 2200 });
  }
}
