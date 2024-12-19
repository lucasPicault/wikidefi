<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header("Content-Type: application/json");
$requestMethod = $_SERVER['REQUEST_METHOD'];
$path = explode('/', trim(str_replace('api.php', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/'));

var_dump($path);
exit;
// Routeur basique
if ($path[0] === 'session') {
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
    if ($requestMethod === 'POST' && $path[1] === 'move') {
        makeMove($path[1]);
    } elseif ($requestMethod === 'GET') {
        getGameDetails($path[1]);
    } else {
        respondWithError("Route non trouvée.");
    }
} elseif ($path[0] === 'scoreboard') {
    if ($requestMethod === 'GET') {
        getScoreboard($path[1] ?? null);
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
