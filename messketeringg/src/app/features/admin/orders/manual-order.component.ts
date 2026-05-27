import { AfterViewInit, Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { OrderService } from '../../../services/order.service';
import { PackageService } from '../../../services/package.service';
import { AuthService } from '../../../services/auth.service';
import { MANUAL_ORDER_STATUS_LABELS, ManualOrderStatus } from '../../../models/custom-order.model';
import { FoodLinePickerComponent } from '../../../shared/components/food-line-picker.component';
import { EquipmentLinePickerComponent } from '../../../shared/components/equipment-line-picker.component';
import { buildBreakdown, formatPhp } from '../../../shared/utils/pricing.utils';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CustomLineItem } from '../../../models/custom-order.model';
import { FormDraftService } from '../../../services/form-draft.service';
import { debounceTime, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PendingChangesAware } from '../../../core/guards/pending-changes.guard';
import { FoodMenuService } from '../../../services/food-menu.service';
import { EquipmentService } from '../../../services/equipment.service';
import { FoodSelection } from '../../../models/food-menu.model';
import { EquipmentSelection } from '../../../models/equipment.model';

interface ManualOrderDraft {
  details: ManualOrderDetailsValue;
  review: ManualOrderReviewValue;
  foodRows: Array<{ foodId: string; quantity: number; lineTotal: number }>;
  equipmentRows: Array<{ equipmentId: string; quantity: number; lineTotal: number }>;
  stepIndex: number;
}

interface ManualOrderDialogData {
  mode?: 'create';
}

interface ManualOrderDetailsValue {
  clientName: string;
  eventName: string;
  packageId: string;
  eventDate: string | Date;
  eventTime: string;
  venue: string;
  guestCount: number;
}

interface ManualOrderReviewValue {
  notes: string;
  orderStatus: ManualOrderStatus;
  deliveryFee: number;
}

