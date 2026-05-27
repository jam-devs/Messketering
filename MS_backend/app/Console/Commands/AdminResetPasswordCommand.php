<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminResetPasswordCommand extends Command
{
    protected $signature = 'admin:reset-password {email} {password}';

    protected $description = 'Reset an admin user password by email.';

    public function handle(): int
    {
        $email = $this->argument('email');
        $password = $this->argument('password');

        if (strlen($password) < 8) {
            $this->error('Password must be at least 8 characters.');
            return self::FAILURE;
        }

        $updated = DB::table('admin_users')
            ->where('email', $email)
            ->update([
                'password' => Hash::make($password),
                'api_token' => null,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        if (!$updated) {
            $this->error('Admin user not found.');
            return self::FAILURE;
        }

        $this->info('Admin password reset successfully.');
        return self::SUCCESS;
    }
}
