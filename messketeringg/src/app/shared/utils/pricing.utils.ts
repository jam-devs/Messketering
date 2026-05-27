import { FoodSelection } from '../../models/food-menu.model';
import { EquipmentSelection } from '../../models/equipment.model';
import { CustomLineItem } from '../../models/custom-order.model';

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPhp(amount: number): string {
  return phpFormatter.format(amount);
}

export function foodLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

export function equipmentLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

export function sumFoodSelections(items: FoodSelection[]): number {
  return items.reduce((s, i) => s + i.lineTotal, 0);
}

export function sumEquipmentSelections(items: EquipmentSelection[]): number {
  return items.reduce((s, i) => s + i.lineTotal, 0);
}

export function sumCustomLines(items: CustomLineItem[]): number {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

export interface PriceBreakdown {
  foodSubtotal: number;
  equipmentSubtotal: number;
  packageBase: number;
  total: number;
}

export function buildBreakdown(
  foodSubtotal: number,
  equipmentSubtotal: number,
  packageBase = 0
): PriceBreakdown {
  return {
    foodSubtotal,
    equipmentSubtotal,
    packageBase,
    total: foodSubtotal + equipmentSubtotal + packageBase,
  };
}
