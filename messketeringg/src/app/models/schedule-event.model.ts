import { KitchenStatus, LogisticsStatus } from './order.model';

export interface ScheduleEvent {
  id: string;
  orderId: string;
  bookingRef: string;
  title: string;
  clientName: string;
  eventDate: Date;
  eventTime: string;
  venue: string;
  guestCount: number;
  kitchenStatus: KitchenStatus;
  logisticsStatus: LogisticsStatus;
}
