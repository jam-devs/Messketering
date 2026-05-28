import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, distinctUntilChanged, map, merge, startWith, Subject, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { SearchBarComponent } from '../../../shared/components/search-bar.component';
import { EquipmentService } from '../../../services/equipment.service';
import { OrderService } from '../../../services/order.service';
import { GlobalSearchService } from '../../../services/global-search.service';
import { EquipmentItem } from '../../../models/equipment.model';
import { EquipmentFormDialogComponent } from './equipment-form-dialog.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [
    AsyncPipe, CurrencyPipe, MatCardModule, MatIconModule, MatTableModule,
    MatButtonModule, MatChipsModule, MatMenuModule, PageHeaderComponent, SearchBarComponent,
  ],
  template: `
    <app-page-header title="Equipment Inventory Management" subtitle="Centralized equipment — quantity, pricing (₱), and availability">
      @if (isAdmin()) {
        <button mat-flat-button (click)="openCreate()"><mat-icon>add</mat-icon> Add Equipment</button>
      }
    </app-page-header>

    <app-search-bar label="Search equipment" placeholder="Name, category..." [initialValue]="globalSearch.current" (searchChange)="onSearch($event)" />

    @if (conflicts$ | async; as conflicts) {
      @if (conflicts.length) {
        <mat-card class="alert-card"><mat-icon>warning</mat-icon><div><strong>{{ conflicts.length }} booking conflict(s)</strong><p>Review orders to prevent double-booking.</p></div></mat-card>
      }
    }

    <mat-card class="table-card">
      @if ((equipment$ | async)?.length) {
        <table mat-table [dataSource]="(equipment$ | async) ?? []">
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Equipment</th><td mat-cell *matCellDef="let e"><strong>{{ e.name }}</strong><small>{{ e.description }}</small></td></ng-container>
          <ng-container matColumnDef="price"><th mat-header-cell *matHeaderCellDef>Price/unit</th><td mat-cell *matCellDef="let e">{{ e.pricePerUnit | currency:'PHP':'symbol-narrow':'1.0-0' }}</td></ng-container>
          <ng-container matColumnDef="qty"><th mat-header-cell *matHeaderCellDef>Stock</th><td mat-cell *matCellDef="let e" [class.low-stock]="e.availableQuantity / e.totalQuantity < 0.25">{{ e.availableQuantity }} / {{ e.totalQuantity }}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let e"><mat-chip>{{ e.status }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let e">
            <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="openEdit(e)"><mat-icon>edit</mat-icon> Edit</button>
              <button mat-menu-item (click)="adjust(e.id, 5)"><mat-icon>add</mat-icon> Add 5 (purchase)</button>
              <button mat-menu-item (click)="adjust(e.id, -1)"><mat-icon>remove</mat-icon> Remove 1 (damage)</button>
              <button mat-menu-item (click)="archive(e.id)"><mat-icon>archive</mat-icon> Archive</button>
            </mat-menu>
          </td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      } @else {
        <p class="empty-state">No equipment matches your search.</p>
      }
    </mat-card>
  `,
})
export class EquipmentComponent implements OnInit {
  private readonly equipmentService = inject(EquipmentService);
  private readonly orderService = inject(OrderService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  readonly globalSearch = inject(GlobalSearchService);
  private readonly search$ = new Subject<string>();
  readonly cols = ['name', 'price', 'qty', 'status', 'actions'];

  readonly equipment$ = merge(this.search$, this.globalSearch.search$).pipe(
    startWith(this.globalSearch.current || ''),
    distinctUntilChanged(),
    switchMap((q) => this.equipmentService.search(q))
  );

  readonly conflicts$ = combineLatest([this.orderService.getAll(), this.equipmentService.getAll()]).pipe(
    map(([orders]) => {
      const found: { ref: string }[] = [];
      for (const order of orders.filter((o) => !o.isDraft && o.kitchenStatus !== 'completed')) {
        const c = this.equipmentService.checkConflicts(order.equipmentAllocations, order.eventDate, orders, order.id);
        c.forEach(() => found.push({ ref: order.bookingRef }));
      }
      return found;
    })
  );

  isAdmin = () => this.auth.hasRole('admin');

  ngOnInit(): void {
    this.search$.next(this.globalSearch.current || '');
  }

  onSearch(q: string): void {
    this.globalSearch.setQuery(q);
    this.search$.next(q);
  }

  openCreate(): void {
    const ref = this.dialog.open(EquipmentFormDialogComponent, { width: '480px', data: { mode: 'create' } });
    ref.afterClosed().subscribe((r) => {
      if (r) {
        this.equipmentService.add({ ...r, availableQuantity: r.totalQuantity });
        this.snack.open('Equipment added', 'OK', { duration: 2500 });
      }
    });
  }

  openEdit(item: EquipmentItem): void {
    const ref = this.dialog.open(EquipmentFormDialogComponent, { width: '480px', data: { mode: 'edit', item } });
    ref.afterClosed().subscribe((r) => {
      if (r) this.equipmentService.update(item.id, r);
    });
  }

  adjust(id: string, delta: number): void {
    this.equipmentService.adjustQuantity(id, delta, delta > 0 ? 'purchase' : 'damage');
    this.snack.open(`Quantity ${delta > 0 ? 'increased' : 'decreased'}`, 'OK', { duration: 2000 });
  }

  archive(id: string): void {
    if (confirm('Archive this equipment?')) this.equipmentService.archive(id);
  }
}
