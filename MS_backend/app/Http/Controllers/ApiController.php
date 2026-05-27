<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ApiController extends Controller
{
    protected function validateRequest(Request $request, array $rules)
    {
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        return null;
    }

    protected function authUserFromRequest(Request $request)
    {
        $header = $request->header('Authorization', '');
        $token = str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;

        if (!$token) {
            return null;
        }

        return DB::table('admin_users')->where('api_token', $token)->first();
    }

}
