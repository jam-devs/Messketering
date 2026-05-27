import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { KitchenStatus, Order } from '../models/order.model';
import { OrderService } from './order.service';

export interface KitchenTask {
  orderId: string;
  bookingRef: string;
  eventName: string;
  packageName: string;
  guestCount: number;
  eventDate: Date;
  eventTime: string;
  kitchenStatus: KitchenStatus;
  assignedStaff?: string;
}

export interface KitchenWorkload {
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  totalGuests: number;
}

@Injectable({ providedIn: 'root' })
export class KitchenService {
  constructor(private orderService: OrderService) {}

  getWorkload(): Observable<KitchenWorkload> {
    return this.orderService.getAll().pipe(
      map((orders) => {
        const active = orders.filter((o) => o.kitchenStatus !== 'completed');
        return {
          pending: orders.filter((o) => o.kitchenStatus === 'pending').length,
          preparing: orders.filter((o) => o.kitchenStatus === 'preparing').length,
          ready: orders.filter((o) => o.kitchenStatus === 'ready_for_transport').length,
          completed: orders.filter((o) => o.kitchenStatus === 'completed').length,
          totalGuests: active.reduce((s, o) => s + o.guestCount, 0),
        };
      })
    );
  }

  getActiveOrders(): Observable<KitchenTask[]> {
    return this.orderService.getAll().pipe(
      map((orders) =>
        orders
          .filter((o) => o.kitchenStatus !== 'completed')
          .map((o) => this.toTask(o))
          .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
      )
    );
  }

  getUpcomingSchedule(limit = 5): Observable<KitchenTask[]> {
    return this.orderService.getAll().pipe(
      map((orders) =>
        orders
          .filter((o) => o.kitchenStatus !== 'completed' && o.eventDate >= new Date())
          .map((o) => this.toTask(o))
          .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
          .slice(0, limit)
      )
    );
  }

  private toTask(o: Order): KitchenTask {
    return {
      orderId: o.id,
      bookingRef: o.bookingRef,
      eventName: o.eventName,
      packageName: o.packageName,
      guestCount: o.guestCount,
      eventDate: o.eventDate,
      eventTime: o.eventTime,
      kitchenStatus: o.kitchenStatus,
      assignedStaff: o.assignedKitchenStaff,
    };
  }
}
