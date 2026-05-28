<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends ApiController
{
    public function login(Request $request)
    {
        if ($response = $this->validateRequest($request, [
            'email' => 'required|email',
            'password' => 'required|string',
        ])) {
            return $response;
        }

        $user = DB::table('admin_users')->where('email', $request->input('email'))->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email or password.',
            ], 401);
        }

        $token = Str::random(60);

        DB::table('admin_users')->where('id', $user->id)->update([
            'api_token' => $token,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'admin',
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $this->authUserFromRequest($request);

        if ($user) {
            DB::table('admin_users')->where('id', $user->id)->update([
                'api_token' => null,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out.',
        ]);
    }

    public function changePassword(Request $request)
    {
        if ($response = $this->validateRequest($request, [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ])) {
            return $response;
        }

        $user = $this->authUserFromRequest($request);

        if (!$user || !Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        DB::table('admin_users')->where('id', $user->id)->update([
            'password' => Hash::make($request->input('new_password')),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password changed.',
        ]);
    }
}
