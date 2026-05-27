<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends ApiController
{
    public function index()
    {
        $customers = DB::table('customers')
            ->leftJoin('orders', 'customers.id', '=', 'orders.customer_id')
            ->select(
                'customers.id',
                'customers.name',
                'customers.contact_number',
                'customers.address',
                'customers.created_at',
                DB::raw('COUNT(orders.id) as order_count'),
                DB::raw('COALESCE(SUM(orders.total_amount), 0) as total_spent'),
                DB::raw('MAX(orders.created_at) as last_order_at')
            )
            ->groupBy(
                'customers.id',
                'customers.name',
                'customers.contact_number',
                'customers.address',
                'customers.created_at'
            )
            ->orderBy('customers.name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $customers,
        ]);
    }

    public function show($id)
    {
        $customer = DB::table('customers')->where('id', $id)->first();

        if (!$customer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer not found.',
            ], 404);
        }

        $orders = DB::table('orders')
            ->where('customer_id', $id)
            ->select(
                'id',
                'total_amount',
                'status',
                'delivery_date',
                'notes',
                'created_at'
            )
            ->orderByDesc('created_at')
            ->get();

        $totalSpent = 0;
        $paidTotal = 0;

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

            $totalSpent += (float) $order->total_amount;
            $paidTotal += $paidAmount;

            $order->paid_amount = number_format($paidAmount, 2, '.', '');
            $order->balance_amount = number_format(max(0, (float) $order->total_amount - $paidAmount), 2, '.', '');
        }

        $customer->orders = $orders;
        $customer->order_count = $orders->count();
        $customer->total_spent = number_format($totalSpent, 2, '.', '');
        $customer->paid_amount = number_format($paidTotal, 2, '.', '');
        $customer->balance_amount = number_format(max(0, $totalSpent - $paidTotal), 2, '.', '');
        $customer->last_order_at = $orders->first()->created_at ?? null;

        return response()->json([
            'status' => 'success',
            'data' => $customer,
        ]);
    }

    public function update(Request $request, $id)
    {
        if ($response = $this->validateRequest($request, [
            'name' => 'required|string|max:255',
            'contact_number' => 'required|string|max:50',
            'address' => 'nullable|string|max:500',
        ])) {
            return $response;
        }

        $updated = DB::table('customers')->where('id', $id)->update([
            'name' => trim($request->input('name')),
            'contact_number' => trim($request->input('contact_number')),
            'address' => $request->input('address'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        if (!$updated && !DB::table('customers')->where('id', $id)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer not found.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => DB::table('customers')->where('id', $id)->first(),
        ]);
    }
}
