import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { SearchBarComponent } from '../../../shared/components/search-bar.component';
import { ClientService } from '../../../services/client.service';
import { GlobalSearchService } from '../../../services/global-search.service';
import { startWith, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [AsyncPipe, DatePipe, MatCardModule, MatIconModule, MatTableModule, PageHeaderComponent, SearchBarComponent],
  template: `
    <app-page-header title="Clients Management" subtitle="Clients who book via phone, Facebook, email, or in-person" />
    <app-search-bar label="Search clients" placeholder="Name, email, phone, company..." [initialValue]="globalSearch.current" (searchChange)="onSearch($event)" />
    <mat-card class="table-card">
      @if ((clients$ | async)?.length) {
        <table mat-table [dataSource]="(clients$ | async) ?? []">
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let c"><strong>{{ c.name }}</strong>@if (c.company) { <small>{{ c.company }}</small> }</td></ng-container>
          <ng-container matColumnDef="contact"><th mat-header-cell *matHeaderCellDef>Contact</th><td mat-cell *matCellDef="let c">{{ c.email }}<br><small>{{ c.phone }}</small></td></ng-container>
          <ng-container matColumnDef="address"><th mat-header-cell *matHeaderCellDef>Address</th><td mat-cell *matCellDef="let c">{{ c.address || '—' }}</td></ng-container>
          <ng-container matColumnDef="since"><th mat-header-cell *matHeaderCellDef>Since</th><td mat-cell *matCellDef="let c">{{ c.createdAt | date:'mediumDate' }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      } @else {
        <p class="empty-state">No clients match your search.</p>
      }
    </mat-card>
  `,
})
export class ClientsComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  readonly globalSearch = inject(GlobalSearchService);
  private readonly search$ = new Subject<string>();
  readonly cols = ['name', 'contact', 'address', 'since'];
  readonly clients$ = this.search$.pipe(startWith(''), switchMap((q) => this.clientService.search(q)));

  ngOnInit(): void {
    const q = this.globalSearch.current;
    if (q) this.search$.next(q);
    else this.search$.next('');
  }

  onSearch(q: string): void {
    this.globalSearch.setQuery(q);
    this.search$.next(q);
  }
}
