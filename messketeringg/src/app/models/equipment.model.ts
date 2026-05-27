export type EquipmentCategory = 'tables' | 'chairs' | 'umbrellas' | 'utensils' | 'linens' | 'other';

export type EquipmentStatus = 'available' | 'unavailable' | 'archived';

export interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  /** Total owned quantity */
  totalQuantity: number;
  /** Currently rentable (after reservations) */
  availableQuantity: number;
  /** Price per unit in PHP */
  pricePerUnit: number;
  status: EquipmentStatus;
  condition: 'good' | 'fair' | 'maintenance';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentAllocation {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
}

export interface EquipmentSelection {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  lineTotal: number;
}