@Component({
  selector: 'app-manual-order',
  standalone: true,
  imports: [
    CurrencyPipe, ReactiveFormsModule, RouterLink,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCardModule, MatDatepickerModule, MatNativeDateModule,
    PageHeaderComponent, FoodLinePickerComponent, EquipmentLinePickerComponent,
  ],
  template: `
    @if (isDialogMode) {
      <div class="page-header">
        <div>
          <h1>Manual Custom Order</h1>
          <p>Select foods and equipment from centralized inventory (Admin only)</p>
        </div>
        <button mat-stroked-button type="button" (click)="cancelDialog()">Cancel</button>
      </div>
    } @else {
      <app-page-header title="Manual Custom Order" subtitle="Select foods and equipment from centralized inventory (Admin only)" />
    }

    @if (!isAdmin()) {
      <mat-card><mat-card-content><p>Only administrators can create manual custom orders.</p>
        <a mat-button routerLink="/admin/orders">Back</a></mat-card-content></mat-card>
    } @else {
      <mat-card class="manual-order-card">
        <mat-stepper linear #stepper (selectionChange)="onStepChange($event.selectedIndex)">
          <mat-step [stepControl]="detailsForm" label="Event Details">
            <form [formGroup]="detailsForm" class="step-form">
              <mat-form-field appearance="outline" class="full"><mat-label>Client Name</mat-label>
                <input matInput formControlName="clientName" required />
                @if (detailsForm.controls.clientName.touched && detailsForm.controls.clientName.hasError('required')) {
                  <mat-error>Client name is required.</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full"><mat-label>Event Name</mat-label>
                <input matInput formControlName="eventName" required />
                @if (detailsForm.controls.eventName.touched && detailsForm.controls.eventName.hasError('required')) {
                  <mat-error>Event name is required.</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full"><mat-label>Base Package (optional)</mat-label>
                <mat-select formControlName="packageId">
                  <mat-option value="">None</mat-option>
                  @for (p of packages(); track p.id) {
                    <mat-option [value]="p.id">{{ p.name }} — {{ p.totalPrice | currency:'PHP':'symbol-narrow':'1.0-0' }}</mat-option>
                  }
                </mat-select></mat-form-field>
              <div class="row">
                <mat-form-field appearance="outline"><mat-label>Event Date</mat-label>
                  <input
                    matInput
                    readonly
                    [matDatepicker]="dp"
                    [min]="today"
                    formControlName="eventDate"
                    (click)="dp.open()"
                    (focus)="dp.open()"
                  />
                  <mat-datepicker-toggle matIconSuffix [for]="dp" /><mat-datepicker #dp />
                  @if (detailsForm.controls.eventDate.touched && detailsForm.controls.eventDate.hasError('required')) {
                    <mat-error>Event date is required.</mat-error>
                  }
                  @if (detailsForm.controls.eventDate.touched && detailsForm.controls.eventDate.hasError('pastDate')) {
                    <mat-error>Event date cannot be in the past.</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Time</mat-label>
                  <input matInput formControlName="eventTime" />
                  @if (detailsForm.controls.eventTime.touched && detailsForm.controls.eventTime.hasError('required')) {
                    <mat-error>Event time is required.</mat-error>
                  }
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full"><mat-label>Venue</mat-label>
                <input matInput formControlName="venue" required />
                @if (detailsForm.controls.venue.touched && detailsForm.controls.venue.hasError('required')) {
                  <mat-error>Venue is required.</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Guest Count</mat-label>
                <input matInput type="number" formControlName="guestCount" min="1" />
                @if (detailsForm.controls.guestCount.touched && detailsForm.controls.guestCount.hasError('required')) {
                  <mat-error>Guest count is required.</mat-error>
                }
                @if (detailsForm.controls.guestCount.touched && detailsForm.controls.guestCount.hasError('min')) {
                  <mat-error>Guest count must be at least 1.</mat-error>
                }
              </mat-form-field>
              <button mat-flat-button matStepperNext [disabled]="detailsForm.invalid">Next</button>
            </form>
          </mat-step>

          <mat-step label="Food & Equipment">
            <div class="step-form">
              <app-food-line-picker [rows]="foodRows" />
              <app-equipment-line-picker [rows]="equipmentRows" />
              @if (hasDuplicateFoods()) { <p class="stock-warn">Duplicate food items found. Please keep each food only once.</p> }
              @if (hasDuplicateEquipment()) { <p class="stock-warn">Duplicate equipment items found. Please keep each equipment only once.</p> }
              @if (hasEquipmentStockErrors()) { <p class="stock-warn">One or more equipment quantities exceed available stock.</p> }
              <button mat-button matStepperPrevious>Back</button>
              <button mat-flat-button matStepperNext [disabled]="hasEquipmentStockErrors() || hasDuplicateFoods() || hasDuplicateEquipment()">Next</button>
            </div>
          </mat-step>

          <mat-step label="Review">
            <form [formGroup]="reviewForm" class="step-form">
              <mat-form-field appearance="outline" class="full"><mat-label>Notes</mat-label>
                <textarea matInput formControlName="notes" rows="2"></textarea></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Status</mat-label>
                <mat-select formControlName="orderStatus">
                  @for (s of statusKeys; track s) {
                    <mat-option [value]="s">{{ statusLabels[s] }}</mat-option>
                  }
                </mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Delivery Fee (₱)</mat-label>
                <input matInput type="number" formControlName="deliveryFee" min="0" />
                @if (reviewForm.controls.deliveryFee.touched && reviewForm.controls.deliveryFee.hasError('min')) {
                  <mat-error>Delivery fee cannot be negative.</mat-error>
                }
              </mat-form-field>
              <mat-card class="total-card">
                @if (pricingBreakdown(); as b) {
                  <p>Food subtotal: <strong>{{ formatPhp(b.foodSubtotal) }}</strong></p>
                  <p>Equipment subtotal: <strong>{{ formatPhp(b.equipmentSubtotal) }}</strong></p>
                  @if (b.packageBase) { <p>Package base: <strong>{{ formatPhp(b.packageBase) }}</strong></p> }
                  @if (b.deliveryFee) { <p>Delivery fee: <strong>{{ formatPhp(b.deliveryFee) }}</strong></p> }
                  <p class="grand">Total: <strong>{{ formatPhp(b.total) }}</strong></p>
                }
              </mat-card>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-stroked-button type="button" (click)="resetForm(true)">Reset</button>
                <button mat-stroked-button type="button" (click)="saveAsDraft()">Save Draft</button>
                <button mat-flat-button type="button" (click)="submitOrder()" [disabled]="cannotSubmit()">Submit</button>
              </div>
            </form>
          </mat-step>
        </mat-stepper>
      </mat-card>
      @if (!isDialogMode) {
        <a mat-button routerLink="/admin/orders"><mat-icon>arrow_back</mat-icon> Back</a>
      }
    }
  `,
})
export class ManualOrderComponent implements PendingChangesAware, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly packageService = inject(PackageService);
  private readonly foodMenu = inject(FoodMenuService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<ManualOrderComponent>, { optional: true });
  private readonly dialogData = inject<ManualOrderDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  private readonly draftService = inject(FormDraftService);
  private readonly snack = inject(MatSnackBar);
  private readonly draftKey = 'manual-order';
  private restoring = false;
  private pendingStepIndex: number | null = null;
  private lastAutosaveAt = 0;

  @ViewChild(MatStepper) stepper?: MatStepper;

  readonly packages = toSignal(this.packageService.getActive(), { initialValue: [] });
  readonly statusLabels = MANUAL_ORDER_STATUS_LABELS;
  readonly statusKeys = Object.keys(MANUAL_ORDER_STATUS_LABELS) as ManualOrderStatus[];
  readonly formatPhp = formatPhp;
  readonly isDialogMode = !!this.dialogRef && this.dialogData?.mode === 'create';
  readonly today = startOfToday();

  readonly foodRows = this.fb.array<FormGroup>([]);
  readonly equipmentRows = this.fb.array<FormGroup>([]);

  readonly detailsForm = this.fb.group({
    clientName: this.fb.control<string>('', { validators: [Validators.required], nonNullable: true }),
    eventName: this.fb.control<string>('', { validators: [Validators.required], nonNullable: true }),
    packageId: this.fb.control<string>('', { nonNullable: true }),
    eventDate: this.fb.control<Date | null>(new Date(), { validators: [Validators.required, futureOrTodayDateValidator] }),
    eventTime: this.fb.control<string>('12:00', { validators: [Validators.required], nonNullable: true }),
    venue: this.fb.control<string>('', { validators: [Validators.required], nonNullable: true }),
    guestCount: this.fb.control<number>(50, { validators: [Validators.required, Validators.min(1)], nonNullable: true }),
  });

  readonly reviewForm = this.fb.group({
    notes: this.fb.control<string>('', { nonNullable: true }),
    orderStatus: this.fb.control<ManualOrderStatus>('pending', { validators: [Validators.required], nonNullable: true }),
    deliveryFee: this.fb.control<number>(0, { validators: [Validators.min(0)], nonNullable: true }),
  });

  private readonly detailsValue$ = this.detailsForm.valueChanges.pipe(startWith(this.detailsForm.getRawValue()));
  private readonly reviewValue$ = this.reviewForm.valueChanges.pipe(startWith(this.reviewForm.getRawValue()));
  private readonly foodRowsValue$ = this.foodRows.valueChanges.pipe(startWith(this.foodRows.getRawValue()));
  private readonly equipmentRowsValue$ = this.equipmentRows.valueChanges.pipe(startWith(this.equipmentRows.getRawValue()));
  readonly foodSelections = toSignal(
    this.foodRowsValue$.pipe(map((rows) => this.mapFoodSelections(rows ?? []))),
    { initialValue: [] as FoodSelection[] }
  );
  readonly equipmentSelections = toSignal(
    this.equipmentRowsValue$.pipe(map((rows) => this.mapEquipmentSelections(rows ?? []))),
    { initialValue: [] as EquipmentSelection[] }
  );
  readonly pricingBreakdown = toSignal(
    toObservable(computed(() => {
      const details = this.detailsForm.getRawValue();
      const review = this.reviewForm.getRawValue();
      const pkg = details.packageId ? this.packageService.getById(details.packageId) : undefined;
      const foodSubtotal = this.foodSelections().reduce((s, i) => s + i.lineTotal, 0);
      const equipmentSubtotal = this.equipmentSelections().reduce((s, i) => s + i.lineTotal, 0);
      const packageBase = pkg?.totalPrice ?? 0;
      const deliveryFee = Math.max(0, Number(review.deliveryFee || 0));
      const base = buildBreakdown(foodSubtotal, equipmentSubtotal, packageBase);
      return { ...base, deliveryFee, total: base.total + deliveryFee };
    })),
    { initialValue: { foodSubtotal: 0, equipmentSubtotal: 0, packageBase: 0, deliveryFee: 0, total: 0 } }
  );

  isAdmin = () => this.auth.hasRole('admin');

  constructor() {
    this.restoreDraft();
    if (this.foodRows.length === 0) this.foodRows.push(this.createFoodRow());
    if (this.equipmentRows.length === 0) this.equipmentRows.push(this.createEquipmentRow());
    this.bindAutosave();
    effect(() => {
      // keep line totals in sync even when draft is restored or item pricing updates
      this.foodSelections();
      this.syncFoodLineTotals();
      this.equipmentSelections();
      this.syncEquipmentLineTotals();
    });
  }

  ngAfterViewInit(): void {
    if (this.pendingStepIndex !== null && this.stepper) {
      this.stepper.selectedIndex = this.pendingStepIndex;
      this.pendingStepIndex = null;
    }
  }

  onStepChange(index: number): void {
    if (this.restoring) return;
    this.persistDraft(index);
  }

  hasUnsavedChanges(): boolean {
    return this.detailsForm.dirty || this.reviewForm.dirty || !!this.draftService.getDraft<ManualOrderDraft>(this.draftKey);
  }

  onNavigationAttempt(): void {
    this.persistDraft(this.stepper?.selectedIndex ?? 0);
    this.snack.open('Unsaved changes detected. Draft auto-saved.', 'OK', { duration: 1800 });
  }

  cancelDialog(): void {
    if (!this.isDialogMode) return;
    const hasDraft = this.hasUnsavedChanges();
    if (hasDraft && !confirm('Discard Manual Custom Order changes?')) return;
    this.draftService.clearDraft(this.draftKey);
    this.dialogRef?.close(false);
  }

  hasDuplicateFoods(): boolean {
    return hasDuplicateIds(this.foodRows.getRawValue().map((r) => r['foodId']));
  }

  hasDuplicateEquipment(): boolean {
    return hasDuplicateIds(this.equipmentRows.getRawValue().map((r) => r['equipmentId']));
  }

  hasEquipmentStockErrors(): boolean {
    return this.equipmentRows.getRawValue().some((row) => {
      if (!row['equipmentId']) return false;
      const eq = this.equipmentService.getById(row['equipmentId']);
      if (!eq) return true;
      return Number(row['quantity'] || 0) > eq.availableQuantity;
    });
  }

  cannotSubmit(): boolean {
    return this.detailsForm.invalid || this.reviewForm.invalid || this.hasDuplicateFoods() || this.hasDuplicateEquipment() || this.hasEquipmentStockErrors();
  }

  resetForm(showNotification = false): void {
    this.detailsForm.reset({
      clientName: '',
      eventName: '',
      packageId: '',
      eventDate: new Date(),
      eventTime: '12:00',
      venue: '',
      guestCount: 50,
    });
    this.reviewForm.reset({
      notes: '',
      orderStatus: 'pending',
    });
    this.foodRows.clear({ emitEvent: false });
    this.equipmentRows.clear({ emitEvent: false });
    this.foodRows.push(this.createFoodRow());
    this.equipmentRows.push(this.createEquipmentRow());
    this.draftService.clearDraft(this.draftKey);
    this.detailsForm.markAsPristine();
    this.reviewForm.markAsPristine();
    if (showNotification) {
      this.snack.open('Form reset and draft cleared.', 'OK', { duration: 2000 });
    }
  }

  saveAsDraft(): void {
    this.persistDraft(this.stepper?.selectedIndex ?? 0, true);
    this.snack.open('Draft saved successfully.', 'OK', { duration: 2000 });
  }

  submitOrder(): void {
    if (this.cannotSubmit()) {
      this.detailsForm.markAllAsTouched();
      this.reviewForm.markAllAsTouched();
      this.snack.open('Please fix validation errors before submitting.', 'OK', { duration: 2200 });
      return;
    }
    const d = this.detailsForm.getRawValue();
    const pkg = d.packageId ? this.packageService.getById(d.packageId) : undefined;
    const foodSel = this.foodSelections();
    const equipSel = this.equipmentSelections();
    const b = this.pricingBreakdown();

    const customFoodItems: CustomLineItem[] = foodSel.map((f) => ({
      id: f.foodId,
      name: f.foodName,
      quantity: f.quantity,
      unitPrice: f.unitPrice,
    }));
    const customEquipmentItems: CustomLineItem[] = equipSel.map((e) => ({
      id: e.equipmentId,
      name: e.equipmentName,
      quantity: e.quantity,
      unitPrice: e.unitPrice,
    }));

    this.orderService.createCustomOrder({
      clientId: 'custom',
      clientName: d.clientName,
      eventName: d.eventName,
      eventDate: d.eventDate ?? new Date(),
      eventTime: d.eventTime,
      venue: d.venue,
      guestCount: d.guestCount,
      packageId: d.packageId || undefined,
      packageName: pkg?.name ?? 'Custom Order',
      foodItems: customFoodItems,
      equipmentItems: customEquipmentItems,
      subtotal: b.foodSubtotal + b.equipmentSubtotal + b.packageBase,
      totalAmount: b.total,
      notes: this.reviewForm.value.notes || undefined,
      orderStatus: this.reviewForm.value.orderStatus ?? 'pending',
      isDraft: false,
    });
    this.draftService.clearDraft(this.draftKey);
    this.snack.open('Order submitted successfully.', 'OK', { duration: 2200 });
    if (this.isDialogMode) {
      this.dialogRef?.close(true);
      return;
    }
    this.router.navigate(['/admin/orders']);
  }

  private bindAutosave(): void {
    this.detailsValue$
      .pipe(debounceTime(350), takeUntilDestroyed())
      .subscribe(() => this.persistDraft(this.stepper?.selectedIndex ?? 0));
    this.reviewValue$
      .pipe(debounceTime(350), takeUntilDestroyed())
      .subscribe(() => this.persistDraft(this.stepper?.selectedIndex ?? 0));
    this.foodRowsValue$
      .pipe(debounceTime(350), takeUntilDestroyed())
      .subscribe(() => this.persistDraft(this.stepper?.selectedIndex ?? 0));
    this.equipmentRowsValue$
      .pipe(debounceTime(350), takeUntilDestroyed())
      .subscribe(() => this.persistDraft(this.stepper?.selectedIndex ?? 0));
  }

  private persistDraft(stepIndex: number, notify = false): void {
    if (this.restoring) return;
    const details = this.detailsForm.getRawValue();
    const review = this.reviewForm.getRawValue();
    const foodRows = this.foodRows.getRawValue().map((r) => ({
      foodId: r['foodId'] || '',
      quantity: Number(r['quantity'] || 1),
      lineTotal: Number(r['lineTotal'] || 0),
    }));
    const equipmentRows = this.equipmentRows.getRawValue().map((r) => ({
      equipmentId: r['equipmentId'] || '',
      quantity: Number(r['quantity'] || 1),
      lineTotal: Number(r['lineTotal'] || 0),
    }));
    const hasContent =
      !!details.clientName.trim() ||
      !!details.eventName.trim() ||
      !!details.venue.trim() ||
      !!review.notes?.trim() ||
      !!details.packageId ||
      foodRows.some((r) => !!r.foodId) ||
      equipmentRows.some((r) => !!r.equipmentId);
    if (!hasContent) return;
    this.draftService.saveDraft<ManualOrderDraft>(this.draftKey, {
      details: {
        clientName: details.clientName ?? '',
        eventName: details.eventName ?? '',
        packageId: details.packageId ?? '',
        eventDate: details.eventDate ?? new Date(),
        eventTime: details.eventTime ?? '12:00',
        venue: details.venue ?? '',
        guestCount: Number(details.guestCount ?? 50),
      },
      review: {
        notes: review.notes ?? '',
        orderStatus: review.orderStatus ?? 'pending',
        deliveryFee: Number(review.deliveryFee ?? 0),
      },
      foodRows,
      equipmentRows,
      stepIndex,
    });
    const now = Date.now();
    if (notify || now - this.lastAutosaveAt > 12000) {
      this.lastAutosaveAt = now;
      this.snack.open('Draft auto-saved.', 'OK', { duration: 1400 });
    }
  }

  private restoreDraft(): void {
    const draft = this.draftService.getDraft<ManualOrderDraft>(this.draftKey);
    if (!draft) return;
    this.restoring = true;
    this.detailsForm.patchValue({
      ...draft.details,
      eventDate: draft.details.eventDate ? new Date(draft.details.eventDate) : new Date(),
    });
    this.reviewForm.patchValue(draft.review);
    this.foodRows.clear({ emitEvent: false });
    this.equipmentRows.clear({ emitEvent: false });
    draft.foodRows.forEach((row) => {
      this.foodRows.push(this.createFoodRow(row), { emitEvent: false });
    });
    draft.equipmentRows.forEach((row) => {
      this.equipmentRows.push(this.createEquipmentRow(row), { emitEvent: false });
    });
    if (this.foodRows.length === 0) this.foodRows.push(this.createFoodRow(), { emitEvent: false });
    if (this.equipmentRows.length === 0) this.equipmentRows.push(this.createEquipmentRow(), { emitEvent: false });
    this.pendingStepIndex = draft.stepIndex ?? 0;
    this.restoring = false;
    this.snack.open('Draft restored successfully.', 'OK', { duration: 2200 });
  }

  private createFoodRow(value?: { foodId: string; quantity: number; lineTotal: number }): FormGroup {
    return this.fb.group({
      foodId: this.fb.control<string>(value?.foodId ?? '', { validators: [Validators.required], nonNullable: true }),
      quantity: this.fb.control<number>(value?.quantity ?? 1, { validators: [Validators.required, Validators.min(1)], nonNullable: true }),
      lineTotal: this.fb.control<number>(value?.lineTotal ?? 0, { nonNullable: true }),
    });
  }

  private createEquipmentRow(value?: { equipmentId: string; quantity: number; lineTotal: number }): FormGroup {
    return this.fb.group({
      equipmentId: this.fb.control<string>(value?.equipmentId ?? '', { validators: [Validators.required], nonNullable: true }),
      quantity: this.fb.control<number>(value?.quantity ?? 1, { validators: [Validators.required, Validators.min(1)], nonNullable: true }),
      lineTotal: this.fb.control<number>(value?.lineTotal ?? 0, { nonNullable: true }),
    });
  }

  private mapFoodSelections(rows: Array<{ foodId?: string | null; quantity?: number | null }>): FoodSelection[] {
    const result: FoodSelection[] = [];
    for (const row of rows) {
      if (!row.foodId) continue;
      const selection = this.foodMenu.toSelection(row.foodId, Math.max(1, Number(row.quantity || 1)));
      if (selection) result.push(selection);
    }
    return result;
  }

  private mapEquipmentSelections(rows: Array<{ equipmentId?: string | null; quantity?: number | null }>): EquipmentSelection[] {
    const result: EquipmentSelection[] = [];
    for (const row of rows) {
      if (!row.equipmentId) continue;
      const selection = this.equipmentService.toSelection(row.equipmentId, Math.max(1, Number(row.quantity || 1)));
      if (selection) result.push(selection);
    }
    return result;
  }

  private syncFoodLineTotals(): void {
    this.foodRows.controls.forEach((group) => {
      const id = group.controls['foodId'].value;
      const qty = Math.max(1, Number(group.controls['quantity'].value || 1));
      const item = id ? this.foodMenu.getById(id) : undefined;
      const nextTotal = item ? item.price * qty : 0;
      if (group.controls['lineTotal'].value !== nextTotal) {
        group.controls['lineTotal'].patchValue(nextTotal, { emitEvent: false });
      }
    });
  }

  private syncEquipmentLineTotals(): void {
    this.equipmentRows.controls.forEach((group) => {
      const id = group.controls['equipmentId'].value;
      const qty = Math.max(1, Number(group.controls['quantity'].value || 1));
      const item = id ? this.equipmentService.getById(id) : undefined;
      const nextTotal = item ? item.pricePerUnit * qty : 0;
      if (group.controls['lineTotal'].value !== nextTotal) {
        group.controls['lineTotal'].patchValue(nextTotal, { emitEvent: false });
      }
    });
  }
}

function hasDuplicateIds(ids: Array<string | null | undefined>): boolean {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id) continue;
    if (seen.has(id)) return true;
    seen.add(id);
  }
  return false;
}

function futureOrTodayDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const selected = new Date(value);
  selected.setHours(0, 0, 0, 0);
  const today = startOfToday();
  return selected < today ? { pastDate: true } : null;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
