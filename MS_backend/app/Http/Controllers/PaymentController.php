<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends ApiController
{
    public function index(Request $request, $id)
    {
        $payments = DB::table('payments')
            ->where('order_id', $id)
            ->orderByDesc('paid_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $payments,
        ]);
    }

    public function store(Request $request, $id)
    {
        if ($response = $this->validateRequest($request, [
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:Cash,GCash,Bank Transfer',
            'paid_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ])) {
            return $response;
        }

        $order = DB::table('orders')->where('id', $id)->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found.',
            ], 404);
        }

        $amount = (float) $request->input('amount');
        $paidAmount = (float) DB::table('payments')->where('order_id', $id)->sum('amount');
        $remainingBalance = max(0, (float) $order->total_amount - $paidAmount);

        if ($remainingBalance <= 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'This order is already fully paid.',
            ], 422);
        }

        if ($amount > $remainingBalance) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment amount cannot exceed the remaining balance of PHP ' . number_format($remainingBalance, 2, '.', ''),
            ], 422);
        }

        DB::table('payments')->insert([
            'order_id' => $id,
            'amount' => $amount,
            'payment_method' => $request->input('payment_method'),
            'paid_at' => $request->input('paid_at') ?: date('Y-m-d H:i:s'),
            'notes' => $request->input('notes'),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $paidAmount = (float) DB::table('payments')->where('order_id', $id)->sum('amount');

        if ($paidAmount >= (float) $order->total_amount) {
            DB::table('orders')->where('id', $id)->update([
                'status' => 'Completed',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Payment recorded.',
        ], 201);
    }
}
