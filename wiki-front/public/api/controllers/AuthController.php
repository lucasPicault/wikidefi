<?php
class AuthController {
    public static function redirectToTwitch() {
        $config = include '../config.php';
        $url = "https://id.twitch.tv/oauth2/authorize?" . http_build_query([
            'client_id' => $config['twitch_client_id'],
            'redirect_uri' => $config['twitch_redirect_uri'],
            'response_type' => 'code',
            'scope' => 'user:read:email',
        ]);

        echo json_encode(['url' => $url]);
    }

    public static function handleTwitchCallback() {
        $config = include '../config.php';
        $input = json_decode(file_get_contents('php://input'), true);
        $code = $input['code'] ?? null;

        if (!$code) {
            http_response_code(400);
            echo json_encode(['error' => 'Code is required']);
            return;
        }

        $tokenResponse = self::fetchAccessToken($code, $config);
        if (isset($tokenResponse['access_token'])) {
            $userData = self::fetchUserData($tokenResponse['access_token']);
            echo json_encode([
                'user' => $userData,
                'access_token' => $tokenResponse['access_token']
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to retrieve access token']);
        }
    }

    private static function fetchAccessToken($code, $config) {
        $url = "https://id.twitch.tv/oauth2/token";
        $data = [
            'client_id' => $config['twitch_client_id'],
            'client_secret' => $config['twitch_client_secret'],
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $config['twitch_redirect_uri'],
        ];

        $options = [
            'http' => [
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'method' => 'POST',
                'content' => http_build_query($data),
            ],
        ];

        $context = stream_context_create($options);
        $response = file_get_contents($url, false, $context);
        return json_decode($response, true);
    }

    private static function fetchUserData($accessToken) {
        $url = "https://api.twitch.tv/helix/users";
        $options = [
            'http' => [
                'header' => "Authorization: Bearer $accessToken\r\nClient-Id: " . include '../config.php']['twitch_client_id'] . "\r\n",
                'method' => 'GET',
            ],
        ];

        $context = stream_context_create($options);
        $response = file_get_contents($url, false, $context);
        return json_decode($response, true)['data'][0] ?? null;
    }
}
