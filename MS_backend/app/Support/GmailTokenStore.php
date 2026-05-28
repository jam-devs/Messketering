<?php

namespace App\Support;

class GmailTokenStore
{
    private string $path;

    public function __construct()
    {
        $this->path = storage_path('app/gmail-oauth.json');
    }

    public function get(): array
    {
        if (!file_exists($this->path)) {
            return [];
        }

        $contents = file_get_contents($this->path);
        $decoded = json_decode($contents ?: '', true);

        return is_array($decoded) ? $decoded : [];
    }

    public function put(array $token): void
    {
        $current = $this->get();

        if (empty($token['refresh_token']) && !empty($current['refresh_token'])) {
            $token['refresh_token'] = $current['refresh_token'];
        }

        $token['updated_at'] = date('c');

        file_put_contents(
            $this->path,
            json_encode($token, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    public function clear(): void
    {
        if (file_exists($this->path)) {
            @unlink($this->path);
        }
    }

    public function hasValidToken(): bool
    {
        $token = $this->get();

        if (empty($token['access_token'])) {
            return false;
        }

        $expiresAt = (int) ($token['expires_at'] ?? 0);

        return $expiresAt > (time() + 30);
    }
}
