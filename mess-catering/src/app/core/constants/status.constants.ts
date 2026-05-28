import { KitchenStatus, LogisticsStatus } from '../../models/order.model';

export const KITCHEN_STATUS_FLOW: KitchenStatus[] = [
  'pending',
  'preparing',
  'ready_for_transport',
  'completed',
];

export const LOGISTICS_STATUS_FLOW: LogisticsStatus[] = [
  'not_started',
  'preparing_for_delivery',
  'out_for_delivery',
  'delivered',
  'returned',
];

export const KITCHEN_STATUS_COLORS: Record<KitchenStatus, string> = {
  pending: '#9e9e9e',
  preparing: '#757575',
  ready_for_transport: '#c4a962',
  completed: '#5a5a5a',
};

export const LOGISTICS_STATUS_COLORS: Record<LogisticsStatus, string> = {
  not_started: '#bdbdbd',
  preparing_for_delivery: '#8d8d8d',
  out_for_delivery: '#6b6b6b',
  delivered: '#4a4a4a',
  returned: '#c4a962',
};
