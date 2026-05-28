<?php

namespace App\Support;

use RuntimeException;

class GmailService
{
    private const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
    private const GOOGLE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private GmailTokenStore $tokenStore;

    public function __construct()
    {
        $this->tokenStore = new GmailTokenStore();
    }

    public function getStatus(): array
    {
        $token = $this->tokenStore->get();

        return [
            'connected' => !empty($token['access_token']) || !empty($token['refresh_token']),
            'expires_at' => $token['expires_at'] ?? null,
            'scope' => $token['scope'] ?? null,
            'email_address' => $token['email_address'] ?? null,
        ];
    }

    public function getAuthUrl(string $state): string
    {
        $params = http_build_query([
            'client_id' => $this->requireEnv('GMAIL_CLIENT_ID'),
            'redirect_uri' => $this->requireEnv('GMAIL_REDIRECT_URI'),
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/gmail.readonly',
            'access_type' => 'offline',
            'include_granted_scopes' => 'true',
            'prompt' => 'consent',
            'state' => $state,
        ]);

        return self::GOOGLE_OAUTH_BASE . '?' . $params;
    }

    public function exchangeCode(string $code): void
    {
        $payload = $this->postForm(self::GOOGLE_TOKEN_URL, [
            'code' => $code,
            'client_id' => $this->requireEnv('GMAIL_CLIENT_ID'),
            'client_secret' => $this->requireEnv('GMAIL_CLIENT_SECRET'),
            'redirect_uri' => $this->requireEnv('GMAIL_REDIRECT_URI'),
            'grant_type' => 'authorization_code',
        ]);

        if (!is_array($payload) || empty($payload['access_token'])) {
            throw new RuntimeException('Failed to connect Gmail account. Check your OAuth credentials and redirect URI.');
        }

        $expiresIn = (int) ($payload['expires_in'] ?? 3600);
        $payload['expires_at'] = time() + $expiresIn;

        $this->tokenStore->put($payload);

        $profile = $this->fetchProfile();
        $savedToken = $this->tokenStore->get();
        $savedToken['email_address'] = $profile['emailAddress'] ?? null;
        $this->tokenStore->put($savedToken);
    }

    public function disconnect(): void
    {
        $token = $this->tokenStore->get();

        if (!empty($token['access_token'])) {
            $this->postForm('https://oauth2.googleapis.com/revoke', [
                'token' => $token['access_token'],
            ], false);
        }

        $this->tokenStore->clear();
    }

    public function listMessages(int $maxResults = 20): array
    {
        $maxResults = max(1, min($maxResults, 50));
        $accessToken = $this->getAccessToken();

        $payload = $this->getJson(self::GMAIL_API_BASE . '/messages', [
            'maxResults' => $maxResults,
            'labelIds' => 'INBOX',
        ], $this->authHeaders($accessToken));

        if (!is_array($payload)) {
            throw new RuntimeException('Failed to fetch inbox messages from Gmail API.');
        }

        $messages = $payload['messages'] ?? [];
        $items = [];

        foreach ($messages as $message) {
            $id = (string) ($message['id'] ?? '');

            if ($id === '') {
                continue;
            }

            $items[] = $this->getMessage($id);
        }

        return $items;
    }

    public function getMessage(string $id): array
    {
        $accessToken = $this->getAccessToken();

        $payload = $this->getJson(self::GMAIL_API_BASE . '/messages/' . rawurlencode($id), [
            'format' => 'full',
        ], $this->authHeaders($accessToken));

        if (!is_array($payload)) {
            throw new RuntimeException('Failed to fetch Gmail message details.');
        }

        $headers = $payload['payload']['headers'] ?? [];

        return [
            'id' => (string) ($payload['id'] ?? ''),
            'thread_id' => (string) ($payload['threadId'] ?? ''),
            'from' => $this->findHeader($headers, 'From'),
            'subject' => $this->findHeader($headers, 'Subject'),
            'date' => $this->findHeader($headers, 'Date'),
            'snippet' => (string) ($payload['snippet'] ?? ''),
            'internal_date' => (string) ($payload['internalDate'] ?? ''),
        ];
    }

