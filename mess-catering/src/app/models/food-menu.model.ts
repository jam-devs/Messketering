export type FoodCategory =
  | 'main_dish'
  | 'dessert'
  | 'drinks'
  | 'appetizer'
  | 'rice_pasta'
  | 'others';

export type FoodAvailability = 'available' | 'unavailable' | 'archived';

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  main_dish: 'Main Dish',
  dessert: 'Dessert',
  drinks: 'Drinks',
  appetizer: 'Appetizer',
  rice_pasta: 'Rice/Pasta',
  others: 'Others',
};

export interface FoodMenuItem {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  servingSize: string;
  /** Price in PHP for one serving (covers servesPersons) */
  price: number;
  servesPersons: number;
  availability: FoodAvailability;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodSelection {
  foodId: string;
  foodName: string;
  category: FoodCategory;
  servingSize: string;
  servesPersons: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
