<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header("Access-Control-Allow-Origin: https://wikidefi.fr"); // Origine spécifique
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Accueil</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="/">
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/index.css">
</head>
<body>
    <div class="container">
        <h1>Bienvenue sur le Wiki Game</h1>
        <div class="buttons">
            <button id="streamer-btn" role="button">Je suis Streamer</button>
            <button id="viewer-btn" role="button">Je suis Viewer</button>
        </div>
    </div>
    <script>
        // Gestion des redirections en utilisant la base URL définie
        document.getElementById('streamer-btn').addEventListener('click', () => {
            window.location.href = 'streamer';
        });
        document.getElementById('viewer-btn').addEventListener('click', () => {
            window.location.href = 'viewer';
        });
    </script>
    <script src="js/auth.js"></script>

</body>
</html>
