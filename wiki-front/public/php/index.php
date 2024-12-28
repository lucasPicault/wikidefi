<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Access-Control-Allow-Origin: https://wikidefi.fr");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Réponse aux requêtes OPTIONS (pré-vol)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");
$requestMethod = $_SERVER['REQUEST_METHOD'];
$path = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
//--------------------------
//-------SESSION------------
//--------------------------
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
//--------------------------
//------------JEU-----------
//--------------------------
} elseif ($path[0] === 'game') {
    requireAuth();
    if ($requestMethod === 'POST' && $path[1] === 'move') {
        makeMove($path[1]);
    } elseif ($requestMethod === 'GET') {
        getGameDetails($path[1]);
    } else {
        respondWithError("Route non trouvée.");
    }
//--------------------------
//------scoreboard----------
//--------------------------
} elseif ($path[0] === 'scoreboard') {
    requireAuth();
    if ($requestMethod === 'GET') {
        getScoreboard($path[1] ?? null);
    } else {
        respondWithError("Route non trouvée.");
    }
}
//--------------------------
//-------CONNEXION----------
//--------------------------
elseif ($path[0] === 'auth') {
    if ($requestMethod === 'GET' && $path[1] === 'login') {
        redirectToTwitchAuth(); // Lance uniquement la redirection
    } elseif ($requestMethod === 'GET' && $path[1] === 'callback') {
        handleTwitchCallback(); // Gère le retour Twitch
    } elseif ($requestMethod === 'GET' && $path[1] === 'info') {
        checkAuthInfos(); // Vérifie si l'utilisateur est connecté
    } else {
        respondWithError("Route non trouvée.");
    }
//--------------------------
//---------BOT--------------
//--------------------------
} elseif ($path[0] === 'bot') {
    if ($requestMethod === 'POST' && $path[1] === 'configure') {
        configureBot(); 
    } elseif ($requestMethod === 'POST' && $path[1] === 'test') {
        testBot(); 
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
        respondWithError("Les pages de départ et d'arrivée sont obligatoires.");
    }

    // Génère un code de session unique
    $sessionCode = strtoupper(bin2hex(random_bytes(3)));

    // Enregistre la session
    $_SESSION['sessions'][$sessionCode] = [
        'start' => $input['start'],
        'end' => $input['end'],
        'isLaunched' => false,
        'players' => [],
    ];

    // Réponse JSON
    respondWithSuccessJSON([
        'sessionCode' => $sessionCode,
        'start' => $input['start'],
        'end' => $input['end'],
    ]);
}

function respondWithSuccessJSON($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data); // Envoie les données JSON
    exit;
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
    error_log("redirectToTwitchAuth");
    exit;
}

function handleTwitchCallback() {
    if (isset($_GET['code'])) {
        $clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi';
        $clientSecret = 'idpvurhkqjf1tjdmxprn3ttnyrllew';
        $redirectUri = 'https://api.wikidefi.fr/auth/callback';
        $code = $_GET['code'];

        $url = 'https://id.twitch.tv/oauth2/token';
        $data = [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
        ];

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ];

        $ch = curl_init();
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpStatus === 200) {
            $tokenData = json_decode($response, true);
            $accessToken = $tokenData['access_token'];

            // Récupération des informations utilisateur
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.twitch.tv/helix/users');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $accessToken,
                'Client-Id: ' . $clientId,
            ]);

            $userResponse = curl_exec($ch);
            curl_close($ch);

            $userData = json_decode($userResponse, true);
            
            if (isset($userData['data'][0])) {
                session_start();
                $_SESSION['twitch_user'] = $userData['data'][0];
                $_SESSION['access_token'] = $accessToken;

                // Redirection vers la page principale
                if (headers_sent($file, $line)) {
                    die("Les en-têtes ont déjà été envoyés dans $file à la ligne $line.");
                }
                header("Location: https://wikidefi.fr");
                exit;
            } else {
                // Impossible de récupérer les données utilisateur
                echo "Erreur : Impossible de récupérer les informations utilisateur.";
                exit;
            }
        } else {
            // Erreur lors de la récupération du token d'accès
            echo "Erreur lors de la récupération du token d'accès : $response";
            exit;
        }
    } else {
        // Aucun code reçu
        echo 'Erreur : Aucun code reçu.';
        exit;
    }
}

