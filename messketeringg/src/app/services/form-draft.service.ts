import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface StoredDraft<T> {
  value: T;
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class FormDraftService {
  private readonly storagePrefix = 'caterdash:draft:';
  private readonly subjects = new Map<string, BehaviorSubject<any>>();

  saveDraft<T>(key: string, value: T): void {
    const payload: StoredDraft<T> = { value, updatedAt: Date.now() };
    sessionStorage.setItem(this.storageKey(key), JSON.stringify(payload));
    this.ensureSubject<T>(key).next(payload.value);
  }

  getDraft<T>(key: string): T | null {
    const raw = sessionStorage.getItem(this.storageKey(key));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      return parsed.value ?? null;
    } catch {
      sessionStorage.removeItem(this.storageKey(key));
      return null;
    }
  }

  clearDraft(key: string): void {
    sessionStorage.removeItem(this.storageKey(key));
    this.ensureSubject(key).next(null);
  }

  watchDraft<T>(key: string): BehaviorSubject<T | null> {
    const subject = this.ensureSubject<T>(key);
    if (subject.value === null) {
      subject.next(this.getDraft<T>(key));
    }
    return subject;
  }

  private storageKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  private ensureSubject<T>(key: string): BehaviorSubject<T | null> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new BehaviorSubject<T | null>(null));
    }
    return this.subjects.get(key) as BehaviorSubject<T | null>;
  }
}
