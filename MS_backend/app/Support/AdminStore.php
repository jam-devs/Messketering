<?php

namespace App\Support;

class AdminStore
{
    private string $path;

    public function __construct()
    {
        $this->path = storage_path('app/admin-data.json');
    }

    public function all(): array
    {
        return $this->load();
    }

    public function collection(string $name): array
    {
        $data = $this->load();

        return $data[$name] ?? [];
    }

    public function find(string $name, string $id): ?array
    {
        foreach ($this->collection($name) as $item) {
            if ((string) ($item['id'] ?? '') === (string) $id) {
                return $item;
            }
        }

        return null;
    }

    public function upsert(string $name, array $record, string $prefix): array
    {
        $data = $this->load();
        $collection = $data[$name] ?? [];
        $id = (string) ($record['id'] ?? '');

        if ($id === '') {
            $record['id'] = $this->nextId($prefix, $collection);
            $collection[] = $record;
            $data[$name] = $collection;
            $this->persist($data);

            return $record;
        }

        $updated = false;

        foreach ($collection as $index => $item) {
            if ((string) ($item['id'] ?? '') !== $id) {
                continue;
            }

            $collection[$index] = array_merge($item, $record);
            $updated = true;
            $record = $collection[$index];
            break;
        }

        if (!$updated) {
            $collection[] = $record;
        }

        $data[$name] = $collection;
        $this->persist($data);

        return $record;
    }

    public function delete(string $name, string $id): bool
    {
        $data = $this->load();
        $collection = $data[$name] ?? [];
        $before = count($collection);

        $collection = array_values(array_filter($collection, function (array $item) use ($id) {
            return (string) ($item['id'] ?? '') !== (string) $id;
        }));

        if (count($collection) === $before) {
            return false;
        }

        $data[$name] = $collection;
        $this->persist($data);

        return true;
    }

    private function load(): array
    {
        if (!file_exists($this->path)) {
            $data = $this->seed();
            $this->persist($data);

            return $data;
        }

        $contents = file_get_contents($this->path);
        $decoded = json_decode($contents ?: '', true);

        if (!is_array($decoded)) {
            $data = $this->seed();
            $this->persist($data);

            return $data;
        }

        return array_merge($this->seed(), $decoded);
    }

