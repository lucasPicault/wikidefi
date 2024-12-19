<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class TwitchController extends AbstractController
{
    private $httpClient;

    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    #[Route('/connect/twitch', name: 'connect_twitch')]
    public function connect(): Response
    {
        $twitchUrl = sprintf(
            'https://id.twitch.tv/oauth2/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=%s',
            $_ENV['TWITCH_CLIENT_ID'],
            urlencode($_ENV['TWITCH_REDIRECT_URI']),
            'user:read:email'
        );

        return $this->redirect($twitchUrl);
    }

    #[Route('/connect/twitch/callback', name: 'connect_twitch_callback')]
    public function callback(Request $request): Response
    {
        $code = $request->get('code');

        if (!$code) {
            return new Response('No code provided', 400);
        }

        $response = $this->httpClient->request('POST', 'https://id.twitch.tv/oauth2/token', [
            'body' => [
                'client_id' => $_ENV['TWITCH_CLIENT_ID'],
                'client_secret' => $_ENV['TWITCH_CLIENT_SECRET'],
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => $_ENV['TWITCH_REDIRECT_URI'],
            ],
        ]);

        $data = $response->toArray();

        if (isset($data['access_token'])) {
            $accessToken = $data['access_token'];

            $userInfo = $this->httpClient->request('GET', 'https://api.twitch.tv/helix/users', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Client-Id' => $_ENV['TWITCH_CLIENT_ID'],
                ],
            ])->toArray();

            return $this->json($userInfo);
        }

        return new Response('Failed to fetch access token', 400);
    }
}
