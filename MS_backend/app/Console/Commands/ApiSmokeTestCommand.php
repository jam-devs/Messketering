<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ApiSmokeTestCommand extends Command
{
    protected $signature = 'api:smoke-test';

    protected $description = 'Run smoke checks for the catering backend data and API prerequisites.';

    private int $failures = 0;

    public function handle(): int
    {
        $this->info('Running backend smoke checks...');

        $this->checkDatabaseConnection();
        $this->checkAdminUser();
        $this->checkMenuItems();
        $this->checkOrders();
        $this->checkPayments();
        $this->checkDashboardMath();

        if ($this->failures > 0) {
            $this->error("Smoke test failed with {$this->failures} issue(s).");
            return self::FAILURE;
        }

        $this->info('Smoke test passed.');
        return self::SUCCESS;
    }

    private function checkDatabaseConnection(): void
    {
        try {
            DB::connection()->getPdo();
            $this->pass('Database connection works.');
        } catch (\Throwable $error) {
            $this->fail('Database connection failed: ' . $error->getMessage());
        }
    }

    private function checkAdminUser(): void
    {
        $admin = DB::table('admin_users')->where('email', 'admin@example.com')->first();

        if (!$admin) {
            $this->fail('Default admin user is missing.');
            return;
        }

        if (!Hash::check('admin123', $admin->password)) {
            $this->warn('Default admin password is not admin123. This is okay if you changed it.');
        }

        $this->pass('Admin user exists.');
    }

    private function checkMenuItems(): void
    {
        $count = DB::table('menu_items')->count();

        if ($count === 0) {
            $this->fail('No menu items found.');
            return;
        }

        $this->pass("Menu items exist ({$count}).");
    }

    private function checkOrders(): void
    {
        $badOrderItems = DB::table('order_items')
            ->leftJoin('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->whereNull('orders.id')
            ->orWhereNull('menu_items.id')
            ->count();

        if ($badOrderItems > 0) {
            $this->fail("Found {$badOrderItems} orphaned order item(s).");
            return;
        }

        $this->pass('Order item relationships look valid.');
    }

    private function checkPayments(): void
    {
        $badPayments = DB::table('payments')
            ->leftJoin('orders', 'payments.order_id', '=', 'orders.id')
            ->whereNull('orders.id')
            ->count();

        if ($badPayments > 0) {
            $this->fail("Found {$badPayments} orphaned payment(s).");
            return;
        }

        $overpaidOrders = DB::table('orders')
            ->leftJoin('payments', 'orders.id', '=', 'payments.order_id')
            ->select('orders.id', 'orders.total_amount', DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'))
            ->groupBy('orders.id', 'orders.total_amount')
            ->havingRaw('paid_amount > orders.total_amount')
            ->count();

        if ($overpaidOrders > 0) {
            $this->fail("Found {$overpaidOrders} overpaid order(s).");
            return;
        }

        $this->pass('Payment relationships and balances look valid.');
    }

    private function checkDashboardMath(): void
    {
        $totalSales = (float) DB::table('orders')->sum('total_amount');
        $paidAmount = (float) DB::table('payments')->sum('amount');

        if ($totalSales < 0 || $paidAmount < 0) {
            $this->fail('Dashboard totals contain negative values.');
            return;
        }

        $this->pass('Dashboard totals can be calculated.');
    }

    private function pass(string $message): void
    {
        $this->line("[OK] {$message}");
    }

    private function fail(string $message): void
    {
        $this->failures++;
        $this->error("[FAIL] {$message}");
    }
}
