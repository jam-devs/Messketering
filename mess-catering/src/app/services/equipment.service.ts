import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import {
  EquipmentAllocation,
  EquipmentItem,
  EquipmentSelection,
  EquipmentStatus,
} from '../models/equipment.model';
import { Order } from '../models/order.model';
import { equipmentLineTotal } from '../shared/utils/pricing.utils';
import { matchesQuery, normalizeSearch } from '../shared/utils/search.utils';
import { AdminApiService } from './admin-api.service';

const now = new Date();

const SEED: EquipmentItem[] = [
  {
    id: 'e1',
    name: 'Round Table',
    description: '10-seater banquet round table',
    category: 'tables',
    totalQuantity: 40,
    availableQuantity: 40,
    pricePerUnit: 300,
    status: 'available',
    condition: 'good',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'e2',
    name: 'Monoblock Chair',
    description: 'Standard white monoblock chair',
    category: 'chairs',
    totalQuantity: 300,
    availableQuantity: 300,
    pricePerUnit: 25,
    status: 'available',
    condition: 'good',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'e3',
    name: 'Patio Umbrella',
    description: 'Outdoor shade umbrella',
    category: 'umbrellas',
    totalQuantity: 15,
    availableQuantity: 15,
    pricePerUnit: 150,
    status: 'available',
    condition: 'good',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'e4',
    name: 'Spoon & Fork Set',
    description: 'Cutlery set per guest',
    category: 'utensils',
    totalQuantity: 500,
    availableQuantity: 500,
    pricePerUnit: 15,
    status: 'available',
    condition: 'good',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'e5',
    name: 'White Table Linen',
    description: 'Table cover linen',
    category: 'linens',
    totalQuantity: 50,
    availableQuantity: 50,
    pricePerUnit: 80,
    status: 'available',
    condition: 'fair',
    createdAt: now,
    updatedAt: now,
  },
];

export interface AllocationConflict {
  equipmentId: string;
  equipmentName: string;
  requested: number;
  available: number;
  conflictingBookings: string[];
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly equipment$ = new BehaviorSubject<EquipmentItem[]>([]);
  private readonly loading$ = new BehaviorSubject(true);
  private readonly fallbackUsed$ = new BehaviorSubject(false);

  constructor(private api: AdminApiService) {
    this.refresh();
  }

