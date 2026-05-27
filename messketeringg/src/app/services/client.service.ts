import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Client } from '../models/client.model';

const SEED: Client[] = [
  { id: 'c1', name: 'ABC Corporation', email: 'events@abc.com', phone: '+63 912 345 6789', company: 'ABC Corp', address: 'Makati City', createdAt: new Date('2025-01-10') },
  { id: 'c2', name: 'Maria Reyes', email: 'maria.r@email.com', phone: '+63 917 111 2233', address: 'Quezon City', notes: 'Wedding client', createdAt: new Date('2025-02-15') },
  { id: 'c3', name: 'Greenfield School', email: 'admin@greenfield.edu', phone: '+63 2 8888 9999', company: 'Greenfield School', address: 'Pasig City', createdAt: new Date('2025-03-01') },
  { id: 'c4', name: 'TechStart Inc.', email: 'hr@techstart.io', phone: '+63 918 555 6677', company: 'TechStart Inc.', createdAt: new Date('2025-04-20') },
];

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly clients$ = new BehaviorSubject<Client[]>(SEED);

  getAll(): Observable<Client[]> {
    return this.clients$.asObservable();
  }

  getById(id: string): Observable<Client | undefined> {
    return this.clients$.pipe(map((list) => list.find((c) => c.id === id)));
  }

  search(query: string): Observable<Client[]> {
    const q = query.toLowerCase().trim();
    return this.clients$.pipe(
      map((list) =>
        !q
          ? list
          : list.filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                c.company?.toLowerCase().includes(q)
            )
      )
    );
  }

  add(client: Omit<Client, 'id' | 'createdAt'>): void {
    const list = this.clients$.value;
    const newClient: Client = {
      ...client,
      id: `c${Date.now()}`,
      createdAt: new Date(),
    };
    this.clients$.next([...list, newClient]);
  }

  update(id: string, patch: Partial<Client>): void {
    this.clients$.next(
      this.clients$.value.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  delete(id: string): void {
    this.clients$.next(this.clients$.value.filter((c) => c.id !== id));
  }

  get count(): number {
    return this.clients$.value.length;
  }
}
