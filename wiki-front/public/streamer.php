<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wiki Game - Streamer</title>
  <base href="/">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/streamer.css">
</head>
<body>
<div class="container">
  <h1>Wiki Game - Streamer</h1>

  <div id="bot-config-section">
    <h2>Configurer le bot Twitch</h2>
    <a href="https://twitchtokengenerator.com" target="_blank">Obtenir Votre ACCESS TOKEN</a>
    <p>Renseignez les informations du bot Twitch pour interagir avec le chat.</p>
    <input type="text" id="bot-username" placeholder="" value="Bot" style="display: none;"/>
    <input type="password" id="bot-token" placeholder="Token" />
    <div>
      <button id="save-bot-config" class="save">Enregistrer</button>
      <button id="test-bot-config" class="test" disabled>Tester</button>
    </div>
    <p id="bot-config-status"></p>
  </div>

  <div id="session-creation" class="green-button">
    <label for="start-page">Page de départ</label>
    <input type="text" id="start-page" placeholder="Page de départ (ex: France)" autocomplete="off" />
    <ul id="start-suggestions" class="suggestions"></ul>
  
    <label for="end-page">Page d'arrivée</label>
    <input type="text" id="end-page" placeholder="Page d'arrivée (ex: Paris)" autocomplete="off" />
    <ul id="end-suggestions" class="suggestions"></ul>
  
    <button id="create-session">Créer la session</button>
  </div>

  <p id="session-info"></p>
  <div id="launch-section" style="display: none;">
    <button id="launch-game">Lancer la partie</button>
    <button id="end-session-btn" disabled>Fin de partie</button>
  </div>
</div>

<script src="js/streamer.js"></script>
<script src="js/auth.js"></script>

</body>
</html>
