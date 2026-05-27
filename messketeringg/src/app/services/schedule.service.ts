import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ScheduleEvent } from '../models/schedule-event.model';
import { OrderService } from './order.service';
import { matchesDate, matchesQuery, normalizeSearch } from '../shared/utils/search.utils';
import { KITCHEN_STATUS_LABELS, LOGISTICS_STATUS_LABELS } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private orderService: OrderService) {}

  getEvents(): Observable<ScheduleEvent[]> {
    return this.orderService.getAll().pipe(
      map((orders) =>
        orders
          .filter((o) => !o.isDraft)
          .map((o) => ({
            id: o.id,
            orderId: o.id,
            bookingRef: o.bookingRef,
            title: o.eventName,
            clientName: o.clientName,
            eventDate: o.eventDate,
            eventTime: o.eventTime,
            venue: o.venue,
            guestCount: o.guestCount,
            kitchenStatus: o.kitchenStatus,
            logisticsStatus: o.logisticsStatus,
          }))
          .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
      )
    );
  }

  search(query: string): Observable<ScheduleEvent[]> {
    const q = normalizeSearch(query);
    return this.getEvents().pipe(
      map((events) =>
        !q
          ? events
          : events.filter(
              (e) =>
                matchesQuery(e.bookingRef, q) ||
                matchesQuery(e.title, q) ||
                matchesQuery(e.clientName, q) ||
                matchesQuery(e.venue, q) ||
                matchesQuery(KITCHEN_STATUS_LABELS[e.kitchenStatus], q) ||
                matchesDate(e.eventDate, q)
            )
      )
    );
  }

  getByMonth(year: number, month: number): Observable<ScheduleEvent[]> {
    return this.getEvents().pipe(
      map((events) =>
        events.filter((e) => {
          const d = e.eventDate;
          return d.getFullYear() === year && d.getMonth() === month;
        })
      )
    );
  }
}
