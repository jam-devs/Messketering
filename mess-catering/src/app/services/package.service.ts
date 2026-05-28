import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { CateringPackage } from '../models/catering-package.model';
import { FoodSelection } from '../models/food-menu.model';
import { EquipmentSelection } from '../models/equipment.model';
import { sumFoodSelections, sumEquipmentSelections } from '../shared/utils/pricing.utils';
import { matchesQuery, normalizeSearch } from '../shared/utils/search.utils';
import { AdminApiService } from './admin-api.service';

const now = new Date();

function buildPackage(
  partial: Omit<CateringPackage, 'createdAt' | 'updatedAt' | 'foodSubtotal' | 'equipmentSubtotal' | 'totalPrice'> & {
    foodSelections?: FoodSelection[];
    equipmentSelections?: EquipmentSelection[];
  }
): CateringPackage {
  const foodSelections = partial.foodSelections ?? [];
  const equipmentSelections = partial.equipmentSelections ?? [];
  const foodSubtotal = sumFoodSelections(foodSelections);
  const equipmentSubtotal = sumEquipmentSelections(equipmentSelections);
  const totalPrice = foodSubtotal + equipmentSubtotal + (partial.basePrice ?? 0);
  return {
    ...partial,
    menuItems: foodSelections.map((f) => f.foodName),
    includedEquipment: equipmentSelections.map((e) => e.equipmentName),
    amenities: equipmentSelections.map((e) => e.equipmentName),
    includesEquipment: equipmentSelections.length > 0,
    foodSelections,
    equipmentSelections,
    foodSubtotal,
    equipmentSubtotal,
    totalPrice,
    createdAt: now,
    updatedAt: now,
  };
}

const SEED: CateringPackage[] = [
  buildPackage({
    id: 'p1',
    name: 'Executive Buffet',
    description: 'Premium buffet for corporate events',
    pricePerHead: 850,
    basePrice: 0,
    minGuests: 30,
    maxGuests: 200,
    goodForPersons: 50,
    menuItems: [],
    foodSelections: [],
    equipmentSelections: [],
    includedEquipment: [],
    includesEquipment: true,
    amenities: [],
    isActive: true,
  }),
  buildPackage({
    id: 'p2',
    name: 'Garden Party Package',
    description: 'Outdoor catering package',
    pricePerHead: 650,
    basePrice: 0,
    minGuests: 20,
    maxGuests: 100,
    goodForPersons: 40,
    menuItems: [],
    foodSelections: [],
    equipmentSelections: [],
    includedEquipment: [],
    includesEquipment: true,
    amenities: [],
    isActive: true,
  }),
];

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly packages$ = new BehaviorSubject<CateringPackage[]>([]);

  constructor(private api: AdminApiService) {
    this.refresh();
  }

  private refresh() {
    this.api.get<CateringPackage>('packages').subscribe({
      next: (packages) => {
        this.packages$.next(packages.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })));
      },
      error: () => {
        this.packages$.next(SEED);
      },
    });
  }

  getAll(): Observable<CateringPackage[]> {
    return this.packages$.asObservable();
  }

  search(query: string): Observable<CateringPackage[]> {
    const q = normalizeSearch(query);
    return this.packages$.pipe(
      map((list) =>
        !q
          ? list
          : list.filter(
              (p) =>
                matchesQuery(p.name, q) ||
                matchesQuery(p.description, q) ||
                p.menuItems.some((m) => matchesQuery(m, q))
            )
      )
    );
  }

  getActive(): Observable<CateringPackage[]> {
    return this.packages$.pipe(map((list) => list.filter((p) => p.isActive)));
  }

  getById(id: string): CateringPackage | undefined {
    return this.packages$.value.find((p) => p.id === id);
  }

  add(pkg: Omit<CateringPackage, 'id' | 'createdAt' | 'updatedAt'>): CateringPackage {
    const created = buildPackage({ ...pkg, id: `p${Date.now()}` });

    this.api.create<CateringPackage>('packages', {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }).pipe(
      tap(() => this.refresh())
    ).subscribe();

    return created;
  }

  update(id: string, patch: Partial<CateringPackage>): void {
    const existing = this.packages$.value.find((item) => item.id === id);

    if (!existing) {
      return;
    }

    const merged = buildPackage({
      ...existing,
      ...patch,
    });

    this.api.update<CateringPackage>('packages', id, {
      ...merged,
      createdAt: existing.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    }).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  delete(id: string): void {
    this.api.delete('packages', id).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  toggleActive(id: string): void {
    this.update(id, { isActive: !this.getById(id)?.isActive });
  }

  get count(): number {
    return this.packages$.value.filter((p) => p.isActive).length;
  }
}
