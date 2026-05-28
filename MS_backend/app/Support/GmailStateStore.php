<?php

namespace App\Support;

class GmailStateStore
{
    private string $path;

    public function __construct()
    {
        $this->path = storage_path('app/gmail-oauth-states.json');
    }

    public function issue(): string
    {
        $state = bin2hex(random_bytes(16));
        $states = $this->load();
        $this->purgeExpired($states);

        $states[$state] = [
            'expires_at' => time() + 600,
        ];

        $this->persist($states);

        return $state;
    }

    public function consume(string $state): bool
    {
        if ($state === '') {
            return false;
        }

        $states = $this->load();
        $this->purgeExpired($states);

        if (!isset($states[$state])) {
            $this->persist($states);
            return false;
        }

        unset($states[$state]);
        $this->persist($states);

        return true;
    }

    private function load(): array
    {
        if (!file_exists($this->path)) {
            return [];
        }

        $contents = file_get_contents($this->path);
        $decoded = json_decode($contents ?: '', true);

        return is_array($decoded) ? $decoded : [];
    }

    private function persist(array $states): void
    {
        file_put_contents(
            $this->path,
            json_encode($states, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    private function purgeExpired(array &$states): void
    {
        $now = time();

        foreach ($states as $state => $payload) {
            $expiresAt = (int) ($payload['expires_at'] ?? 0);
            if ($expiresAt <= $now) {
                unset($states[$state]);
            }
        }
    }
}
