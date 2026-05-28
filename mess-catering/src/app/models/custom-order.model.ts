export type ManualOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_transport'
  | 'completed';

export const MANUAL_ORDER_STATUS_LABELS: Record<ManualOrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_transport: 'Ready for Transport',
  completed: 'Completed',
};

export interface CustomLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ManualOrderDraft {
  clientId?: string;
  clientName: string;
  eventName: string;
  eventDate: Date;
  eventTime: string;
  venue: string;
  guestCount: number;
  packageId?: string;
  packageName?: string;
  foodItems: CustomLineItem[];
  equipmentItems: CustomLineItem[];
  notes?: string;
  orderStatus: ManualOrderStatus;
  isDraft: boolean;
}
