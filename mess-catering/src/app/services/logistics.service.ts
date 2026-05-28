import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { LogisticsStatus, Order } from '../models/order.model';
import { OrderService } from './order.service';

export interface LogisticsTask {
  orderId: string;
  bookingRef: string;
  eventName: string;
  clientName: string;
  venue: string;
  eventDate: Date;
  eventTime: string;
  logisticsStatus: LogisticsStatus;
  equipmentCount: number;
  assignedStaff?: string;
  priority: 'high' | 'medium' | 'low';
}

@Injectable({ providedIn: 'root' })
export class LogisticsService {
  constructor(private orderService: OrderService) {}

  getDeploymentQueue(): Observable<LogisticsTask[]> {
    return this.orderService.getAll().pipe(
      map((orders) =>
        orders
          .filter(
            (o) =>
              o.logisticsStatus === 'preparing_for_delivery' ||
              o.logisticsStatus === 'out_for_delivery'
          )
          .map((o) => this.toTask(o))
          .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
      )
    );
  }

  getActiveDeployments(): Observable<LogisticsTask[]> {
    return this.orderService.getAll().pipe(
      map((orders) =>
        orders
          .filter((o) => o.logisticsStatus !== 'not_started' && o.logisticsStatus !== 'returned')
          .map((o) => this.toTask(o))
      )
    );
  }

  getStats(): Observable<{
    preparing: number;
    outForDelivery: number;
    delivered: number;
    returned: number;
  }> {
    return this.orderService.getAll().pipe(
      map((orders) => ({
        preparing: orders.filter((o) => o.logisticsStatus === 'preparing_for_delivery').length,
        outForDelivery: orders.filter((o) => o.logisticsStatus === 'out_for_delivery').length,
        delivered: orders.filter((o) => o.logisticsStatus === 'delivered').length,
        returned: orders.filter((o) => o.logisticsStatus === 'returned').length,
      }))
    );
  }

  private toTask(o: Order): LogisticsTask {
    const daysUntil = Math.ceil((o.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return {
      orderId: o.id,
      bookingRef: o.bookingRef,
      eventName: o.eventName,
      clientName: o.clientName,
      venue: o.venue,
      eventDate: o.eventDate,
      eventTime: o.eventTime,
      logisticsStatus: o.logisticsStatus,
      equipmentCount: o.equipmentAllocations.reduce((s, a) => s + a.quantity, 0),
      assignedStaff: o.assignedLogisticsStaff,
      priority: daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'medium' : 'low',
    };
  }
}
