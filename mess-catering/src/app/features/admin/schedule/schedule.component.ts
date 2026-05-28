import { Component, inject, OnInit, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { combineLatest, map, startWith, Subject, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { SearchBarComponent } from '../../../shared/components/search-bar.component';
import { ScheduleService } from '../../../services/schedule.service';
import { GlobalSearchService } from '../../../services/global-search.service';
import { getKitchenLabel, getKitchenColor, getLogisticsLabel, getLogisticsColor } from '../../../shared/utils/status.utils';
import { KitchenStatus, LogisticsStatus } from '../../../models/order.model';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [AsyncPipe, DatePipe, MatCardModule, MatIconModule, MatButtonModule, PageHeaderComponent, SearchBarComponent],
  template: `
    <app-page-header title="Event Scheduling" subtitle="Calendar view of catering events and bookings" />
    <app-search-bar label="Search schedule" placeholder="Event, client, booking ref, date..." [initialValue]="globalSearch.current" (searchChange)="onSearch($event)" />
    <div class="month-nav">
      <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
      <h2>{{ monthLabel() }}</h2>
      <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
    </div>
    <div class="schedule-list">
      @for (event of events$ | async; track event.id) {
        <mat-card class="schedule-card">
          <div class="schedule-date"><span class="day">{{ event.eventDate | date:'d' }}</span><span class="month">{{ event.eventDate | date:'MMM' }}</span></div>
          <div class="schedule-info">
            <strong>{{ event.title }}</strong>
            <span>{{ event.bookingRef }} · {{ event.clientName }}</span>
            <span><mat-icon>schedule</mat-icon>{{ event.eventTime }} · <mat-icon>place</mat-icon>{{ event.venue }}</span>
            <div class="dual-status">
              <span class="status-pill kitchen" [style.background]="kColor(event.kitchenStatus)">{{ kLabel(event.kitchenStatus) }}</span>
              <span class="status-pill logistics" [style.background]="lColor(event.logisticsStatus)">{{ lLabel(event.logisticsStatus) }}</span>
            </div>
          </div>
        </mat-card>
      } @empty {
        <p class="empty-state">No events match your search this month.</p>
      }
    </div>
  `,
})
export class ScheduleComponent implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  readonly globalSearch = inject(GlobalSearchService);
  private readonly search$ = new Subject<string>();
  readonly viewDate = signal(new Date());

  readonly events$ = combineLatest([
    toObservable(this.viewDate),
    this.search$.pipe(startWith('')),
  ]).pipe(
    switchMap(([d, q]) =>
      this.scheduleService.getByMonth(d.getFullYear(), d.getMonth()).pipe(
        map((events) => {
          if (!q.trim()) return events;
          const lower = q.toLowerCase();
          return events.filter(
            (e) =>
              e.title.toLowerCase().includes(lower) ||
              e.clientName.toLowerCase().includes(lower) ||
              e.bookingRef.toLowerCase().includes(lower) ||
              e.venue.toLowerCase().includes(lower)
          );
        })
      )
    )
  );

  ngOnInit(): void {
    this.search$.next(this.globalSearch.current || '');
  }

  onSearch(q: string): void {
    this.globalSearch.setQuery(q);
    this.search$.next(q);
  }

  monthLabel(): string {
    return this.viewDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  prevMonth(): void { const d = new Date(this.viewDate()); d.setMonth(d.getMonth() - 1); this.viewDate.set(d); }
  nextMonth(): void { const d = new Date(this.viewDate()); d.setMonth(d.getMonth() + 1); this.viewDate.set(d); }
  kLabel = getKitchenLabel;
  kColor = (s: KitchenStatus) => getKitchenColor(s) + '33';
  lLabel = getLogisticsLabel;
  lColor = (s: LogisticsStatus) => getLogisticsColor(s) + '33';
}
