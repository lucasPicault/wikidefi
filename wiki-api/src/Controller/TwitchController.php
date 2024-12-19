<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class TwitchController extends AbstractController
{
    private $httpClient;

    private $botConfigs = []; // Stockage des configurations de bots par streamer
    private $connectedUser = []; // Utilisateur connecté

    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    #[Route('/auth/twitch', name: 'auth_twitch')]
    public function auth(): JsonResponse
    {
        $twitchAuthUrl = sprintf(
            'https://id.twitch.tv/oauth2/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=user:read:email',
            $_ENV['TWITCH_CLIENT_ID'],
            urlencode($_ENV['TWITCH_REDIRECT_URI'])
        );

        return new JsonResponse(['url' => $twitchAuthUrl]);
    }

    #[Route('/auth/twitch/callback', name: 'auth_twitch_callback')]
    public function callback(Request $request): JsonResponse
    {
        $code = $request->get('code');
        if (!$code) {
            return new JsonResponse(['error' => 'Code is required'], 400);
        }
    
        try {
            // Échanger le code contre un access token
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
            $accessToken = $data['access_token'];
    
            // Obtenir les informations utilisateur
            $userResponse = $this->httpClient->request('GET', 'https://api.twitch.tv/helix/users', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Client-Id' => $_ENV['TWITCH_CLIENT_ID'],
                ],
            ]);
    
            $userData = $userResponse->toArray();
    
            if (empty($userData['data'][0])) {
                return new JsonResponse(['error' => 'User data not found'], 400);
            }
    
            $user = $userData['data'][0];
    
            // Retourner les informations utilisateur et le token d'accès
            return new JsonResponse([
                'user' => [
                    'id' => $user['id'],
                    'login' => $user['login'],
                    'display_name' => $user['display_name'],
                    'email' => $user['email'] ?? null,
                ],
                'access_token' => $accessToken,
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
    
    #[Route('/bot/configure', name: 'bot_configure', methods: ['POST'])]
    public function configureBot(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true); // Décoder le JSON brut
        $botUsername = $data['botUsername'] ?? null;
        $botToken = $data['botToken'] ?? null;

        // Log des données pour vérifier leur réception
        if (!$botUsername || !$botToken) {
            return new JsonResponse([
                'error' => 'Le nom d\'utilisateur et le token du bot sont requis.',
                'receivedData' => $data // Ajoutez les données reçues au log
            ], 400);
        }

        // Enregistrer la configuration du bot pour l'utilisateur connecté
        $this->botConfigs[$this->connectedUser['login']] = [
            'botUsername' => $botUsername,
            'botToken' => $botToken,
        ];

        return new JsonResponse(['message' => 'Configuration du bot enregistrée avec succès.']);
    }

    #[Route('/bot/config', name: 'bot_config', methods: ['GET'])]
    public function getBotConfig(): JsonResponse
    {
        $botConfig = $this->botConfigs[$this->connectedUser['login']] ?? null;

        if (!$botConfig) {
            return new JsonResponse(['error' => 'Aucune configuration de bot trouvée pour cet utilisateur.'], 404);
        }

        return new JsonResponse($botConfig);
    }

    #[Route('/bot/test', name: 'bot_test', methods: ['POST'])]
    public function testBot(): JsonResponse
    {
        // Vérifier si la configuration du bot existe
        $botConfig = $this->botConfigs[$this->connectedUser['login']] ?? null;

        if (!$botConfig) {
            return new JsonResponse(['error' => 'Aucune configuration de bot trouvée.'], 404);
        }

        // Simuler une réponse de test
        return new JsonResponse(['message' => 'Le bot est configuré correctement et prêt à fonctionner.']);
    }
}
