<?php

namespace App\Http\Controllers;

use App\Support\AdminStore;
use Illuminate\Http\Request;

class AdminDataController extends ApiController
{
    public function __construct(private AdminStore $store)
    {
    }

    public function index(Request $request, string $resource)
    {
        $collection = $this->collectionName($resource);

        if (!$collection) {
            return $this->notFound('Resource not found.');
        }

        return response()->json([
            'status' => 'success',
            'data' => $this->store->collection($collection),
        ]);
    }

    public function show(Request $request, string $resource, string $id)
    {
        $collection = $this->collectionName($resource);

        if (!$collection) {
            return $this->notFound('Resource not found.');
        }

        $item = $this->store->find($collection, $id);

        if (!$item) {
            return $this->notFound($this->missingMessage($collection));
        }

        return response()->json([
            'status' => 'success',
            'data' => $item,
        ]);
    }

    public function store(Request $request, string $resource)
    {
        $collection = $this->collectionName($resource);

        if (!$collection) {
            return $this->notFound('Resource not found.');
        }

        if ($response = $this->validateRequest($request, $this->rulesFor($collection, 'create'))) {
            return $response;
        }

        $record = $this->normalizePayload($collection, $request->all());
        $created = $this->store->upsert($collection, $record, $this->prefixFor($collection));

        return response()->json([
            'status' => 'success',
            'data' => $created,
        ], 201);
    }

    public function update(Request $request, string $resource, string $id)
    {
        $collection = $this->collectionName($resource);

        if (!$collection) {
            return $this->notFound('Resource not found.');
        }

        if ($response = $this->validateRequest($request, $this->rulesFor($collection, 'update'))) {
            return $response;
        }

        $existing = $this->store->find($collection, $id);

        if (!$existing) {
            return $this->notFound($this->missingMessage($collection));
        }

        $record = $this->normalizePayload($collection, array_merge($existing, $request->all()));
        $record['id'] = $id;
        $updated = $this->store->upsert($collection, $record, $this->prefixFor($collection));

        return response()->json([
            'status' => 'success',
            'data' => $updated,
        ]);
    }

    public function destroy(Request $request, string $resource, string $id)
    {
        $collection = $this->collectionName($resource);

        if (!$collection) {
            return $this->notFound('Resource not found.');
        }

        if (!$this->store->delete($collection, $id)) {
            return $this->notFound($this->missingMessage($collection));
        }

        return response()->json([
            'status' => 'success',
            'message' => $this->deletedMessage($collection),
        ]);
    }

    public function updateOrderStatus(Request $request, string $id)
    {
        return $this->updateOrderField($request, $id, 'orderStatus');
    }

    public function updateKitchenStatus(Request $request, string $id)
    {
        return $this->updateOrderField($request, $id, 'kitchenStatus');
    }

    public function updateLogisticsStatus(Request $request, string $id)
    {
        return $this->updateOrderField($request, $id, 'logisticsStatus');
    }

    private function updateOrderField(Request $request, string $id, string $field)
    {
        if ($response = $this->validateRequest($request, [$field => 'required|string'])) {
            return $response;
        }

        $order = $this->store->find('orders', $id);

        if (!$order) {
            return $this->notFound('Order not found.');
        }

        $order[$field] = $request->input($field);
        $order['updatedAt'] = date('c');

        if ($field === 'kitchenStatus' && $order[$field] === 'ready_for_transport' && ($order['logisticsStatus'] ?? '') === 'not_started') {
            $order['logisticsStatus'] = 'preparing_for_delivery';
        }

        if ($field === 'kitchenStatus' && $order[$field] === 'completed') {
            $order['orderStatus'] = 'completed';
        }

        if ($field === 'orderStatus' && $order[$field] === 'completed') {
            $order['kitchenStatus'] = 'completed';
        }

        $updated = $this->store->upsert('orders', $order, 'o');

        return response()->json([
            'status' => 'success',
            'data' => $updated,
        ]);
    }

    private function collectionName(string $resource): ?string
    {
        return match ($resource) {
            'clients' => 'clients',
            'food-menu' => 'food_menu',
            'equipment' => 'equipment',
            'packages' => 'packages',
            'orders' => 'orders',
            default => null,
        };
    }

    private function prefixFor(string $collection): string
    {
        return match ($collection) {
            'clients' => 'c',
            'food_menu' => 'f',
            'equipment' => 'e',
            'packages' => 'p',
            'orders' => 'o',
            default => 'x',
        };
    }

