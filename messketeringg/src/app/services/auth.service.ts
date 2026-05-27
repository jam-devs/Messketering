import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../models/user.model';

const MOCK_USERS: (User & { password: string })[] = [
  { id: '1', name: 'Admin User', email: 'admin@caterdash.com', role: 'admin', password: 'admin123' },
  { id: '2', name: 'Maria Santos', email: 'kitchen@caterdash.com', role: 'kitchen', password: 'kitchen123' },
  { id: '3', name: 'Juan Dela Cruz', email: 'logistics@caterdash.com', role: 'logistics', password: 'logistics123' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly role = computed(() => this.currentUser()?.role ?? null);

  login(email: string, password: string): boolean {
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!found) return false;
    const { password: _, ...user } = found;
    this.currentUser.set(user);
    localStorage.setItem('caterdash_user', JSON.stringify(user));
    return true;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('caterdash_user');
  }

  restoreSession(): void {
    const stored = localStorage.getItem('caterdash_user');
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch {
        localStorage.removeItem('caterdash_user');
      }
    }
  }

  hasRole(...roles: UserRole[]): boolean {
    const r = this.currentUser()?.role;
    return r ? roles.includes(r) : false;
  }
}
