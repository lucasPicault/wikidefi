<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header("Access-Control-Allow-Origin: https://wikidefi.fr");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Récupérer l'URL demandée
$requestUri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Charger la page correspondante
switch ($requestUri) {
    case '':
        require 'menu.php'; // Page d'accueil
        break;
    case 'streamer':
        require 'streamer.php'; // Page Streamer
        break;
    case 'viewer':
        require 'viewer.php'; // Page Viewer
        break;
    default:
        http_response_code(404);
        echo 'Page non trouvée';
        break;
}
?>

