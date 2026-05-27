import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { CateringPackage } from '../models/catering-package.model';
import { FoodSelection } from '../models/food-menu.model';
import { EquipmentSelection } from '../models/equipment.model';
import { sumFoodSelections, sumEquipmentSelections } from '../shared/utils/pricing.utils';
import { matchesQuery, normalizeSearch } from '../shared/utils/search.utils';

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
  private readonly packages$ = new BehaviorSubject<CateringPackage[]>(SEED);

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
    this.packages$.next([...this.packages$.value, created]);
    return created;
  }

  update(id: string, patch: Partial<CateringPackage>): void {
    this.packages$.next(
      this.packages$.value.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...patch, updatedAt: new Date() };
        return buildPackage(merged);
      })
    );
  }

  delete(id: string): void {
    this.packages$.next(this.packages$.value.filter((p) => p.id !== id));
  }

  toggleActive(id: string): void {
    this.update(id, { isActive: !this.getById(id)?.isActive });
  }

  get count(): number {
    return this.packages$.value.filter((p) => p.isActive).length;
  }
}
