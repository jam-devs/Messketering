export interface ApiListResponse<T> {
  status: string;
  data: T[];
}

export interface ApiItemResponse<T> {
  status: string;
  data: T;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  category: string;
  is_available: boolean;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Payment {
  id: number;
  amount: string;
  payment_method: string;
  paid_at: string | null;
  notes: string | null;
}

export interface Order {
  id: number;
  customer_name: string;
  contact_number: string;
  address: string | null;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  status: string;
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
}

export interface PendingOrderItem {
  menu_item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface MenuItemPayload {
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
}

export interface CreateOrderPayload {
  customer_name: string;
  contact_number: string;
  address: string;
  delivery_date: string | null;
  notes: string;
  items: Array<{
    menu_item_id: number;
    quantity: number;
  }>;
}

export interface PaymentPayload {
  amount: number;
  payment_method: string;
  notes: string;
}

export interface Customer {
  id: number;
  name: string;
  contact_number: string;
  address: string | null;
  created_at: string;
  order_count: number;
  total_spent: string;
  last_order_at: string | null;
}

export interface CustomerOrder {
  id: number;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  status: string;
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
}

export interface CustomerDetail extends Customer {
  paid_amount: string;
  balance_amount: string;
  orders: CustomerOrder[];
}

export interface CustomerPayload {
  name: string;
  contact_number: string;
  address: string;
}

export interface DashboardSummary {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_sales: string;
  paid_amount: string;
  unpaid_balance: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  status: string;
  token: string;
  user: AdminUser;
}

export interface ReportsSummary {
  sales_summary: {
    total_sales: string;
    paid_amount: string;
    unpaid_balance: string;
  };
  orders_by_status: Array<{
    status: string;
    count: number;
  }>;
  best_selling_items: Array<{
    name: string;
    quantity_sold: number;
    sales_total: string;
  }>;
  payments_by_method: Array<{
    payment_method: string;
    total_amount: string;
    payment_count: number;
  }>;
  unpaid_orders: Array<{
    id: number;
    customer_name: string;
    total_amount: string;
    paid_amount: string;
    balance_amount: string;
  }>;
}

export interface ScheduleItem {
  name: string;
  quantity: number;
}

export interface ScheduleEvent {
  id: number;
  status: string;
  delivery_date: string;
  total_amount: string;
  notes: string | null;
  customer_name: string;
  contact_number: string;
  address: string | null;
  items: ScheduleItem[];
}

export interface GmailStatus {
  connected: boolean;
  expires_at: number | null;
  scope: string | null;
  email_address: string | null;
}

export interface GmailAuthPayload {
  auth_url: string;
  state: string;
}

export interface GmailMessage {
  id: string;
  thread_id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  internal_date: string;
}
