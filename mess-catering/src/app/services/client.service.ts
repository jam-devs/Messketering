import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Client } from '../models/client.model';
import { AdminApiService } from './admin-api.service';

const SEED: Client[] = [
  { id: 'c1', name: 'ABC Corporation', email: 'events@abc.com', phone: '+63 912 345 6789', company: 'ABC Corp', address: 'Makati City', createdAt: new Date('2025-01-10') },
  { id: 'c2', name: 'Maria Reyes', email: 'maria.r@email.com', phone: '+63 917 111 2233', address: 'Quezon City', notes: 'Wedding client', createdAt: new Date('2025-02-15') },
  { id: 'c3', name: 'Greenfield School', email: 'admin@greenfield.edu', phone: '+63 2 8888 9999', company: 'Greenfield School', address: 'Pasig City', createdAt: new Date('2025-03-01') },
  { id: 'c4', name: 'TechStart Inc.', email: 'hr@techstart.io', phone: '+63 918 555 6677', company: 'TechStart Inc.', createdAt: new Date('2025-04-20') },
];

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly clients$ = new BehaviorSubject<Client[]>([]);

  constructor(private api: AdminApiService) {
    this.refresh();
  }

  private refresh() {
    this.api.get<Client>('clients').subscribe({
      next: (clients) => {
        this.clients$.next(clients.map((client) => ({
          ...client,
          createdAt: new Date(client.createdAt),
        })));
      },
      error: () => {
        this.clients$.next(SEED);
      },
    });
  }

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
    this.api.create<Client>('clients', {
      ...client,
      createdAt: new Date().toISOString(),
    }).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  update(id: string, patch: Partial<Client>): void {
    const existing = this.clients$.value.find((client) => client.id === id);

    if (!existing) {
      return;
    }

    this.api.update<Client>('clients', id, {
      ...existing,
      ...patch,
      createdAt: existing.createdAt.toISOString(),
    }).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  delete(id: string): void {
    this.api.delete('clients', id).pipe(
      tap(() => this.refresh())
    ).subscribe();
  }

  get count(): number {
    return this.clients$.value.length;
  }
}
