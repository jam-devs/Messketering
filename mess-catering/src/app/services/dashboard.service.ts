import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { OrderService } from './order.service';
import { ClientService } from './client.service';
import { PackageService } from './package.service';
import { EquipmentService } from './equipment.service';

export interface DashboardMetrics {
  totalOrders: number;
  kitchenPending: number;
  kitchenPreparing: number;
  kitchenReady: number;
  logisticsActive: number;
  logisticsDelivered: number;
  todayEvents: number;
  totalClients: number;
  activePackages: number;
  lowStockItems: number;
  equipmentUtilization: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private orderService: OrderService,
    private clientService: ClientService,
    private packageService: PackageService,
    private equipmentService: EquipmentService
  ) {}

  getMetrics(): Observable<DashboardMetrics> {
    return combineLatest([
      this.orderService.getStats(),
      this.equipmentService.getAll(),
      this.equipmentService.getLowStock(),
    ]).pipe(
      map(([stats, equipment, lowStock]) => {
        const totalUnits = equipment.reduce((s, e) => s + e.totalQuantity, 0);
        const available = equipment.reduce((s, e) => s + e.availableQuantity, 0);
        const utilization =
          totalUnits > 0 ? Math.round(((totalUnits - available) / totalUnits) * 100) : 0;

        return {
          totalOrders: stats.total,
          kitchenPending: stats.kitchenPending,
          kitchenPreparing: stats.kitchenPreparing,
          kitchenReady: stats.kitchenReady,
          logisticsActive: stats.logisticsActive,
          logisticsDelivered: stats.logisticsDelivered,
          todayEvents: stats.todayEvents,
          totalClients: this.clientService.count,
          activePackages: this.packageService.count,
          lowStockItems: lowStock.length,
          equipmentUtilization: utilization,
        };
      })
    );
  }

  getDashboardState(): Observable<{ isLoading: boolean; isUsingFallback: boolean }> {
    return combineLatest([
      this.orderService.getLoadingState(),
      this.orderService.getFallbackStatus(),
      this.equipmentService.getLoadingState(),
      this.equipmentService.getFallbackStatus(),
    ]).pipe(
      map(([orderLoading, orderFallback, equipmentLoading, equipmentFallback]) => ({
        isLoading: orderLoading || equipmentLoading,
        isUsingFallback: orderFallback || equipmentFallback,
      }))
    );
  }
}
