<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuItemController extends ApiController
{
    public function index(Request $request)
    {
        $items = DB::table('menu_items')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        if ($response = $this->validateRequest($request, $this->rules())) {
            return $response;
        }

        $id = DB::table('menu_items')->insertGetId([
            'name' => trim($request->input('name')),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'category' => trim($request->input('category')),
            'is_available' => $request->boolean('is_available', true),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return response()->json([
            'status' => 'success',
            'data' => DB::table('menu_items')->where('id', $id)->first(),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if ($response = $this->validateRequest($request, $this->rules())) {
            return $response;
        }

        if (!DB::table('menu_items')->where('id', $id)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Menu item not found.',
            ], 404);
        }

        DB::table('menu_items')->where('id', $id)->update([
            'name' => trim($request->input('name')),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'category' => trim($request->input('category')),
            'is_available' => $request->boolean('is_available', true),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return response()->json([
            'status' => 'success',
            'data' => DB::table('menu_items')->where('id', $id)->first(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $deleted = DB::table('menu_items')->where('id', $id)->delete();

        if (!$deleted) {
            return response()->json([
                'status' => 'error',
                'message' => 'Menu item not found.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Menu item deleted.',
        ]);
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'is_available' => 'boolean',
        ];
    }
}
