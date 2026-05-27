import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { FoodMenuItem, FoodSelection, FoodAvailability } from '../models/food-menu.model';
import { foodLineTotal } from '../shared/utils/pricing.utils';
import { matchesQuery, normalizeSearch } from '../shared/utils/search.utils';

const now = new Date();

const SEED: FoodMenuItem[] = [
  {
    id: 'f1',
    name: 'Pork Menudo',
    description: 'Classic Filipino pork stew with potatoes and bell peppers',
    category: 'main_dish',
    servingSize: 'Full tray',
    price: 2500,
    servesPersons: 25,
    availability: 'available',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'f2',
    name: 'Carbonara',
    description: 'Creamy pasta with bacon and parmesan',
    category: 'rice_pasta',
    servingSize: 'Full tray',
    price: 1800,
    servesPersons: 15,
    availability: 'available',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'f3',
    name: 'Leche Flan',
    description: 'Traditional caramel custard dessert',
    category: 'dessert',
    servingSize: 'Platter',
    price: 1200,
    servesPersons: 20,
    availability: 'available',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'f4',
    name: 'Iced Tea Pitcher',
    description: 'House-blend iced tea',
    category: 'drinks',
    servingSize: '4 liters',
    price: 350,
    servesPersons: 10,
    availability: 'available',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'f5',
    name: 'Spring Rolls',
    description: 'Crispy vegetable lumpia appetizer',
    category: 'appetizer',
    servingSize: '50 pieces',
    price: 900,
    servesPersons: 25,
    availability: 'available',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'f6',
    name: 'Java Rice',
    description: 'Turmeric fried rice',
    category: 'rice_pasta',
    servingSize: 'Full tray',
    price: 800,
    servesPersons: 20,
    availability: 'unavailable',
    createdAt: now,
    updatedAt: now,
  },
];

@Injectable({ providedIn: 'root' })
export class FoodMenuService {
  private readonly items$ = new BehaviorSubject<FoodMenuItem[]>(SEED);

  getAll(): Observable<FoodMenuItem[]> {
    return this.items$.asObservable();
  }

  getAvailable(): Observable<FoodMenuItem[]> {
    return this.items$.pipe(map((list) => list.filter((f) => f.availability === 'available')));
  }

  getById(id: string): FoodMenuItem | undefined {
    return this.items$.value.find((f) => f.id === id);
  }

  search(query: string, includeUnavailable = true): Observable<FoodMenuItem[]> {
    const q = normalizeSearch(query);
    return this.items$.pipe(
      map((list) => {
        let filtered = includeUnavailable
          ? list.filter((f) => f.availability !== 'archived')
          : list.filter((f) => f.availability === 'available');
        if (!q) return filtered;
        return filtered.filter(
          (f) =>
            matchesQuery(f.name, q) ||
            matchesQuery(f.description, q) ||
            matchesQuery(f.servingSize, q)
        );
      })
    );
  }

  add(item: Omit<FoodMenuItem, 'id' | 'createdAt' | 'updatedAt'>): FoodMenuItem {
    const created: FoodMenuItem = {
      ...item,
      id: `f${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items$.next([...this.items$.value, created]);
    return created;
  }

  update(id: string, patch: Partial<FoodMenuItem>): void {
    this.items$.next(
      this.items$.value.map((f) =>
        f.id === id ? { ...f, ...patch, updatedAt: new Date() } : f
      )
    );
  }

  setAvailability(id: string, availability: FoodAvailability): void {
    this.update(id, { availability });
  }

  archive(id: string): void {
    this.setAvailability(id, 'archived');
  }

  delete(id: string): void {
    this.archive(id);
  }

  toSelection(foodId: string, quantity: number): FoodSelection | null {
    const food = this.getById(foodId);
    if (!food || food.availability !== 'available') return null;
    return {
      foodId: food.id,
      foodName: food.name,
      category: food.category,
      servingSize: food.servingSize,
      servesPersons: food.servesPersons,
      quantity,
      unitPrice: food.price,
      lineTotal: foodLineTotal(food.price, quantity),
    };
  }

  get count(): number {
    return this.items$.value.filter((f) => f.availability === 'available').length;
  }
}
