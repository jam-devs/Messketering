import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly query$ = new BehaviorSubject<string>('');

  readonly search$ = this.query$.asObservable();

  setQuery(q: string): void {
    this.query$.next(q);
  }

  get current(): string {
    return this.query$.value;
  }

  clear(): void {
    this.query$.next('');
  }
}
