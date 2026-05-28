import { EquipmentAllocation } from './equipment.model';
import { CustomLineItem, ManualOrderStatus } from './custom-order.model';

export type KitchenStatus = 'pending' | 'preparing' | 'ready_for_transport' | 'completed';

export type LogisticsStatus =
  | 'not_started'
  | 'preparing_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned';

export const KITCHEN_STATUS_LABELS: Record<KitchenStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready_for_transport: 'Ready for Transport',
  completed: 'Completed',
};

export const LOGISTICS_STATUS_LABELS: Record<LogisticsStatus, string> = {
  not_started: 'Not Started',
  preparing_for_delivery: 'Preparing for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  returned: 'Returned',
};

export interface Order {
  id: string;
  bookingRef: string;
  clientId: string;
  clientName: string;
  packageId: string;
  packageName: string;
  eventName: string;
  eventDate: Date;
  eventTime: string;
  venue: string;
  guestCount: number;
  kitchenStatus: KitchenStatus;
  logisticsStatus: LogisticsStatus;
  equipmentAllocations: EquipmentAllocation[];
  /** Custom / manual order fields */
  isCustom: boolean;
  isDraft: boolean;
  orderStatus: ManualOrderStatus;
  customFoodItems: CustomLineItem[];
  customEquipmentItems: CustomLineItem[];
  subtotal: number;
  totalAmount: number;
  notes?: string;
  kitchenNotes?: string;
  logisticsNotes?: string;
  assignedKitchenStaff?: string;
  assignedLogisticsStaff?: string;
  createdAt: Date;
  updatedAt: Date;
}