    private function rulesFor(string $collection, string $mode): array
    {
        return match ($collection) {
            'clients' => [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:50',
                'company' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:500',
                'notes' => 'nullable|string',
            ],
            'food_menu' => [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|string|max:50',
                'servingSize' => 'required|string|max:100',
                'price' => 'required|numeric|min:0',
                'servesPersons' => 'required|integer|min:1',
                'availability' => 'required|string|in:available,unavailable,archived',
                'imageUrl' => 'nullable|string',
            ],
            'equipment' => [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|string|max:50',
                'totalQuantity' => 'required|integer|min:0',
                'availableQuantity' => 'nullable|integer|min:0',
                'pricePerUnit' => 'required|numeric|min:0',
                'status' => 'required|string|in:available,unavailable,archived',
                'condition' => 'required|string|in:good,fair,maintenance',
                'notes' => 'nullable|string',
            ],
            'packages' => [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'pricePerHead' => 'required|numeric|min:0',
                'basePrice' => 'required|numeric|min:0',
                'minGuests' => 'required|integer|min:1',
                'maxGuests' => 'required|integer|min:1',
                'goodForPersons' => 'required|integer|min:1',
                'menuItems' => 'nullable|array',
                'foodSelections' => 'nullable|array',
                'equipmentSelections' => 'nullable|array',
                'includedEquipment' => 'nullable|array',
                'includesEquipment' => 'boolean',
                'amenities' => 'nullable|array',
                'imageUrl' => 'nullable|string',
                'isActive' => 'boolean',
            ],
            'orders' => [
                'bookingRef' => 'required|string|max:50',
                'clientId' => 'required|string|max:50',
                'clientName' => 'required|string|max:255',
                'packageId' => 'nullable|string|max:50',
                'packageName' => 'required|string|max:255',
                'eventName' => 'required|string|max:255',
                'eventDate' => 'required|date',
                'eventTime' => 'required|string|max:20',
                'venue' => 'required|string|max:255',
                'guestCount' => 'required|integer|min:1',
                'kitchenStatus' => 'required|string',
                'logisticsStatus' => 'required|string',
                'equipmentAllocations' => 'nullable|array',
                'isCustom' => 'boolean',
                'isDraft' => 'boolean',
                'orderStatus' => 'required|string',
                'customFoodItems' => 'nullable|array',
                'customEquipmentItems' => 'nullable|array',
                'subtotal' => 'required|numeric|min:0',
                'totalAmount' => 'required|numeric|min:0',
                'notes' => 'nullable|string',
                'kitchenNotes' => 'nullable|string',
                'logisticsNotes' => 'nullable|string',
                'assignedKitchenStaff' => 'nullable|string',
                'assignedLogisticsStaff' => 'nullable|string',
            ],
            default => [],
        };
    }

