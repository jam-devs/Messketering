import {
  KitchenStatus,
  LogisticsStatus,
  KITCHEN_STATUS_LABELS,
  LOGISTICS_STATUS_LABELS,
} from '../../models/order.model';
import {
  KITCHEN_STATUS_COLORS,
  LOGISTICS_STATUS_COLORS,
  KITCHEN_STATUS_FLOW,
  LOGISTICS_STATUS_FLOW,
} from '../../core/constants/status.constants';

export function getKitchenLabel(s: KitchenStatus): string {
  return KITCHEN_STATUS_LABELS[s];
}

export function getLogisticsLabel(s: LogisticsStatus): string {
  return LOGISTICS_STATUS_LABELS[s];
}

export function getKitchenColor(s: KitchenStatus): string {
  return KITCHEN_STATUS_COLORS[s];
}

export function getLogisticsColor(s: LogisticsStatus): string {
  return LOGISTICS_STATUS_COLORS[s];
}

export function getNextKitchenStatus(current: KitchenStatus): KitchenStatus | null {
  const idx = KITCHEN_STATUS_FLOW.indexOf(current);
  return idx >= 0 && idx < KITCHEN_STATUS_FLOW.length - 1 ? KITCHEN_STATUS_FLOW[idx + 1] : null;
}

export function getNextLogisticsStatus(current: LogisticsStatus): LogisticsStatus | null {
  if (current === 'not_started') return 'preparing_for_delivery';
  const idx = LOGISTICS_STATUS_FLOW.indexOf(current);
  return idx >= 0 && idx < LOGISTICS_STATUS_FLOW.length - 1
    ? LOGISTICS_STATUS_FLOW[idx + 1]
    : null;
}
