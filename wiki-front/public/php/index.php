<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Access-Control-Allow-Origin: https://wikidefi.fr"); // Origine spécifique
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Répondre directement aux requêtes OPTIONS (prévols)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
    

if (!isset($_SESSION['twitch_user']) && !in_array($path[0], ['auth'])) {
    redirectToTwitchAuth();
}

header("Content-Type: application/json");
$requestMethod = $_SERVER['REQUEST_METHOD'];
$path = explode('/', trim(str_replace('api.php', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/'));

// Routeur basique
if ($path[0] === 'session') {
    requireAuth();
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path[1] === 'create') {
        createSession();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $path[1] === 'join') {
        joinSession();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $path[1] === 'launch') {
        launchSession();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $path[1] === 'end') {
        endSession();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $path[1] === 'state') {
        getSessionState($path[2] ?? null);
    } else {
        respondWithError("Route non trouvée.");
    }

} elseif ($path[0] === 'game') {
    requireAuth();
    if ($requestMethod === 'POST' && $path[1] === 'move') {
        makeMove($path[1]);
    } elseif ($requestMethod === 'GET') {
        getGameDetails($path[1]);
    } else {
        respondWithError("Route non trouvée.");
    }
} elseif ($path[0] === 'scoreboard') {
    requireAuth();
    if ($requestMethod === 'GET') {
        getScoreboard($path[1] ?? null);
    } else {
        respondWithError("Route non trouvée.");
    }
}
elseif ($path[0] === 'auth') {
    if ($requestMethod === 'GET' && $path[1] === 'login') {
        redirectToTwitchAuth();
    } elseif ($requestMethod === 'GET' && $path[1] === 'callback') {
        handleTwitchCallback();
    } elseif ($requestMethod === 'GET' && $path[1] === 'status') {
        checkAuthStatus();
    } else {
        respondWithError("Route non trouvée.");
    }
} else {
    respondWithError("Route non trouvée.");
}

function respondWithError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(["error" => $message]);
    exit;
}

function respondWithSuccess($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}




function createSession() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['start']) || empty($input['end'])) {
        respondWithError("Les pages de départ et d'arrivée sont requises.");
    }

    $sessionCode = strtoupper(bin2hex(random_bytes(3))); // Exemple de code aléatoire
    $_SESSION['sessions'][$sessionCode] = [
        'start' => $input['start'],
        'end' => $input['end'],
        'isLaunched' => false,
        'players' => []
    ];

    respondWithSuccess([
        'sessionCode' => $sessionCode,
        'start' => $input['start'],
        'end' => $input['end']
    ]);
}


function joinSession() {
    $input = json_decode(file_get_contents('php://input'), true);
    $sessionCode = strtoupper($input['sessionCode'] ?? '');

    if (!isset($_SESSION['sessions'][$sessionCode])) {
        respondWithError("Session introuvable.");
    }

    $_SESSION['sessions'][$sessionCode]['players'][] = [
        'id' => session_id(),
        'status' => 'waiting',
        'currentPage' => null,
        'targetPage' => null,
        'elapsedTime' => 0
    ];

    respondWithSuccess([
        'message' => "En attente du lancement...",
        'isLaunched' => false
    ]);
}



function launchSession() {
    $input = json_decode(file_get_contents('php://input'), true);
    $sessionCode = strtoupper($input['sessionCode'] ?? '');

    if (!isset($_SESSION['sessions'][$sessionCode])) {
        respondWithError("Session introuvable.");
    }

    $_SESSION['sessions'][$sessionCode]['isLaunched'] = true;
    respondWithSuccess(["message" => "La session a été lancée avec succès."]);
}



function getSessionState($sessionCode) {
    $sessionCode = strtoupper($sessionCode);

    if (!isset($_SESSION['sessions'][$sessionCode])) {
        respondWithError("Session introuvable.");
    }

    $session = $_SESSION['sessions'][$sessionCode];
    respondWithSuccess(['isLaunched' => $session['isLaunched']]);
}

function makeMove($gameId) {
    $input = json_decode(file_get_contents('php://input'), true);
    $nextPage = $input['nextPage'] ?? '';

    if (empty($nextPage)) {
        respondWithError("La page suivante est requise.");
    }

    foreach ($_SESSION['sessions'] as $sessionCode => $session) {
        foreach ($session['players'] as &$player) {
            if ($player['id'] === session_id() && $session['isLaunched']) {
                if ($player['currentPage'] !== $player['targetPage']) {
                    $player['currentPage'] = $nextPage;
                    $player['elapsedTime'] += 2; // Exemple : incrémentation du temps
                    respondWithSuccess([
                        "message" => "Mouvement enregistré.",
                        "currentPage" => $nextPage,
                        "elapsedTime" => $player['elapsedTime']
                    ]);
                } else {
                    respondWithError("La cible a déjà été atteinte.");
                }
            }
        }
    }

    respondWithError("Partie introuvable ou non autorisée.");
}