function getUserData($accessToken) {
    if (isset($_SESSION['access_token'])) {
        $accessToken = $_SESSION['access_token'];
    
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.twitch.tv/helix/users');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Client-Id: 8x8rp1xpim5kjpywfjvrsrizsxizxi',
        ]);
    
        $response = curl_exec($ch);
        curl_close($ch);
    
        $userData = json_decode($response, true);
        if (isset($userData['data'][0])) {
            $user = $userData['data'][0];
            echo 'Bienvenue, ' . htmlspecialchars($user['display_name']) . ' (' . htmlspecialchars($user['email']) . ')';
        } else {
            echo 'Impossible de récupérer vos informations.';
        }
    } else {
        echo 'Utilisateur non connecté.';
    }
}


function checkAuthInfos() {
    session_start();
    if (isset($_SESSION['twitch_user'])) {
        echo json_encode([
            'authenticated' => true,
            'user' => $_SESSION['twitch_user']
        ]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
    exit;
}

function requireAuth() {
    if (!isset($_SESSION['twitch_user'])) {
        redirectToTwitchAuth();
    }
}


// -----BOT TWITCH------

function configureBot() {
    $input = json_decode(file_get_contents('php://input'), true);

    $botToken = $input['botToken'] ?? '';
    $clientId = $input['clientId'] ?? '';

    if (empty($botToken)) {
        respondWithError("L'access token du bot est requis.");
    }
    if (empty($clientId)) {
        respondWithError("Le l'id du client est nécésaire.");
    }
    $botUsername = getTwitchUsername($botToken, $clientId);

    if (!$botUsername) {
        respondWithError('Impossible de récupérer le nom d\'utilisateur associé au token.');
    }

    file_put_contents('bot_config.json', json_encode([
        'username' => $botUsername,
        'token' => $botToken
    ]));

    respondWithSuccess(['message' => 'Configuration enregistrée avec succès.', 'username' => $botUsername]);
}

function testBot() {
    $config = json_decode(file_get_contents('bot_config.json'), true);

    if (!$config || empty($config['token'])) {
        respondWithError('Token introuvable ou invalide.');
    }

    $botUsername = $config['username'];
    $channel = '#' . $botUsername;
    $message = "Le bot WikiDefi viens d'arriver dans votre tchat !";

    $result = sendMessageToTwitch($botUsername, $config['token'], $channel, $message);

    if ($result) {
        respondWithSuccess(['message' => 'Message envoyé avec succès.']);
    } else {
        respondWithError('Échec de l\'envoi du message.', 500);
    }
}

function sendMessageToTwitch($username, $token, $channel, $message) {
    $socket = fsockopen('irc.chat.twitch.tv', 6667, $errno, $errstr, 30);

    if (!$socket) {
        error_log("Erreur de connexion : $errstr ($errno)");
        return false;
    }

    fwrite($socket, "PASS oauth:$token\r\n");
    fwrite($socket, "NICK $username\r\n");
    fwrite($socket, "JOIN $channel\r\n");

    fwrite($socket, "PRIVMSG $channel :$message\r\n");

    sleep(1);
    fclose($socket);

    return true;
}

function getTwitchUsername($token, $clientid) {
    $url = 'https://api.twitch.tv/helix/users';

    $headers = [
        'Authorization: Bearer ' . $token,
        'Client-Id: '. $clientid, // Remplacez par votre propre Client ID Twitch
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);

    if (isset($data['data'][0]['login'])) {
        return $data['data'][0]['login'];
    }

    return null;
}