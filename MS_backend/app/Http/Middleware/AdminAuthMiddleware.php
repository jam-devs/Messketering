<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\DB;

class AdminAuthMiddleware
{
    public function handle($request, Closure $next)
    {
        $header = $request->header('Authorization', '');
        $token = str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;

        if (!$token || !DB::table('admin_users')->where('api_token', $token)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized.',
            ], 401);
        }

        return $next($request);
    }
}