  private refresh() {
    this.loading$.next(true);
    this.fallbackUsed$.next(false);

    this.api.get<EquipmentItem>('equipment').subscribe({
      next: (items) => {
        this.equipment$.next(items.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })));
        this.loading$.next(false);
      },
      error: () => {
        this.equipment$.next(SEED);
        this.fallbackUsed$.next(true);
        this.loading$.next(false);
      },
    });
  }

  getAll(): Observable<EquipmentItem[]> {
    return this.equipment$.asObservable();
  }

  getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getFallbackStatus(): Observable<boolean> {
    return this.fallbackUsed$.asObservable();
  }

  getAvailable(): Observable<EquipmentItem[]> {
    return this.equipment$.pipe(
      map((list) => list.filter((e) => e.status === 'available' && e.availableQuantity > 0))
    );
  }

  getById(id: string): EquipmentItem | undefined {
    return this.equipment$.value.find((e) => e.id === id);
  }

  search(query: string): Observable<EquipmentItem[]> {
    const q = normalizeSearch(query);
    return this.equipment$.pipe(
      map((list) => {
        const active = list.filter((e) => e.status !== 'archived');
        if (!q) return active;
        return active.filter(
          (e) =>
            matchesQuery(e.name, q) ||
            matchesQuery(e.description, q) ||
            matchesQuery(e.category, q)
        );
      })
    );
  }

  add(item: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'availableQuantity'>): EquipmentItem {
    const created: EquipmentItem = {
      ...item,
      availableQuantity: item.totalQuantity,
      id: `e${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.api.create<EquipmentItem>('equipment', {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }).pipe(
      tap(() => this.refresh())
    ).subscribe();

    return created;
  }

  update(id: string, patch: Partial<EquipmentItem>): void {
    const existing = this.equipment$.value.find((item) => item.id === id);

    if (!existing) {
      return;
    }

    this.api.update<EquipmentItem>('equipment', id, {
      ...existing,
      ...patch,
      createdAt: existing.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    }).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  adjustQuantity(id: string, delta: number, reason?: 'purchase' | 'damage' | 'loss'): void {
    const item = this.getById(id);
    if (!item) return;
    const total = Math.max(0, item.totalQuantity + delta);
    const avail = Math.max(0, Math.min(total, item.availableQuantity + delta));
    this.update(id, {
      totalQuantity: total,
      availableQuantity: avail,
      notes: reason ? `${reason}: ${delta > 0 ? '+' : ''}${delta}` : item.notes,
    });
  }

  archive(id: string): void {
    this.update(id, { status: 'archived' });
  }

  toSelection(equipmentId: string, quantity: number): EquipmentSelection | null {
    const eq = this.getById(equipmentId);
    if (!eq || eq.status !== 'available') return null;
    if (quantity > eq.availableQuantity) return null;
    return {
      equipmentId: eq.id,
      equipmentName: eq.name,
      quantity,
      unitPrice: eq.pricePerUnit,
      availableStock: eq.availableQuantity,
      lineTotal: equipmentLineTotal(eq.pricePerUnit, quantity),
    };
  }

  syncAvailability(orders: Order[]): void {
    const activeOrders = orders.filter(
      (o) => o.logisticsStatus !== 'returned' && o.kitchenStatus !== 'completed' && !o.isDraft
    );
    const allocated = new Map<string, number>();
    for (const order of activeOrders) {
      for (const alloc of order.equipmentAllocations) {
        allocated.set(alloc.equipmentId, (allocated.get(alloc.equipmentId) ?? 0) + alloc.quantity);
      }
      for (const sel of order.customEquipmentItems ?? []) {
        if (sel.id) {
          allocated.set(sel.id, (allocated.get(sel.id) ?? 0) + sel.quantity);
        }
      }
    }

    this.equipment$.next(
      this.equipment$.value.map((item) => ({
        ...item,
        availableQuantity: Math.max(0, item.totalQuantity - (allocated.get(item.id) ?? 0)),
      }))
    );
  }

  checkConflicts(
    allocations: EquipmentAllocation[],
    eventDate: Date,
    orders: Order[],
    excludeOrderId?: string
  ): AllocationConflict[] {
    const dateKey = eventDate.toDateString();
    const sameDayOrders = orders.filter(
      (o) =>
        o.eventDate.toDateString() === dateKey &&
        o.logisticsStatus !== 'returned' &&
        o.kitchenStatus !== 'completed' &&
        !o.isDraft &&
        o.id !== excludeOrderId
    );
    const used = new Map<string, { qty: number; refs: string[] }>();
    for (const order of sameDayOrders) {
      for (const a of order.equipmentAllocations) {
        const prev = used.get(a.equipmentId) ?? { qty: 0, refs: [] };
        used.set(a.equipmentId, { qty: prev.qty + a.quantity, refs: [...prev.refs, order.bookingRef] });
      }
    }
    const conflicts: AllocationConflict[] = [];
    for (const alloc of allocations) {
      const item = this.getById(alloc.equipmentId);
      if (!item) continue;
      const alreadyUsed = used.get(alloc.equipmentId)?.qty ?? 0;
      const remaining = item.totalQuantity - alreadyUsed;
      if (alloc.quantity > remaining) {
        conflicts.push({
          equipmentId: alloc.equipmentId,
          equipmentName: alloc.equipmentName,
          requested: alloc.quantity,
          available: remaining,
          conflictingBookings: used.get(alloc.equipmentId)?.refs ?? [],
        });
      }
    }
    return conflicts;
  }

  getLowStock(): Observable<EquipmentItem[]> {
    return this.equipment$.pipe(
      map((items) =>
        items.filter(
          (i) => i.status === 'available' && i.availableQuantity / i.totalQuantity < 0.25
        )
      )
    );
  }

  get count(): number {
    return this.equipment$.value.filter((e) => e.status === 'available').length;
  }
}
