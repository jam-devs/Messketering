<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends ApiController
{
    public function summary(Request $request)
    {
        $totalOrders = DB::table('orders')->count();
        $pendingOrders = DB::table('orders')->where('status', 'Pending')->count();
        $completedOrders = DB::table('orders')->where('status', 'Completed')->count();
        $totalSales = (float) DB::table('orders')->sum('total_amount');
        $paidAmount = (float) DB::table('payments')->sum('amount');
        $unpaidBalance = max(0, $totalSales - $paidAmount);

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'completed_orders' => $completedOrders,
                'total_sales' => number_format($totalSales, 2, '.', ''),
                'paid_amount' => number_format($paidAmount, 2, '.', ''),
                'unpaid_balance' => number_format($unpaidBalance, 2, '.', ''),
            ],
        ]);
    }
}
