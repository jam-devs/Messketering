<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class ScheduleController extends ApiController
{
    public function index()
    {
        $events = DB::table('orders')
            ->join('customers', 'orders.customer_id', '=', 'customers.id')
            ->whereNotNull('orders.delivery_date')
            ->select(
                'orders.id',
                'orders.status',
                'orders.delivery_date',
                'orders.total_amount',
                'orders.notes',
                'customers.name as customer_name',
                'customers.contact_number',
                'customers.address'
            )
            ->orderBy('orders.delivery_date')
            ->orderBy('orders.id')
            ->get();

        foreach ($events as $event) {
            $event->items = DB::table('order_items')
                ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                ->where('order_items.order_id', $event->id)
                ->select('menu_items.name', 'order_items.quantity')
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $events,
        ]);
    }
}
