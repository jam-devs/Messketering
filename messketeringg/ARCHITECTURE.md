# CaterDash — Centralized Admin Architecture

## Master Data Modules

### Food Menu Management (`/admin/food-menu`)
Master catalog for all foods. Prices are in **PHP (₱)** per serving size (e.g. Pork Menudo — ₱2,500 — good for 25 persons).

| Field | Description |
|-------|-------------|
| name, description, category | Main Dish, Dessert, Drinks, etc. |
| servingSize, price, servesPersons | Pricing scales by persons served |
| availability | available / unavailable / archived |
| imageUrl | Optional upload |

Unavailable/archived foods are **hidden** from package builder and manual order dropdowns.

### Equipment Inventory (`/admin/equipment`)
| Field | Description |
|-------|-------------|
| name, description, category | |
| totalQuantity, availableQuantity | Adjust +/- for purchases or damage |
| pricePerUnit | PHP per unit (e.g. Monoblock Chair ₱25) |
| status | available / unavailable / archived |

## Dropdown-Driven Workflows

- **Manual Custom Order** — `app-food-line-picker` + `app-equipment-line-picker` (searchable mat-select, stock checks)
- **Package Create/Edit** — same pickers inside dialog; auto-calculates food + equipment + total

## Pricing (`pricing.utils.ts`)

```
Food line total = unitPrice × quantity
Equipment line total = pricePerUnit × quantity
Order/Package total = foodSubtotal + equipmentSubtotal + optional package base
```

Display: `currency:'PHP':'symbol-narrow'`

## Suggested Database Schema

```sql
food_menu (id, name, description, category, serving_size, price_php, serves_persons, availability, image_url)
equipment (id, name, description, category, total_qty, price_per_unit_php, status)
package_food_lines (package_id, food_id, quantity)
package_equipment_lines (package_id, equipment_id, quantity)
order_food_lines (order_id, food_id, quantity, unit_price, line_total)
order_equipment_lines (order_id, equipment_id, quantity, unit_price, line_total)
```

## Sidebar

Main: Overview · Orders · **Food Menu** · Packages · Equipment · Clients · Schedule  
Operations: Kitchen · Logistics · Reports

## Run

```bash
npm start
```

Login: `admin@caterdash.com` / `admin123`
