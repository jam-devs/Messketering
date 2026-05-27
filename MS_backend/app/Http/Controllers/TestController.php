<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class TestController extends Controller
{
    public function show()
    {
        $message = DB::table('app_messages')->where('id', 1)->value('message');

        return response()->json([
            'status' => 'success',
            'message' => $message ?? 'Database connected, but no message was seeded yet.',
        ]);
    }
}
