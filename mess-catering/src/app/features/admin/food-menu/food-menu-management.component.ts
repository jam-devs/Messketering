import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { distinctUntilChanged, merge, startWith, Subject, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { SearchBarComponent } from '../../../shared/components/search-bar.component';
import { FoodMenuService } from '../../../services/food-menu.service';
import { GlobalSearchService } from '../../../services/global-search.service';
import { FoodMenuItem, FOOD_CATEGORY_LABELS } from '../../../models/food-menu.model';
import { FoodFormDialogComponent } from './food-form-dialog.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-food-menu-management',
  standalone: true,
  imports: [
    AsyncPipe, CurrencyPipe, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatMenuModule, PageHeaderComponent, SearchBarComponent,
  ],
  template: `
    <app-page-header title="Food Menu Management" subtitle="Master list of all catering foods — prices based on persons served">
      @if (isAdmin()) {
        <button mat-flat-button (click)="openCreate()"><mat-icon>add</mat-icon> Add Food</button>
      }
    </app-page-header>

    <app-search-bar label="Search food menu" placeholder="Name, category, serving size..." [initialValue]="globalSearch.current" (searchChange)="onSearch($event)" />

    <mat-card class="table-card">
      @if ((items$ | async)?.length) {
        <table mat-table [dataSource]="(items$ | async) ?? []">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Food</th>
            <td mat-cell *matCellDef="let f">
              <strong>{{ f.name }}</strong>
              <small>{{ f.description }}</small>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let f"><mat-chip>{{ categoryLabel(f) }}</mat-chip></td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Price</th>
            <td mat-cell *matCellDef="let f">{{ f.price | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
          </ng-container>
          <ng-container matColumnDef="serves">
            <th mat-header-cell *matHeaderCellDef>Serves</th>
            <td mat-cell *matCellDef="let f">{{ f.servesPersons }} persons · {{ f.servingSize }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let f">
              <mat-chip [class.unavail]="f.availability !== 'available'">{{ f.availability }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let f">
              <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="openEdit(f)"><mat-icon>edit</mat-icon> Edit</button>
                @if (f.availability === 'available') {
                  <button mat-menu-item (click)="setStatus(f.id, 'unavailable')"><mat-icon>block</mat-icon> Mark Unavailable</button>
                } @else if (f.availability === 'unavailable') {
                  <button mat-menu-item (click)="setStatus(f.id, 'available')"><mat-icon>check</mat-icon> Mark Available</button>
                }
                <button mat-menu-item (click)="archive(f.id)"><mat-icon>archive</mat-icon> Archive</button>
              </mat-menu>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      } @else {
        <p class="empty-state">No food items match your search.</p>
      }
    </mat-card>
  `,
})
export class FoodMenuManagementComponent implements OnInit {
  private readonly foodMenu = inject(FoodMenuService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  readonly globalSearch = inject(GlobalSearchService);
  private readonly search$ = new Subject<string>();
  readonly labels = FOOD_CATEGORY_LABELS;
  readonly cols = ['name', 'category', 'price', 'serves', 'status', 'actions'];

  readonly items$ = merge(this.search$, this.globalSearch.search$).pipe(
    startWith(this.globalSearch.current || ''),
    distinctUntilChanged(),
    switchMap((q) => this.foodMenu.search(q, true))
  );

  isAdmin = () => this.auth.hasRole('admin');

  categoryLabel(item: FoodMenuItem): string {
    return this.labels[item.category];
  }

  ngOnInit(): void {
    this.search$.next(this.globalSearch.current || '');
  }

  onSearch(q: string): void {
    this.globalSearch.setQuery(q);
    this.search$.next(q);
  }

  openCreate(): void {
    const ref = this.dialog.open(FoodFormDialogComponent, { width: '520px', data: { mode: 'create' } });
    ref.afterClosed().subscribe((r) => {
      if (r) {
        this.foodMenu.add(r);
        this.snack.open('Food item added', 'OK', { duration: 2500 });
      }
    });
  }

  openEdit(item: FoodMenuItem): void {
    const ref = this.dialog.open(FoodFormDialogComponent, { width: '520px', data: { mode: 'edit', item } });
    ref.afterClosed().subscribe((r) => {
      if (r) {
        this.foodMenu.update(item.id, r);
        this.snack.open('Food updated', 'OK', { duration: 2500 });
      }
    });
  }

  setStatus(id: string, status: 'available' | 'unavailable'): void {
    this.foodMenu.setAvailability(id, status);
  }

  archive(id: string): void {
    if (confirm('Archive this food item?')) this.foodMenu.archive(id);
  }
}
