import { FoodSelection } from './food-menu.model';
import { EquipmentSelection } from './equipment.model';

export interface CateringPackage {
  id: string;
  name: string;
  description: string;
  pricePerHead: number;
  basePrice: number;
  minGuests: number;
  maxGuests: number;
  goodForPersons: number;
  /** @deprecated display names — use foodSelections */
  menuItems: string[];
  foodSelections: FoodSelection[];
  equipmentSelections: EquipmentSelection[];
  includedEquipment: string[];
  includesEquipment: boolean;
  amenities: string[];
  imageUrl?: string;
  isActive: boolean;
  foodSubtotal: number;
  equipmentSubtotal: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
