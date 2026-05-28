<?php

namespace App\Http\Controllers;

use App\Support\GmailService;
use App\Support\GmailStateStore;
use Illuminate\Http\Request;
use RuntimeException;

class GmailController extends ApiController
{
    private GmailService $gmail;
    private GmailStateStore $stateStore;

    public function __construct()
    {
        $this->gmail = new GmailService();
        $this->stateStore = new GmailStateStore();
    }

    public function status()
    {
        try {
            return response()->json([
                'status' => 'success',
                'data' => $this->gmail->getStatus(),
            ]);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 500);
        }
    }

    public function authUrl()
    {
        try {
            $state = $this->stateStore->issue();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'auth_url' => $this->gmail->getAuthUrl($state),
                    'state' => $state,
                ],
            ]);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 500);
        }
    }

    public function connect(Request $request)
    {
        if ($response = $this->validateRequest($request, [
            'code' => 'required|string',
            'state' => 'required|string',
        ])) {
            return $response;
        }

        try {
            $state = (string) $request->input('state');

            if (!$this->stateStore->consume($state)) {
                return $this->errorResponse('Invalid or expired OAuth state.', 422);
            }

            $this->gmail->exchangeCode((string) $request->input('code'));

            return response()->json([
                'status' => 'success',
                'message' => 'Gmail account connected.',
                'data' => $this->gmail->getStatus(),
            ]);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }
    }

    public function disconnect()
    {
        try {
            $this->gmail->disconnect();

            return response()->json([
                'status' => 'success',
                'message' => 'Gmail disconnected.',
            ]);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }
    }

    public function messages(Request $request)
    {
        $maxResults = (int) $request->query('maxResults', 20);

        try {
            return response()->json([
                'status' => 'success',
                'data' => $this->gmail->listMessages($maxResults),
            ]);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }
    }

    public function message(string $id)
    {
        try {
            return response()->json([
                'status' => 'success',
                'data' => $this->gmail->getMessage($id),
            ]);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }
    }

    private function errorResponse(string $message, int $statusCode)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], $statusCode);
    }
}
