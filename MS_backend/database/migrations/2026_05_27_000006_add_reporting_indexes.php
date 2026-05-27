<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status', 'orders_status_index');
            $table->index('delivery_date', 'orders_delivery_date_index');
            $table->index('created_at', 'orders_created_at_index');
            $table->index(['status', 'created_at'], 'orders_status_created_at_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('paid_at', 'payments_paid_at_index');
            $table->index(['order_id', 'paid_at'], 'payments_order_id_paid_at_index');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->index('contact_number', 'customers_contact_number_index');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('customers_contact_number_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_order_id_paid_at_index');
            $table->dropIndex('payments_paid_at_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_created_at_index');
            $table->dropIndex('orders_created_at_index');
            $table->dropIndex('orders_delivery_date_index');
            $table->dropIndex('orders_status_index');
        });
    }
};
