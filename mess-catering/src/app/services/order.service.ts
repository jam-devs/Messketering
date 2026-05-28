import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Order, KitchenStatus, LogisticsStatus } from '../models/order.model';
import { CustomLineItem, ManualOrderStatus } from '../models/custom-order.model';
import { EquipmentAllocation } from '../models/equipment.model';
import { EquipmentService } from './equipment.service';
import { PackageService } from './package.service';
import { matchesDate, matchesQuery, normalizeSearch } from '../shared/utils/search.utils';
import { KITCHEN_STATUS_LABELS, LOGISTICS_STATUS_LABELS } from '../models/order.model';
import { MANUAL_ORDER_STATUS_LABELS } from '../models/custom-order.model';
import { AdminApiService } from './admin-api.service';

export function lineItemsTotal(items: CustomLineItem[]): number {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

export function computeOrderTotals(
  guestCount: number,
  packageId: string | undefined,
  foodItems: CustomLineItem[],
  equipmentItems: CustomLineItem[],
  packageService?: PackageService
): { subtotal: number; totalAmount: number } {
  let packageTotal = 0;
  if (packageId && packageService) {
    const pkg = packageService.getById(packageId);
    if (pkg) {
      packageTotal = pkg.basePrice || pkg.pricePerHead * guestCount;
    }
  }
  const food = lineItemsTotal(foodItems);
  const equip = lineItemsTotal(equipmentItems);
  const subtotal = packageTotal + food + equip;
  return { subtotal, totalAmount: subtotal };
}

function baseOrder(partial: Partial<Order> & Pick<Order, 'id' | 'bookingRef' | 'clientName' | 'eventName' | 'eventDate'>): Order {
  return {
    clientId: '',
    packageId: '',
    packageName: '',
    eventTime: '12:00',
    venue: '',
    guestCount: 0,
    kitchenStatus: 'pending',
    logisticsStatus: 'not_started',
    equipmentAllocations: [],
    isCustom: false,
    isDraft: false,
    orderStatus: 'pending',
    customFoodItems: [],
    customEquipmentItems: [],
    subtotal: 0,
    totalAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Order;
}

const SEED: Order[] = [
  baseOrder({
    id: 'o1', bookingRef: 'CD-2026-001', clientId: 'c1', clientName: 'ABC Corporation',
    packageId: 'p1', packageName: 'Executive Buffet', eventName: 'Q1 Town Hall Lunch',
    eventDate: new Date('2026-05-28'), eventTime: '11:30', venue: 'ABC Corp HQ, Makati', guestCount: 80,
    kitchenStatus: 'preparing', orderStatus: 'preparing',
    equipmentAllocations: [
      { equipmentId: 'e1', equipmentName: 'Round Banquet Table (10-seater)', category: 'tables', quantity: 8 },
      { equipmentId: 'e2', equipmentName: 'Folding Chair', category: 'chairs', quantity: 80 },
    ],
    subtotal: 68000, totalAmount: 68000, assignedKitchenStaff: 'Maria Santos',
    createdAt: new Date('2026-05-10'), updatedAt: new Date('2026-05-24'),
  }),
  baseOrder({
    id: 'o2', bookingRef: 'CD-2026-002', clientId: 'c2', clientName: 'Maria Reyes',
    packageId: 'p3', packageName: 'Wedding Feast', eventName: 'Reyes-Santos Wedding',
    eventDate: new Date('2026-06-15'), eventTime: '18:00', venue: 'Garden Pavilion, Tagaytay', guestCount: 150,
    kitchenStatus: 'pending', orderStatus: 'pending',
    equipmentAllocations: [
      { equipmentId: 'e1', equipmentName: 'Round Banquet Table (10-seater)', category: 'tables', quantity: 15 },
      { equipmentId: 'e2', equipmentName: 'Folding Chair', category: 'chairs', quantity: 150 },
    ],
    subtotal: 180000, totalAmount: 180000,
    createdAt: new Date('2026-05-20'), updatedAt: new Date('2026-05-20'),
  }),
  baseOrder({
    id: 'o3', bookingRef: 'CD-2026-003', clientId: 'c3', clientName: 'Greenfield School',
    packageId: 'p4', packageName: 'School Event Snack Pack', eventName: 'Sports Day 2026',
    eventDate: new Date('2026-05-30'), eventTime: '07:00', venue: 'Greenfield School Grounds', guestCount: 200,
    kitchenStatus: 'ready_for_transport', logisticsStatus: 'preparing_for_delivery', orderStatus: 'ready_for_transport',
    equipmentAllocations: [{ equipmentId: 'e4', equipmentName: 'Full Cutlery Set (per guest)', category: 'utensils', quantity: 200 }],
    subtotal: 70000, totalAmount: 70000,
    createdAt: new Date('2026-05-05'), updatedAt: new Date('2026-05-25'),
  }),
  baseOrder({
    id: 'o6', bookingRef: 'CD-2026-006', clientId: 'c3', clientName: 'Greenfield School',
    packageId: 'p2', packageName: 'Garden Party Package', eventName: 'Graduation Party',
    eventDate: new Date('2026-05-29'), eventTime: '14:00', venue: 'Greenfield School', guestCount: 120,
    kitchenStatus: 'ready_for_transport', logisticsStatus: 'out_for_delivery', orderStatus: 'ready_for_transport',
    isCustom: true,
    customFoodItems: [{ id: 'f1', name: 'Extra dessert station', quantity: 1, unitPrice: 8500 }],
    subtotal: 86500, totalAmount: 86500,
    createdAt: new Date('2026-05-18'), updatedAt: new Date('2026-05-26'),
  }),
  baseOrder({
    id: 'o-draft', bookingRef: 'CD-DRAFT-001', clientId: 'c4', clientName: 'TechStart Inc.',
    packageId: '', packageName: 'Custom Build', eventName: 'Product Launch (Draft)',
    eventDate: new Date('2026-06-10'), eventTime: '16:00', venue: 'BGC Rooftop', guestCount: 60,
    isCustom: true, isDraft: true, orderStatus: 'pending',
    customFoodItems: [{ id: 'f1', name: 'Premium canapés', quantity: 60, unitPrice: 120 }],
    customEquipmentItems: [{ id: 'eq1', name: 'LED uplighting', quantity: 4, unitPrice: 2500 }],
    subtotal: 17200, totalAmount: 17200,
    notes: 'Awaiting client confirmation',
    createdAt: new Date('2026-05-26'), updatedAt: new Date('2026-05-26'),
  }),
];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly orders$ = new BehaviorSubject<Order[]>([]);
  private readonly loading$ = new BehaviorSubject(true);
  private readonly fallbackUsed$ = new BehaviorSubject(false);

  constructor(
    private equipmentService: EquipmentService,
    private packageService: PackageService,
    private api: AdminApiService
  ) {
    this.refresh();
  }

  private refresh() {
    this.loading$.next(true);
    this.fallbackUsed$.next(false);

    this.api.get<Order>('orders').subscribe({
      next: (orders) => {
        const mapped = orders.map((order) => ({
          ...order,
          eventDate: new Date(order.eventDate),
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }));
        this.orders$.next(mapped);
        this.equipmentService.syncAvailability(mapped);
        this.loading$.next(false);
      },
      error: () => {
        this.orders$.next(SEED);
        this.equipmentService.syncAvailability(SEED);
        this.fallbackUsed$.next(true);
        this.loading$.next(false);
      },
    });
  }

  getAll(): Observable<Order[]> {
    return this.orders$.asObservable();
  }

  getById(id: string): Observable<Order | undefined> {
    return this.orders$.pipe(map((list) => list.find((o) => o.id === id)));
  }

  search(query: string): Observable<Order[]> {
    const q = normalizeSearch(query);
    return this.orders$.pipe(
      map((list) =>
        !q
          ? list
          : list.filter(
              (o) =>
                matchesQuery(o.bookingRef, q) ||
                matchesQuery(o.clientName, q) ||
                matchesQuery(o.eventName, q) ||
                matchesQuery(o.venue, q) ||
                matchesQuery(o.packageName, q) ||
                matchesQuery(o.id, q) ||
                matchesQuery(KITCHEN_STATUS_LABELS[o.kitchenStatus], q) ||
                matchesQuery(LOGISTICS_STATUS_LABELS[o.logisticsStatus], q) ||
                matchesQuery(MANUAL_ORDER_STATUS_LABELS[o.orderStatus], q) ||
                matchesDate(o.eventDate, q)
            )
      )
    );
  }

  filterByKitchen(status: KitchenStatus | 'all'): Observable<Order[]> {
    return this.orders$.pipe(
      map((list) => (status === 'all' ? list : list.filter((o) => o.kitchenStatus === status)))
    );
  }

  createCustomOrder(input: {
    clientId: string;
    clientName: string;
    eventName: string;
    eventDate: Date;
    eventTime: string;
    venue: string;
    guestCount: number;
    packageId?: string;
    packageName?: string;
    foodItems: CustomLineItem[];
    equipmentItems: CustomLineItem[];
    subtotal?: number;
    totalAmount?: number;
    notes?: string;
    orderStatus: ManualOrderStatus;
    isDraft: boolean;
  }): Order {
    const computed = computeOrderTotals(
      input.guestCount,
      input.packageId,
      input.foodItems,
      input.equipmentItems,
      this.packageService
    );
    const subtotal = input.subtotal ?? computed.subtotal;
    const totalAmount = input.totalAmount ?? computed.totalAmount;
    const kitchenStatus = this.mapOrderToKitchen(input.orderStatus);
    const order: Order = {
      id: `o${Date.now()}`,
      bookingRef: input.isDraft ? `CD-DRAFT-${Date.now().toString().slice(-4)}` : `CD-${new Date().getFullYear()}-${String(this.orders$.value.length + 1).padStart(3, '0')}`,
      clientId: input.clientId,
      clientName: input.clientName,
      packageId: input.packageId ?? '',
      packageName: input.packageName ?? 'Custom Order',
      eventName: input.eventName,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      venue: input.venue,
      guestCount: input.guestCount,
      kitchenStatus,
      logisticsStatus: kitchenStatus === 'ready_for_transport' ? 'preparing_for_delivery' : 'not_started',
      equipmentAllocations: [],
      isCustom: true,
      isDraft: input.isDraft,
      orderStatus: input.orderStatus,
      customFoodItems: input.foodItems,
      customEquipmentItems: input.equipmentItems,
      subtotal,
      totalAmount,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.api.create<Order>('orders', {
      ...order,
      eventDate: order.eventDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }).pipe(
      tap(() => this.refresh())
    ).subscribe();

    return order;
  }

  updateKitchenStatus(id: string, kitchenStatus: KitchenStatus): void {
    this.api.updateOrderField<Order>(id, 'kitchen-status', { kitchenStatus }).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  updateLogisticsStatus(id: string, logisticsStatus: LogisticsStatus): void {
    this.api.updateOrderField<Order>(id, 'logistics-status', { logisticsStatus }).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  updateOrderStatus(id: string, orderStatus: ManualOrderStatus): void {
    this.api.updateOrderField<Order>(id, 'status', { orderStatus }).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  private mapOrderToKitchen(status: ManualOrderStatus): KitchenStatus {
    if (status === 'confirmed') return 'pending';
    if (status === 'completed') return 'completed';
    return status as KitchenStatus;
  }

  private patch(id: string, patch: Partial<Order>): void {
    const updated = this.orders$.value.map((o) => (o.id === id ? { ...o, ...patch } : o));
    this.orders$.next(updated);
    this.equipmentService.syncAvailability(updated);
  }

  getStats(): Observable<{
    total: number;
    kitchenPending: number;
    kitchenPreparing: number;
    kitchenReady: number;
    logisticsActive: number;
    logisticsDelivered: number;
    todayEvents: number;
  }> {
    return this.orders$.pipe(
      map((orders) => {
        const active = orders.filter((o) => !o.isDraft);
        const today = new Date().toDateString();
        return {
          total: active.length,
          kitchenPending: active.filter((o) => o.kitchenStatus === 'pending').length,
          kitchenPreparing: active.filter((o) => o.kitchenStatus === 'preparing').length,
          kitchenReady: active.filter((o) => o.kitchenStatus === 'ready_for_transport').length,
          logisticsActive: active.filter(
            (o) => o.logisticsStatus === 'preparing_for_delivery' || o.logisticsStatus === 'out_for_delivery'
          ).length,
          logisticsDelivered: active.filter((o) => o.logisticsStatus === 'delivered').length,
          todayEvents: active.filter((o) => o.eventDate.toDateString() === today).length,
        };
      })
    );
  }

  getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getFallbackStatus(): Observable<boolean> {
    return this.fallbackUsed$.asObservable();
  }

  getRecent(limit = 5): Observable<Order[]> {
    return this.orders$.pipe(
      map((list) =>
        [...list.filter((o) => !o.isDraft)]
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, limit)
      )
    );
  }
}