    private function persist(array $data): void
    {
        file_put_contents(
            $this->path,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    private function nextId(string $prefix, array $collection): string
    {
        $max = 0;

        foreach ($collection as $item) {
            $id = (string) ($item['id'] ?? '');
            if (!str_starts_with($id, $prefix)) {
                continue;
            }

            $numeric = (int) preg_replace('/[^0-9]/', '', substr($id, strlen($prefix)));
            $max = max($max, $numeric);
        }

        return $prefix . ($max + 1);
    }

    private function seed(): array
    {
        $now = date('c');

        return [
            'clients' => [
                ['id' => 'c1', 'name' => 'ABC Corporation', 'email' => 'events@abc.com', 'phone' => '+63 912 345 6789', 'company' => 'ABC Corp', 'address' => 'Makati City', 'notes' => null, 'createdAt' => '2025-01-10T00:00:00+00:00'],
                ['id' => 'c2', 'name' => 'Maria Reyes', 'email' => 'maria.r@email.com', 'phone' => '+63 917 111 2233', 'company' => null, 'address' => 'Quezon City', 'notes' => 'Wedding client', 'createdAt' => '2025-02-15T00:00:00+00:00'],
                ['id' => 'c3', 'name' => 'Greenfield School', 'email' => 'admin@greenfield.edu', 'phone' => '+63 2 8888 9999', 'company' => 'Greenfield School', 'address' => 'Pasig City', 'notes' => null, 'createdAt' => '2025-03-01T00:00:00+00:00'],
                ['id' => 'c4', 'name' => 'TechStart Inc.', 'email' => 'hr@techstart.io', 'phone' => '+63 918 555 6677', 'company' => 'TechStart Inc.', 'address' => null, 'notes' => null, 'createdAt' => '2025-04-20T00:00:00+00:00'],
            ],
            'food_menu' => [
                ['id' => 'f1', 'name' => 'Pork Menudo', 'description' => 'Classic Filipino pork stew with potatoes and bell peppers', 'category' => 'main_dish', 'servingSize' => 'Full tray', 'price' => 2500, 'servesPersons' => 25, 'availability' => 'available', 'imageUrl' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'f2', 'name' => 'Carbonara', 'description' => 'Creamy pasta with bacon and parmesan', 'category' => 'rice_pasta', 'servingSize' => 'Full tray', 'price' => 1800, 'servesPersons' => 15, 'availability' => 'available', 'imageUrl' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'f3', 'name' => 'Leche Flan', 'description' => 'Traditional caramel custard dessert', 'category' => 'dessert', 'servingSize' => 'Platter', 'price' => 1200, 'servesPersons' => 20, 'availability' => 'available', 'imageUrl' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'f4', 'name' => 'Iced Tea Pitcher', 'description' => 'House-blend iced tea', 'category' => 'drinks', 'servingSize' => '4 liters', 'price' => 350, 'servesPersons' => 10, 'availability' => 'available', 'imageUrl' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'f5', 'name' => 'Spring Rolls', 'description' => 'Crispy vegetable lumpia appetizer', 'category' => 'appetizer', 'servingSize' => '50 pieces', 'price' => 900, 'servesPersons' => 25, 'availability' => 'available', 'imageUrl' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'f6', 'name' => 'Java Rice', 'description' => 'Turmeric fried rice', 'category' => 'rice_pasta', 'servingSize' => 'Full tray', 'price' => 800, 'servesPersons' => 20, 'availability' => 'unavailable', 'imageUrl' => null, 'createdAt' => $now, 'updatedAt' => $now],
            ],
            'equipment' => [
                ['id' => 'e1', 'name' => 'Round Table', 'description' => '10-seater banquet round table', 'category' => 'tables', 'totalQuantity' => 40, 'availableQuantity' => 40, 'pricePerUnit' => 300, 'status' => 'available', 'condition' => 'good', 'notes' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'e2', 'name' => 'Monoblock Chair', 'description' => 'Standard white monoblock chair', 'category' => 'chairs', 'totalQuantity' => 300, 'availableQuantity' => 300, 'pricePerUnit' => 25, 'status' => 'available', 'condition' => 'good', 'notes' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'e3', 'name' => 'Patio Umbrella', 'description' => 'Outdoor shade umbrella', 'category' => 'umbrellas', 'totalQuantity' => 15, 'availableQuantity' => 15, 'pricePerUnit' => 150, 'status' => 'available', 'condition' => 'good', 'notes' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'e4', 'name' => 'Spoon & Fork Set', 'description' => 'Cutlery set per guest', 'category' => 'utensils', 'totalQuantity' => 500, 'availableQuantity' => 500, 'pricePerUnit' => 15, 'status' => 'available', 'condition' => 'good', 'notes' => null, 'createdAt' => $now, 'updatedAt' => $now],
                ['id' => 'e5', 'name' => 'White Table Linen', 'description' => 'Table cover linen', 'category' => 'linens', 'totalQuantity' => 50, 'availableQuantity' => 50, 'pricePerUnit' => 80, 'status' => 'available', 'condition' => 'fair', 'notes' => null, 'createdAt' => $now, 'updatedAt' => $now],
            ],
            'packages' => [
                [
                    'id' => 'p1', 'name' => 'Executive Buffet', 'description' => 'Premium buffet for corporate events', 'pricePerHead' => 850,
                    'basePrice' => 0, 'minGuests' => 30, 'maxGuests' => 200, 'goodForPersons' => 50,
                    'menuItems' => [], 'foodSelections' => [], 'equipmentSelections' => [], 'includedEquipment' => [], 'includesEquipment' => true,
                    'amenities' => [], 'imageUrl' => null, 'isActive' => true, 'foodSubtotal' => 0, 'equipmentSubtotal' => 0, 'totalPrice' => 0,
                    'createdAt' => $now, 'updatedAt' => $now,
                ],
                [
                    'id' => 'p2', 'name' => 'Garden Party Package', 'description' => 'Outdoor catering package', 'pricePerHead' => 650,
                    'basePrice' => 0, 'minGuests' => 20, 'maxGuests' => 100, 'goodForPersons' => 40,
                    'menuItems' => [], 'foodSelections' => [], 'equipmentSelections' => [], 'includedEquipment' => [], 'includesEquipment' => true,
                    'amenities' => [], 'imageUrl' => null, 'isActive' => true, 'foodSubtotal' => 0, 'equipmentSubtotal' => 0, 'totalPrice' => 0,
                    'createdAt' => $now, 'updatedAt' => $now,
                ],
            ],
            'orders' => [
                [
                    'id' => 'o1', 'bookingRef' => 'CD-2026-001', 'clientId' => 'c1', 'clientName' => 'ABC Corporation', 'packageId' => 'p1', 'packageName' => 'Executive Buffet',
                    'eventName' => 'Q1 Town Hall Lunch', 'eventDate' => '2026-05-28T00:00:00+00:00', 'eventTime' => '11:30', 'venue' => 'ABC Corp HQ, Makati', 'guestCount' => 80,
                    'kitchenStatus' => 'preparing', 'logisticsStatus' => 'not_started', 'equipmentAllocations' => [
                        ['equipmentId' => 'e1', 'equipmentName' => 'Round Table', 'category' => 'tables', 'quantity' => 8],
                        ['equipmentId' => 'e2', 'equipmentName' => 'Monoblock Chair', 'category' => 'chairs', 'quantity' => 80],
                    ], 'isCustom' => false, 'isDraft' => false, 'orderStatus' => 'preparing', 'customFoodItems' => [], 'customEquipmentItems' => [],
                    'subtotal' => 68000, 'totalAmount' => 68000, 'notes' => null, 'kitchenNotes' => null, 'logisticsNotes' => null,
                    'assignedKitchenStaff' => 'Maria Santos', 'assignedLogisticsStaff' => null, 'createdAt' => '2026-05-10T00:00:00+00:00', 'updatedAt' => '2026-05-24T00:00:00+00:00',
                ],
                [
                    'id' => 'o2', 'bookingRef' => 'CD-2026-002', 'clientId' => 'c2', 'clientName' => 'Maria Reyes', 'packageId' => 'p2', 'packageName' => 'Garden Party Package',
                    'eventName' => 'Reyes-Santos Wedding', 'eventDate' => '2026-06-15T00:00:00+00:00', 'eventTime' => '18:00', 'venue' => 'Garden Pavilion, Tagaytay', 'guestCount' => 150,
                    'kitchenStatus' => 'pending', 'logisticsStatus' => 'not_started', 'equipmentAllocations' => [
                        ['equipmentId' => 'e1', 'equipmentName' => 'Round Table', 'category' => 'tables', 'quantity' => 15],
                        ['equipmentId' => 'e2', 'equipmentName' => 'Monoblock Chair', 'category' => 'chairs', 'quantity' => 150],
                    ], 'isCustom' => false, 'isDraft' => false, 'orderStatus' => 'pending', 'customFoodItems' => [], 'customEquipmentItems' => [],
                    'subtotal' => 180000, 'totalAmount' => 180000, 'notes' => null, 'kitchenNotes' => null, 'logisticsNotes' => null,
                    'assignedKitchenStaff' => null, 'assignedLogisticsStaff' => null, 'createdAt' => '2026-05-20T00:00:00+00:00', 'updatedAt' => '2026-05-20T00:00:00+00:00',
                ],
                [
                    'id' => 'o3', 'bookingRef' => 'CD-2026-003', 'clientId' => 'c3', 'clientName' => 'Greenfield School', 'packageId' => 'p2', 'packageName' => 'Garden Party Package',
                    'eventName' => 'Sports Day 2026', 'eventDate' => '2026-05-30T00:00:00+00:00', 'eventTime' => '07:00', 'venue' => 'Greenfield School Grounds', 'guestCount' => 200,
                    'kitchenStatus' => 'ready_for_transport', 'logisticsStatus' => 'preparing_for_delivery', 'equipmentAllocations' => [
                        ['equipmentId' => 'e4', 'equipmentName' => 'Spoon & Fork Set', 'category' => 'utensils', 'quantity' => 200],
                    ], 'isCustom' => false, 'isDraft' => false, 'orderStatus' => 'ready_for_transport',
                    'customFoodItems' => [], 'customEquipmentItems' => [], 'subtotal' => 70000, 'totalAmount' => 70000,
                    'notes' => null, 'kitchenNotes' => null, 'logisticsNotes' => null,
                    'assignedKitchenStaff' => null, 'assignedLogisticsStaff' => null, 'createdAt' => '2026-05-05T00:00:00+00:00', 'updatedAt' => '2026-05-25T00:00:00+00:00',
                ],
                [
                    'id' => 'o4', 'bookingRef' => 'CD-2026-004', 'clientId' => 'c4', 'clientName' => 'TechStart Inc.', 'packageId' => '', 'packageName' => 'Custom Order',
                    'eventName' => 'Product Launch (Draft)', 'eventDate' => '2026-06-10T00:00:00+00:00', 'eventTime' => '16:00', 'venue' => 'BGC Rooftop', 'guestCount' => 60,
                    'kitchenStatus' => 'pending', 'logisticsStatus' => 'not_started', 'equipmentAllocations' => [], 'isCustom' => true, 'isDraft' => true, 'orderStatus' => 'pending',
                    'customFoodItems' => [['id' => 'f1', 'name' => 'Premium canapés', 'quantity' => 60, 'unitPrice' => 120]],
                    'customEquipmentItems' => [['id' => 'eq1', 'name' => 'LED uplighting', 'quantity' => 4, 'unitPrice' => 2500]],
                    'subtotal' => 17200, 'totalAmount' => 17200, 'notes' => 'Awaiting client confirmation', 'kitchenNotes' => null, 'logisticsNotes' => null,
                    'assignedKitchenStaff' => null, 'assignedLogisticsStaff' => null, 'createdAt' => '2026-05-26T00:00:00+00:00', 'updatedAt' => '2026-05-26T00:00:00+00:00',
                ],
            ],
        ];
    }
}