    private function normalizePayload(string $collection, array $payload): array
    {
        $now = date('c');

        return match ($collection) {
            'clients' => [
                'id' => $payload['id'] ?? null,
                'name' => trim((string) ($payload['name'] ?? '')),
                'email' => trim((string) ($payload['email'] ?? '')),
                'phone' => trim((string) ($payload['phone'] ?? '')),
                'company' => $payload['company'] !== '' ? ($payload['company'] ?? null) : null,
                'address' => $payload['address'] !== '' ? ($payload['address'] ?? null) : null,
                'notes' => $payload['notes'] !== '' ? ($payload['notes'] ?? null) : null,
                'createdAt' => $payload['createdAt'] ?? $now,
            ],
            'food_menu' => [
                'id' => $payload['id'] ?? null,
                'name' => trim((string) ($payload['name'] ?? '')),
                'description' => $payload['description'] ?? null,
                'category' => trim((string) ($payload['category'] ?? 'main_dish')),
                'servingSize' => trim((string) ($payload['servingSize'] ?? 'Full tray')),
                'price' => (float) ($payload['price'] ?? 0),
                'servesPersons' => (int) ($payload['servesPersons'] ?? 1),
                'availability' => $payload['availability'] ?? 'available',
                'imageUrl' => $payload['imageUrl'] ?? null,
                'createdAt' => $payload['createdAt'] ?? $now,
                'updatedAt' => $now,
            ],
            'equipment' => [
                'id' => $payload['id'] ?? null,
                'name' => trim((string) ($payload['name'] ?? '')),
                'description' => $payload['description'] ?? null,
                'category' => trim((string) ($payload['category'] ?? 'other')),
                'totalQuantity' => (int) ($payload['totalQuantity'] ?? 0),
                'availableQuantity' => isset($payload['availableQuantity']) ? (int) $payload['availableQuantity'] : (int) ($payload['totalQuantity'] ?? 0),
                'pricePerUnit' => (float) ($payload['pricePerUnit'] ?? 0),
                'status' => $payload['status'] ?? 'available',
                'condition' => $payload['condition'] ?? 'good',
                'notes' => $payload['notes'] ?? null,
                'createdAt' => $payload['createdAt'] ?? $now,
                'updatedAt' => $now,
            ],
            'packages' => [
                'id' => $payload['id'] ?? null,
                'name' => trim((string) ($payload['name'] ?? '')),
                'description' => $payload['description'] ?? null,
                'pricePerHead' => (float) ($payload['pricePerHead'] ?? 0),
                'basePrice' => (float) ($payload['basePrice'] ?? 0),
                'minGuests' => (int) ($payload['minGuests'] ?? 1),
                'maxGuests' => (int) ($payload['maxGuests'] ?? 1),
                'goodForPersons' => (int) ($payload['goodForPersons'] ?? 1),
                'menuItems' => array_values($payload['menuItems'] ?? []),
                'foodSelections' => array_values($payload['foodSelections'] ?? []),
                'equipmentSelections' => array_values($payload['equipmentSelections'] ?? []),
                'includedEquipment' => array_values($payload['includedEquipment'] ?? []),
                'includesEquipment' => (bool) ($payload['includesEquipment'] ?? !empty($payload['equipmentSelections'] ?? [])),
                'amenities' => array_values($payload['amenities'] ?? []),
                'imageUrl' => $payload['imageUrl'] ?? null,
                'isActive' => (bool) ($payload['isActive'] ?? false),
                'foodSubtotal' => (float) ($payload['foodSubtotal'] ?? 0),
                'equipmentSubtotal' => (float) ($payload['equipmentSubtotal'] ?? 0),
                'totalPrice' => (float) ($payload['totalPrice'] ?? 0),
                'createdAt' => $payload['createdAt'] ?? $now,
                'updatedAt' => $now,
            ],
            'orders' => [
                'id' => $payload['id'] ?? null,
                'bookingRef' => trim((string) ($payload['bookingRef'] ?? '')),
                'clientId' => trim((string) ($payload['clientId'] ?? '')),
                'clientName' => trim((string) ($payload['clientName'] ?? '')),
                'packageId' => (string) ($payload['packageId'] ?? ''),
                'packageName' => trim((string) ($payload['packageName'] ?? '')),
                'eventName' => trim((string) ($payload['eventName'] ?? '')),
                'eventDate' => $payload['eventDate'] ?? $now,
                'eventTime' => trim((string) ($payload['eventTime'] ?? '12:00')),
                'venue' => trim((string) ($payload['venue'] ?? '')),
                'guestCount' => (int) ($payload['guestCount'] ?? 1),
                'kitchenStatus' => $payload['kitchenStatus'] ?? 'pending',
                'logisticsStatus' => $payload['logisticsStatus'] ?? 'not_started',
                'equipmentAllocations' => array_values($payload['equipmentAllocations'] ?? []),
                'isCustom' => (bool) ($payload['isCustom'] ?? false),
                'isDraft' => (bool) ($payload['isDraft'] ?? false),
                'orderStatus' => $payload['orderStatus'] ?? 'pending',
                'customFoodItems' => array_values($payload['customFoodItems'] ?? []),
                'customEquipmentItems' => array_values($payload['customEquipmentItems'] ?? []),
                'subtotal' => (float) ($payload['subtotal'] ?? 0),
                'totalAmount' => (float) ($payload['totalAmount'] ?? 0),
                'notes' => $payload['notes'] ?? null,
                'kitchenNotes' => $payload['kitchenNotes'] ?? null,
                'logisticsNotes' => $payload['logisticsNotes'] ?? null,
                'assignedKitchenStaff' => $payload['assignedKitchenStaff'] ?? null,
                'assignedLogisticsStaff' => $payload['assignedLogisticsStaff'] ?? null,
                'createdAt' => $payload['createdAt'] ?? $now,
                'updatedAt' => $now,
            ],
            default => $payload,
        };
    }

    private function missingMessage(string $collection): string
    {
        return match ($collection) {
            'clients' => 'Client not found.',
            'food_menu' => 'Food item not found.',
            'equipment' => 'Equipment not found.',
            'packages' => 'Package not found.',
            'orders' => 'Order not found.',
            default => 'Record not found.',
        };
    }

    private function deletedMessage(string $collection): string
    {
        return match ($collection) {
            'clients' => 'Client deleted.',
            'food_menu' => 'Food item deleted.',
            'equipment' => 'Equipment deleted.',
            'packages' => 'Package deleted.',
            'orders' => 'Order deleted.',
            default => 'Record deleted.',
        };
    }

    private function notFound(string $message)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], 404);
    }
}