    public function fetchProfile(): array
    {
        $accessToken = $this->getAccessToken();

        $payload = $this->getJson(self::GMAIL_API_BASE . '/profile', [], $this->authHeaders($accessToken));

        if (!is_array($payload)) {
            throw new RuntimeException('Failed to fetch Gmail profile.');
        }

        return $payload;
    }

    private function getAccessToken(): string
    {
        if ($this->tokenStore->hasValidToken()) {
            return (string) $this->tokenStore->get()['access_token'];
        }

        $token = $this->tokenStore->get();

        if (empty($token['refresh_token'])) {
            throw new RuntimeException('Gmail is not connected.');
        }

        $payload = $this->postForm(self::GOOGLE_TOKEN_URL, [
            'client_id' => $this->requireEnv('GMAIL_CLIENT_ID'),
            'client_secret' => $this->requireEnv('GMAIL_CLIENT_SECRET'),
            'refresh_token' => $token['refresh_token'],
            'grant_type' => 'refresh_token',
        ]);

        if (!is_array($payload) || empty($payload['access_token'])) {
            throw new RuntimeException('Failed to refresh Gmail access token.');
        }

        $payload['refresh_token'] = $token['refresh_token'];
        $payload['expires_at'] = time() + (int) ($payload['expires_in'] ?? 3600);
        $payload['email_address'] = $token['email_address'] ?? null;
        $this->tokenStore->put($payload);

        return (string) $payload['access_token'];
    }

    private function authHeaders(string $accessToken): array
    {
        return [
            'Authorization' => 'Bearer ' . $accessToken,
            'Accept' => 'application/json',
        ];
    }

    private function findHeader(array $headers, string $name): string
    {
        foreach ($headers as $header) {
            if (strcasecmp((string) ($header['name'] ?? ''), $name) === 0) {
                return (string) ($header['value'] ?? '');
            }
        }

        return '';
    }

    private function requireEnv(string $key): string
    {
        $value = env($key);

        if (!is_string($value) || trim($value) === '') {
            throw new RuntimeException($key . ' is not configured.');
        }

        return trim($value);
    }

    private function postForm(string $url, array $formParams, bool $throwOnHttpError = true): ?array
    {
        $response = $this->sendRequest('POST', $url, [
            'Content-Type' => 'application/x-www-form-urlencoded',
        ], http_build_query($formParams));

        if ($throwOnHttpError && $response['status'] >= 400) {
            throw new RuntimeException('Google API request failed. HTTP ' . $response['status'] . '.');
        }

        $decoded = json_decode($response['body'], true);

        return is_array($decoded) ? $decoded : null;
    }

    private function getJson(string $url, array $query, array $headers): ?array
    {
        $queryString = http_build_query($query);
        $fullUrl = $queryString !== '' ? ($url . '?' . $queryString) : $url;

        $response = $this->sendRequest('GET', $fullUrl, $headers);

        if ($response['status'] >= 400) {
            throw new RuntimeException('Google API request failed. HTTP ' . $response['status'] . '.');
        }

        $decoded = json_decode($response['body'], true);

        return is_array($decoded) ? $decoded : null;
    }

    private function sendRequest(string $method, string $url, array $headers = [], ?string $body = null): array
    {
        $headerLines = [];

        foreach ($headers as $key => $value) {
            $headerLines[] = $key . ': ' . $value;
        }

        $contextOptions = [
            'http' => [
                'method' => $method,
                'ignore_errors' => true,
                'timeout' => 20,
                'header' => implode("\r\n", $headerLines),
            ],
        ];

        if ($body !== null) {
            $contextOptions['http']['content'] = $body;
        }

        $context = stream_context_create($contextOptions);
        $responseBody = @file_get_contents($url, false, $context);

        if ($responseBody === false) {
            $error = error_get_last();
            throw new RuntimeException('HTTP request failed: ' . ($error['message'] ?? 'unknown error'));
        }

        $status = 0;

        foreach ($http_response_header ?? [] as $headerLine) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $headerLine, $matches)) {
                $status = (int) $matches[1];
            }
        }

        return [
            'status' => $status,
            'body' => (string) $responseBody,
        ];
    }
}