function getGameDetails($gameId) {
    foreach ($_SESSION['sessions'] as $sessionCode => $session) {
        if (isset($session['players'])) {
            foreach ($session['players'] as $player) {
                if ($player['id'] === session_id()) {
                    respondWithSuccess([
                        "gameId" => $gameId,
                        "currentPage" => $player['currentPage'],
                        "targetPage" => $player['targetPage'],
                        "elapsedTime" => $player['elapsedTime']
                    ]);
                }
            }
        }
    }

    respondWithError("Détails de la partie introuvables.");
}


function getScoreboard($sessionCode) {
    $sessionCode = strtoupper($sessionCode);

    if (!isset($_SESSION['sessions'][$sessionCode])) {
        respondWithError("Session introuvable.");
    }

    $players = $_SESSION['sessions'][$sessionCode]['players'] ?? [];
    usort($players, fn($a, $b) => $a['elapsedTime'] <=> $b['elapsedTime']);

    $scoreboard = [];
    foreach ($players as $index => $player) {
        $scoreboard[] = [
            "position" => $index + 1,
            "playerId" => $player['id'],
            "finalTime" => $player['elapsedTime'],
            "currentPage" => $player['currentPage'],
            "moves" => $player['moves'] ?? 0 // Ajouter le suivi des mouvements
        ];
    }

    respondWithSuccess($scoreboard);
}

function deleteSession($sessionCode) {
    $sessionCode = strtoupper($sessionCode);

    if (!isset($_SESSION['sessions'][$sessionCode])) {
        respondWithError("Session introuvable.");
    }

    unset($_SESSION['sessions'][$sessionCode]);
    respondWithSuccess(["message" => "Session supprimée avec succès."]);
}


function redirectToTwitchAuth() {
    $clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi'; // Remplacez par votre client_id
    $redirectUri = 'https://wikidefi.fr/api.php/auth/callback'; // Remplacez par votre redirect_uri
    $scopes = 'user:read:email'; // Les permissions que vous demandez

    // Génération de l'URL correcte
    $url = "https://id.twitch.tv/oauth2/authorize?client_id=$clientId&redirect_uri=" . urlencode($redirectUri) . "&response_type=code&scope=" . urlencode($scopes);

    // Redirection vers Twitch
    header("Location: $url");
    exit;
}

function handleTwitchCallback() {
    $clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi';
    $clientSecret = 'idpvurhkqjf1tjdmxprn3ttnyrllew';
    $redirectUri = 'https://api.wikidefi.fr/auth/callback';

    $code = $_GET['code'] ?? null;
    if (!$code) {
        respondWithError("Code d'autorisation manquant.");
    }

    // Échanger le code contre un jeton d'accès
    $url = 'https://id.twitch.tv/oauth2/token';
    $data = [
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'code' => $code,
        'grant_type' => 'authorization_code',
        'redirect_uri' => $redirectUri
    ];

    $options = [
        'http' => [
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    $tokenData = json_decode($response, true);

    if (isset($tokenData['access_token'])) {
        $_SESSION['twitch_access_token'] = $tokenData['access_token'];
        $_SESSION['twitch_user'] = getUserData($tokenData['access_token']);
        header("Location: /"); // Rediriger vers la page d'accueil après la connexion
        exit;
    } else {
        respondWithError("Échec de l'authentification Twitch.");
    }
}

function getUserData($accessToken) {
    $url = 'https://id.twitch.tv/oauth2/validate';
    $options = [
        'http' => [
            'header' => "Authorization: Bearer $accessToken"
        ]
    ];
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    return json_decode($response, true);
}


function checkAuthStatus() {
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: https://wikidefi.fr"); // Utiliser l'origine correcte
    header("Access-Control-Allow-Credentials: true");

    // Si l'utilisateur n'est pas connecté
    if (!isset($_SESSION['twitch_user'])) {
        echo json_encode(['authenticated' => false]);
        exit;
    }

    // Si l'utilisateur est connecté
    echo json_encode([
        'authenticated' => true,
        'user' => $_SESSION['twitch_user']
    ]);
    exit;
}

function requireAuth() {
    if (!isset($_SESSION['twitch_user'])) {
        redirectToTwitchAuth();
    }
}