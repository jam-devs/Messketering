<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends ApiController
{
    public function index(Request $request)
    {
        $orders = DB::table('orders')
            ->join('customers', 'orders.customer_id', '=', 'customers.id')
            ->select(
                'orders.id',
                'orders.total_amount',
                'orders.status',
                'orders.delivery_date',
                'orders.notes',
                'orders.created_at',
                'customers.name as customer_name',
                'customers.contact_number',
                'customers.address'
            )
            ->orderByDesc('orders.created_at')
            ->get();

        foreach ($orders as $order) {
            $order->items = DB::table('order_items')
                ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                ->where('order_items.order_id', $order->id)
                ->select(
                    'menu_items.name',
                    'order_items.quantity',
                    'order_items.unit_price',
                    'order_items.line_total'
                )
                ->get();

            $order->payments = DB::table('payments')
                ->where('order_id', $order->id)
                ->orderByDesc('paid_at')
                ->get();

            $paidAmount = (float) DB::table('payments')
                ->where('order_id', $order->id)
                ->sum('amount');

            $order->paid_amount = number_format($paidAmount, 2, '.', '');
            $order->balance_amount = number_format(max(0, (float) $order->total_amount - $paidAmount), 2, '.', '');
        }

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    public function store(Request $request)
    {
        if ($response = $this->validateRequest($request, [
            'customer_name' => 'required|string|max:255',
            'contact_number' => 'required|string|max:50',
            'address' => 'nullable|string|max:500',
            'delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ])) {
            return $response;
        }

        $items = $request->input('items', []);

        return DB::transaction(function () use ($request, $items) {
            $customerId = DB::table('customers')->insertGetId([
                'name' => trim($request->input('customer_name')),
                'contact_number' => trim($request->input('contact_number')),
                'address' => $request->input('address'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $totalAmount = 0;
            $preparedItems = [];

            foreach ($items as $item) {
                $menuItem = DB::table('menu_items')->where('id', $item['menu_item_id'])->first();
                $quantity = (int) $item['quantity'];
                $unitPrice = (float) $menuItem->price;
                $lineTotal = $unitPrice * $quantity;
                $totalAmount += $lineTotal;

                $preparedItems[] = [
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ];
            }

            $orderId = DB::table('orders')->insertGetId([
                'customer_id' => $customerId,
                'total_amount' => $totalAmount,
                'status' => 'Pending',
                'delivery_date' => $request->input('delivery_date'),
                'notes' => $request->input('notes'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            foreach ($preparedItems as $preparedItem) {
                $preparedItem['order_id'] = $orderId;
                DB::table('order_items')->insert($preparedItem);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Order created.',
                'data' => ['id' => $orderId],
            ], 201);
        });
    }

    public function updateStatus(Request $request, $id)
    {
        $allowedStatuses = [
            'Pending',
            'Confirmed',
            'Preparing',
            'Out for Delivery',
            'Completed',
            'Cancelled',
        ];

        if ($response = $this->validateRequest($request, [
            'status' => 'required|string|in:' . implode(',', $allowedStatuses),
        ])) {
            return $response;
        }

        $updated = DB::table('orders')->where('id', $id)->update([
            'status' => $request->input('status'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        if (!$updated) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Order status updated.',
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $order = DB::table('orders')->where('id', $id)->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found.',
            ], 404);
        }

        DB::table('orders')->where('id', $id)->delete();

        $customerHasOrders = DB::table('orders')
            ->where('customer_id', $order->customer_id)
            ->exists();

        if (!$customerHasOrders) {
            DB::table('customers')->where('id', $order->customer_id)->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Order deleted.',
        ]);
    }
}
