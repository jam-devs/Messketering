import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { AdminApiService } from './admin-api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userKey = 'caterdash_user';
  private readonly currentUser = signal<User | null>(null);

  constructor(private api: AdminApiService) {}

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly role = computed(() => this.currentUser()?.role ?? null);

  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.api.login(email, password).subscribe({
        next: (response) => {
          const user: User = {
            id: String(response.user.id),
            name: response.user.name,
            email: response.user.email,
            role: response.user.role,
          };
          this.currentUser.set(user);
          localStorage.setItem(this.userKey, JSON.stringify(user));
          resolve(true);
        },
        error: () => {
          resolve(false);
        },
      });
    });
  }

  logout(): void {
    this.api.logout().subscribe({
      next: () => undefined,
      error: () => undefined,
    });
    this.currentUser.set(null);
    localStorage.removeItem(this.userKey);
    this.api.clearToken();
  }

  restoreSession(): void {
    const stored = localStorage.getItem(this.userKey);
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch {
        localStorage.removeItem(this.userKey);
      }
    }

    if (!this.api.getToken()) {
      this.currentUser.set(null);
      localStorage.removeItem(this.userKey);
    }
  }

  hasRole(...roles: UserRole[]): boolean {
    const r = this.currentUser()?.role;
    return r ? roles.includes(r) : false;
  }
}
