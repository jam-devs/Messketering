<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('admin_users')->updateOrInsert(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'api_token' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        DB::table('admin_users')->updateOrInsert(
            ['email' => 'kitchen@example.com'],
            [
                'name' => 'Kitchen User',
                'password' => Hash::make('kitchen123'),
                'role' => 'kitchen',
                'api_token' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        DB::table('admin_users')->updateOrInsert(
            ['email' => 'logistics@example.com'],
            [
                'name' => 'Logistics User',
                'password' => Hash::make('logistics123'),
                'role' => 'logistics',
                'api_token' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        DB::table('app_messages')->updateOrInsert(
            ['id' => 1],
            [
                'message' => 'Connection successful! Angular is reading this from MySQL.',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        $menuItems = [
            [
                'id' => 1,
                'name' => 'Chicken Adobo Rice Bowl',
                'description' => 'Classic soy-vinegar chicken served with steamed rice and vegetables.',
                'price' => 95.00,
                'category' => 'Rice Meal',
                'is_available' => true,
            ],
            [
                'id' => 2,
                'name' => 'Beef Caldereta Tray',
                'description' => 'Tender beef in tomato sauce with potatoes, carrots, and bell peppers.',
                'price' => 850.00,
                'category' => 'Party Tray',
                'is_available' => true,
            ],
            [
                'id' => 3,
                'name' => 'Pancit Canton Bilao',
                'description' => 'Stir-fried noodles with vegetables, pork, chicken, and shrimp.',
                'price' => 650.00,
                'category' => 'Bilao',
                'is_available' => true,
            ],
            [
                'id' => 4,
                'name' => 'Leche Flan',
                'description' => 'Rich caramel custard dessert, good for sharing.',
                'price' => 180.00,
                'category' => 'Dessert',
                'is_available' => true,
            ],
        ];

        foreach ($menuItems as $item) {
            DB::table('menu_items')->updateOrInsert(
                ['id' => $item['id']],
                array_merge($item, [
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ])
            );
        }
    }
}
