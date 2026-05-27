<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class ReportController extends ApiController
{
    public function summary()
    {
        $totalSales = (float) DB::table('orders')->sum('total_amount');
        $paidAmount = (float) DB::table('payments')->sum('amount');
        $unpaidBalance = max(0, $totalSales - $paidAmount);

        return response()->json([
            'status' => 'success',
            'data' => [
                'sales_summary' => [
                    'total_sales' => number_format($totalSales, 2, '.', ''),
                    'paid_amount' => number_format($paidAmount, 2, '.', ''),
                    'unpaid_balance' => number_format($unpaidBalance, 2, '.', ''),
                ],
                'orders_by_status' => DB::table('orders')
                    ->select('status', DB::raw('COUNT(*) as count'))
                    ->groupBy('status')
                    ->orderBy('status')
                    ->get(),
                'best_selling_items' => DB::table('order_items')
                    ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                    ->select(
                        'menu_items.name',
                        DB::raw('SUM(order_items.quantity) as quantity_sold'),
                        DB::raw('SUM(order_items.line_total) as sales_total')
                    )
                    ->groupBy('menu_items.id', 'menu_items.name')
                    ->orderByDesc('quantity_sold')
                    ->limit(5)
                    ->get(),
                'payments_by_method' => DB::table('payments')
                    ->select('payment_method', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as payment_count'))
                    ->groupBy('payment_method')
                    ->orderBy('payment_method')
                    ->get(),
                'unpaid_orders' => DB::table('orders')
                    ->join('customers', 'orders.customer_id', '=', 'customers.id')
                    ->leftJoin('payments', 'orders.id', '=', 'payments.order_id')
                    ->select(
                        'orders.id',
                        'customers.name as customer_name',
                        'orders.total_amount',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                        DB::raw('orders.total_amount - COALESCE(SUM(payments.amount), 0) as balance_amount')
                    )
                    ->groupBy('orders.id', 'customers.name', 'orders.total_amount')
                    ->havingRaw('balance_amount > 0')
                    ->orderByDesc('balance_amount')
                    ->limit(10)
                    ->get(),
            ],
        ]);
    }
}
