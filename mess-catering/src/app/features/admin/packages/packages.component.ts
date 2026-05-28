import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { combineLatest, startWith, Subject, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { SearchBarComponent } from '../../../shared/components/search-bar.component';
import { PackageService } from '../../../services/package.service';
import { GlobalSearchService } from '../../../services/global-search.service';
import { CateringPackage } from '../../../models/catering-package.model';
import { PackageFormDialogComponent } from './package-form-dialog.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [
    CurrencyPipe, MatCardModule, MatIconModule, MatChipsModule, MatButtonModule,
    MatDialogModule, MatSnackBarModule, MatSlideToggleModule, AsyncPipe,
    PageHeaderComponent, SearchBarComponent,
  ],
  template: `
    <app-page-header title="Catering Packages" subtitle="Create and manage packages for manual bookings">
      @if (isAdmin()) {
        <button mat-flat-button (click)="openCreate()"><mat-icon>add</mat-icon> Add Package</button>
      }
    </app-page-header>

    <app-search-bar
      label="Search packages"
      placeholder="Name, menu items, equipment..."
      [initialValue]="globalSearch.current"
      (searchChange)="onSearch($event)"
    />

    <div class="packages-grid">
      @for (pkg of packages$ | async; track pkg.id) {
        <mat-card [class.inactive]="!pkg.isActive">
          @if (pkg.imageUrl) {
            <img class="pkg-image" [src]="pkg.imageUrl" [alt]="pkg.name" />
          }
          <mat-card-header>
            <mat-card-title>{{ pkg.name }}</mat-card-title>
            @if (isAdmin()) {
              <div class="pkg-actions">
                <button mat-icon-button (click)="openEdit(pkg)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="delete(pkg.id)"><mat-icon>delete</mat-icon></button>
                <mat-slide-toggle [checked]="pkg.isActive" (change)="toggle(pkg.id)" />
              </div>
            }
          </mat-card-header>
          <mat-card-content>
            <p>{{ pkg.description }}</p>
            <div class="pkg-price">{{ pkg.totalPrice | currency:'PHP':'symbol-narrow':'1.0-0' }}</div>
            <p class="pkg-range">Good for {{ pkg.goodForPersons }} persons</p>
            <div class="menu-list">
              @for (item of pkg.foodSelections; track item.foodId) {
                <mat-chip>{{ item.foodName }} ×{{ item.quantity }}</mat-chip>
              }
            </div>
            @if (pkg.equipmentSelections.length) {
              <p class="pkg-amenities"><mat-icon>inventory_2</mat-icon>{{ pkg.equipmentSelections.length }} equipment items</p>
            }
          </mat-card-content>
        </mat-card>
      } @empty {
        <p class="empty-state">No packages match your search.</p>
      }
    </div>
  `,
})
export class PackagesComponent implements OnInit {
  private readonly packageService = inject(PackageService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  readonly globalSearch = inject(GlobalSearchService);
  private readonly search$ = new Subject<string>();

  isAdmin = () => this.auth.hasRole('admin');

  readonly packages$ = combineLatest([
    this.search$.pipe(startWith(this.globalSearch.current)),
  ]).pipe(switchMap(([q]) => this.packageService.search(q)));

  ngOnInit(): void {
    if (this.globalSearch.current) this.search$.next(this.globalSearch.current);
  }

  onSearch(q: string): void {
    this.globalSearch.setQuery(q);
    this.search$.next(q);
  }

  openCreate(): void {
    const ref = this.dialog.open(PackageFormDialogComponent, { width: '720px', maxHeight: '90vh', data: { mode: 'create' } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.packageService.add(result);
        this.snack.open('Package created', 'OK', { duration: 3000 });
      }
    });
  }

  openEdit(pkg: CateringPackage): void {
    const ref = this.dialog.open(PackageFormDialogComponent, { width: '720px', maxHeight: '90vh', data: { mode: 'edit', pkg } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.packageService.update(pkg.id, result);
        this.snack.open('Package updated', 'OK', { duration: 3000 });
      }
    });
  }

  toggle(id: string): void { this.packageService.toggleActive(id); }
  delete(id: string): void {
    if (confirm('Delete this package?')) {
      this.packageService.delete(id);
      this.snack.open('Package deleted', 'OK', { duration: 3000 });
    }
  }
}
