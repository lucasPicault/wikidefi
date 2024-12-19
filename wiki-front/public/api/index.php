<?php
header("Content-Type: application/json");
require_once 'controllers/AuthController.php';
require_once 'controllers/SessionController.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Routes de l'API
if (strpos($requestUri, '/auth/twitch') === 0 && $requestMethod === 'GET') {
    AuthController::redirectToTwitch();
} elseif (strpos($requestUri, '/auth/twitch/callback') === 0 && $requestMethod === 'POST') {
    AuthController::handleTwitchCallback();
} elseif (strpos($requestUri, '/session/create') === 0 && $requestMethod === 'POST') {
    SessionController::createSession();
} elseif (strpos($requestUri, '/session/launch') === 0 && $requestMethod === 'POST') {
    SessionController::launchSession();
} elseif (strpos($requestUri, '/session/end') === 0 && $requestMethod === 'POST') {
    SessionController::endSession();
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}
