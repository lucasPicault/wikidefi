<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
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

