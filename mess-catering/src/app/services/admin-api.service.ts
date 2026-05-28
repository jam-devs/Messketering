import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

interface ApiListResponse<T> {
  status: string;
  data: T[];
}

interface ApiItemResponse<T> {
  status: string;
  data: T;
}

interface LoginResponse {
  status: string;
  token: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    role: 'admin' | 'kitchen' | 'logistics';
  };
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly tokenKey = 'mess_ketering_admin_token';

  constructor(private http: HttpClient) {}

  get<T>(resource: string): Observable<T[]> {
    return this.http
      .get<ApiListResponse<T>>(`/api/admin/${resource}`, this.authOptions())
      .pipe(map((response) => response.data));
  }

  getById<T>(resource: string, id: string): Observable<T> {
    return this.http
      .get<ApiItemResponse<T>>(`/api/admin/${resource}/${id}`, this.authOptions())
      .pipe(map((response) => response.data));
  }

  create<T>(resource: string, payload: unknown): Observable<T> {
    return this.http
      .post<ApiItemResponse<T>>(`/api/admin/${resource}`, payload, this.authOptions())
      .pipe(map((response) => response.data));
  }

  update<T>(resource: string, id: string, payload: unknown): Observable<T> {
    return this.http
      .put<ApiItemResponse<T>>(`/api/admin/${resource}/${id}`, payload, this.authOptions())
      .pipe(map((response) => response.data));
  }

  delete(resource: string, id: string): Observable<void> {
    return this.http
      .delete<{ status: string; message: string }>(`/api/admin/${resource}/${id}`, this.authOptions())
      .pipe(map(() => undefined));
  }

  updateOrderField<T>(id: string, field: 'status' | 'kitchen-status' | 'logistics-status', payload: unknown): Observable<T> {
    return this.http
      .put<ApiItemResponse<T>>(`/api/admin/orders/${id}/${field}`, payload, this.authOptions())
      .pipe(map((response) => response.data));
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/login', { email, password }).pipe(
      tap((response) => {
        this.setToken(response.token);
      })
    );
  }

  logout(): Observable<void> {
    return this.http
      .post('/api/logout', {}, this.authOptions())
      .pipe(
        tap(() => this.clearToken()),
        map(() => undefined)
      );
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.tokenKey);
  }

  private authOptions() {
    const token = this.getToken();

    return {
      headers: token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined,
    };
  }
}
