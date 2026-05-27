import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';
import {
  ApiItemResponse,
  ApiListResponse,
  CreateOrderPayload,
  Customer,
  CustomerDetail,
  CustomerPayload,
  DashboardSummary,
  LoginResponse,
  MenuItem,
  MenuItemPayload,
  Order,
  PaymentPayload,
  ReportsSummary,
  ScheduleEvent,
} from '../models/catering-manager.model';

@Injectable({
  providedIn: 'root',
})
export class CateringApiService {
  private readonly tokenKey = 'mess_ketering_admin_token';
  private unauthorizedSubject = new Subject<void>();
  unauthorized$ = this.unauthorizedSubject.asObservable();

  constructor(private http: HttpClient) {}

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/login', { email, password });
  }

  saveToken(token: string) {
    this.setToken(token);
  }

  logout(): Observable<{ status: string; message: string }> {
    const request = this.http.post<{ status: string; message: string }>('/api/logout', {}, this.authOptions());
    this.clearToken();
    return request;
  }

  changePassword(payload: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Observable<{ status: string; message: string }> {
    return this.withAuthHandling(
      this.http.post<{ status: string; message: string }>('/api/change-password', payload, this.authOptions())
    );
  }

  getMenuItems(): Observable<ApiListResponse<MenuItem>> {
    return this.withAuthHandling(this.http.get<ApiListResponse<MenuItem>>('/api/menu-items', this.authOptions()));
  }

  getDashboardSummary(): Observable<ApiItemResponse<DashboardSummary>> {
    return this.withAuthHandling(this.http.get<ApiItemResponse<DashboardSummary>>('/api/dashboard', this.authOptions()));
  }

  getCustomers(): Observable<ApiListResponse<Customer>> {
    return this.withAuthHandling(this.http.get<ApiListResponse<Customer>>('/api/customers', this.authOptions()));
  }

  getCustomer(id: number): Observable<ApiItemResponse<CustomerDetail>> {
    return this.withAuthHandling(this.http.get<ApiItemResponse<CustomerDetail>>(`/api/customers/${id}`, this.authOptions()));
  }

  getReports(): Observable<ApiItemResponse<ReportsSummary>> {
    return this.withAuthHandling(this.http.get<ApiItemResponse<ReportsSummary>>('/api/reports', this.authOptions()));
  }

  getSchedule(): Observable<ApiListResponse<ScheduleEvent>> {
    return this.withAuthHandling(this.http.get<ApiListResponse<ScheduleEvent>>('/api/schedule', this.authOptions()));
  }

  updateCustomer(id: number, payload: CustomerPayload): Observable<ApiItemResponse<Customer>> {
    return this.withAuthHandling(
      this.http.put<ApiItemResponse<Customer>>(`/api/customers/${id}`, payload, this.authOptions())
    );
  }

  createMenuItem(payload: MenuItemPayload): Observable<ApiItemResponse<MenuItem>> {
    return this.withAuthHandling(
      this.http.post<ApiItemResponse<MenuItem>>('/api/menu-items', payload, this.authOptions())
    );
  }

  updateMenuItem(id: number, payload: MenuItemPayload): Observable<ApiItemResponse<MenuItem>> {
    return this.withAuthHandling(
      this.http.put<ApiItemResponse<MenuItem>>(`/api/menu-items/${id}`, payload, this.authOptions())
    );
  }

  deleteMenuItem(id: number): Observable<{ status: string; message: string }> {
    return this.withAuthHandling(
      this.http.delete<{ status: string; message: string }>(`/api/menu-items/${id}`, this.authOptions())
    );
  }

  getOrders(): Observable<ApiListResponse<Order>> {
    return this.withAuthHandling(this.http.get<ApiListResponse<Order>>('/api/orders', this.authOptions()));
  }

  createOrder(payload: CreateOrderPayload): Observable<{ status: string; message: string }> {
    return this.withAuthHandling(
      this.http.post<{ status: string; message: string }>('/api/orders', payload, this.authOptions())
    );
  }

  updateOrderStatus(id: number, status: string): Observable<{ status: string; message: string }> {
    return this.withAuthHandling(
      this.http.put<{ status: string; message: string }>(`/api/orders/${id}/status`, { status }, this.authOptions())
    );
  }

  deleteOrder(id: number): Observable<{ status: string; message: string }> {
    return this.withAuthHandling(
      this.http.delete<{ status: string; message: string }>(`/api/orders/${id}`, this.authOptions())
    );
  }

  recordPayment(orderId: number, payload: PaymentPayload): Observable<{ status: string; message: string }> {
    return this.withAuthHandling(
      this.http.post<{ status: string; message: string }>(`/api/orders/${orderId}/payments`, payload, this.authOptions())
    );
  }

  private getToken(): string | null {
    if (!this.hasBrowserStorage()) {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string) {
    if (!this.hasBrowserStorage()) {
      return;
    }

    localStorage.setItem(this.tokenKey, token);
  }

  private clearToken() {
    if (!this.hasBrowserStorage()) {
      return;
    }

    localStorage.removeItem(this.tokenKey);
  }

  private hasBrowserStorage() {
    return typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
  }

  private authOptions() {
    const token = this.getToken();

    return {
      headers: token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined,
    };
  }

  private withAuthHandling<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.clearToken();
          this.unauthorizedSubject.next();
        }

        return throwError(() => error);
      })
    );
  }
}
