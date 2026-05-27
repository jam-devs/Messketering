import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { OrderService } from './order.service';
import { PackageService } from './package.service';
import { EquipmentService } from './equipment.service';
import { ScheduleService } from './schedule.service';

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AnalyticsSummary {
  totalRevenue: number;
  foodRevenue: number;
  equipmentRevenue: number;
  totalOrders: number;
  mostRequestedPackage: string;
  topFood: string;
  topEquipment: string;
  upcomingEvents: number;
  equipmentUtilization: number;
  pendingOrders: number;
  completedOrders: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(
    private orderService: OrderService,
    private packageService: PackageService,
    private equipmentService: EquipmentService,
    private scheduleService: ScheduleService
  ) {}

  getSummary(): Observable<AnalyticsSummary> {
    return combineLatest([
      this.orderService.getAll(),
      this.packageService.getAll(),
      this.equipmentService.getAll(),
      this.scheduleService.getEvents(),
    ]).pipe(
      map(([orders, packages, equipment, events]) => {
        const active = orders.filter((o) => !o.isDraft);
        const totalRevenue = active.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const foodRevenue = active.reduce(
          (s, o) => s + o.customFoodItems.reduce((fs, i) => fs + i.quantity * i.unitPrice, 0),
          0
        );
        const equipmentRevenue = active.reduce(
          (s, o) => s + o.customEquipmentItems.reduce((es, i) => es + i.quantity * i.unitPrice, 0),
          0
        );
        const foodCounts = new Map<string, number>();
        const equipCounts = new Map<string, number>();
        active.forEach((o) => {
          o.customFoodItems.forEach((f) =>
            foodCounts.set(f.name, (foodCounts.get(f.name) ?? 0) + f.quantity)
          );
          o.customEquipmentItems.forEach((e) =>
            equipCounts.set(e.name, (equipCounts.get(e.name) ?? 0) + e.quantity)
          );
        });
        const pkgCounts = new Map<string, number>();
        active.forEach((o) => {
          if (o.packageName) {
            pkgCounts.set(o.packageName, (pkgCounts.get(o.packageName) ?? 0) + 1);
          }
        });
        const mostRequested =
          [...pkgCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
        const totalUnits = equipment.reduce((s, e) => s + e.totalQuantity, 0);
        const avail = equipment.reduce((s, e) => s + e.availableQuantity, 0);
        const now = new Date();
        const upcoming = events.filter((e) => e.eventDate >= now).length;

        const topFood = [...foodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
        const topEquipment = [...equipCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

        return {
          totalRevenue,
          foodRevenue,
          equipmentRevenue,
          totalOrders: active.length,
          mostRequestedPackage: mostRequested,
          topFood,
          topEquipment,
          upcomingEvents: upcoming,
          equipmentUtilization: totalUnits
            ? Math.round(((totalUnits - avail) / totalUnits) * 100)
            : 0,
          pendingOrders: active.filter((o) => o.orderStatus === 'pending').length,
          completedOrders: active.filter((o) => o.orderStatus === 'completed').length,
        };
      })
    );
  }

  getRevenueChart(period: AnalyticsPeriod): Observable<ChartConfiguration> {
    return this.orderService.getAll().pipe(
      map((orders) => {
        const active = orders.filter((o) => !o.isDraft);
        const labels = this.periodLabels(period);
        const data = labels.map((_, i) => {
          const slice = active.filter((o) => this.inPeriodBucket(o.eventDate, period, i, labels.length));
          return slice.reduce((s, o) => s + o.totalAmount, 0);
        });
        return this.barConfig('Monthly Sales Revenue', labels, data, '#5a5a5a');
      })
    );
  }

  getBookingsChart(period: AnalyticsPeriod): Observable<ChartConfiguration> {
    return this.orderService.getAll().pipe(
      map((orders) => {
        const active = orders.filter((o) => !o.isDraft);
        const labels = this.periodLabels(period);
        const data = labels.map((_, i) =>
          active.filter((o) => this.inPeriodBucket(o.eventDate, period, i, labels.length)).length
        );
        return this.lineConfig('Weekly Bookings', labels, data, '#c4a962');
      })
    );
  }

  getPopularPackagesChart(): Observable<ChartConfiguration> {
    return this.orderService.getAll().pipe(
      map((orders) => {
        const counts = new Map<string, number>();
        orders
          .filter((o) => !o.isDraft && o.packageName)
          .forEach((o) => counts.set(o.packageName, (counts.get(o.packageName) ?? 0) + 1));
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        return this.doughnutConfig(
          'Most Popular Packages',
          sorted.map((s) => s[0]),
          sorted.map((s) => s[1])
        );
      })
    );
  }

  getOrderStatusChart(): Observable<ChartConfiguration> {
    return this.orderService.getAll().pipe(
      map((orders) => {
        const active = orders.filter((o) => !o.isDraft);
        const pending = active.filter((o) => o.orderStatus !== 'completed').length;
        const completed = active.filter((o) => o.orderStatus === 'completed').length;
        return this.doughnutConfig('Pending vs Completed', ['Pending', 'Completed'], [pending, completed]);
      })
    );
  }

  getFoodRevenueChart(): Observable<ChartConfiguration> {
    return this.orderService.getAll().pipe(
      map((orders) => {
        const foodCounts = new Map<string, number>();
        orders
          .filter((o) => !o.isDraft)
          .forEach((o) =>
            o.customFoodItems.forEach((f) =>
              foodCounts.set(f.name, (foodCounts.get(f.name) ?? 0) + f.quantity * f.unitPrice)
            )
          );
        const sorted = [...foodCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
        return this.barConfig(
          'Food Sales Revenue (₱)',
          sorted.map((s) => s[0]),
          sorted.map((s) => s[1]),
          '#4a4a4a'
        );
      })
    );
  }

  getEquipmentRevenueChart(): Observable<ChartConfiguration> {
    return this.orderService.getAll().pipe(
      map((orders) => {
        const counts = new Map<string, number>();
        orders
          .filter((o) => !o.isDraft)
          .forEach((o) =>
            o.customEquipmentItems.forEach((e) =>
              counts.set(e.name, (counts.get(e.name) ?? 0) + e.quantity * e.unitPrice)
            )
          );
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
        return this.barConfig(
          'Equipment Rental Revenue (₱)',
          sorted.map((s) => s[0]),
          sorted.map((s) => s[1]),
          '#c4a962'
        );
      })
    );
  }

  getEquipmentUsageChart(): Observable<ChartConfiguration> {
    return this.equipmentService.getAll().pipe(
      map((items) =>
        this.barConfig(
          'Equipment Usage',
          items.map((i) => i.name.slice(0, 18)),
          items.map((i) => i.totalQuantity - i.availableQuantity),
          '#8d8d8d'
        )
      )
    );
  }

  private periodLabels(period: AnalyticsPeriod): string[] {
    const now = new Date();
    if (period === 'daily') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en', { weekday: 'short' });
      });
    }
    if (period === 'weekly') {
      return ['W1', 'W2', 'W3', 'W4'];
    }
    if (period === 'yearly') {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  }

  private inPeriodBucket(date: Date, period: AnalyticsPeriod, index: number, total: number): boolean {
    const now = new Date();
    if (period === 'daily') {
      const d = new Date(now);
      d.setDate(d.getDate() - (total - 1 - index));
      return date.toDateString() === d.toDateString();
    }
    if (period === 'weekly') {
      const week = Math.floor((now.getDate() - 1) / 7);
      const orderWeek = Math.floor((date.getDate() - 1) / 7);
      return orderWeek % total === index;
    }
    if (period === 'yearly') {
      return date.getMonth() === index;
    }
    return date.getMonth() === index;
  }

  private barConfig(label: string, labels: string[], data: number[], color: string): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label, data, backgroundColor: color + '99', borderColor: color, borderWidth: 1 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    };
  }

  private lineConfig(label: string, labels: string[], data: number[], color: string): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels,
        datasets: [{ label, data, borderColor: color, backgroundColor: color + '33', fill: true, tension: 0.3 }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
  }

  private doughnutConfig(label: string, labels: string[], data: number[]): ChartConfiguration {
    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            backgroundColor: ['#2b2b2b', '#6e6e6e', '#c4a962', '#d9cdb8', '#e5e5e5'],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
  }
}
