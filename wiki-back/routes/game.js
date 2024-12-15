const express = require('express');
const router = express.Router();
const { requireTwitchAuth } = require('../utils/authMiddleware');
const { getWikiPageData } = require('../utils/wiki');
const { sessions, games } = require('../data/store');
const { validateWikipediaPage } = require('../utils/wiki');

function getElapsedTime(startTime) {
  return Math.floor((Date.now() - startTime) / 1000);
}

// Créer une session
router.post('/session/create', requireTwitchAuth, async (req, res) => {
  console.log('Requête reçue pour créer une session', req.body);

  const { start, end } = req.body;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end pages are required' });
  }

  // Vérifiez les pages
  const startValidation = await validateWikipediaPage(start);
  const endValidation = await validateWikipediaPage(end);

  if (!startValidation.valid || !endValidation.valid) {
    return res.status(400).json({ error: 'Invalid start or end page' });
  }

  const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  sessions[sessionCode] = {
    start: startValidation.normalizedTitle,
    end: endValidation.normalizedTitle,
    scores: [],
    playersPlayed: new Set(),
    isLaunched: false,
    players: []
  };

  res.json({
    sessionCode,
    start: startValidation.normalizedTitle,
    startUrl: startValidation.pageUrl,
    end: endValidation.normalizedTitle,
    endUrl: endValidation.pageUrl
  });
});


// Lancer la partie
router.post('/session/launch', requireTwitchAuth, (req, res) => {
  const { sessionCode } = req.body;
  if (!sessionCode) return res.status(400).json({ error: 'Session code required' });

  const code = sessionCode.toUpperCase();
  const session = sessions[code];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.isLaunched = true;

  // On ne crée pas immédiatement les games tant que les joueurs ne refont pas /session/join
  // ou on pourrait le faire ici, au choix.

  res.json({ isLaunched: true, message: 'Partie lancée ! Les joueurs peuvent maintenant jouer.' });
});

router.post('/session/end', requireTwitchAuth, (req, res) => {
  const { sessionCode } = req.body;
  const session = sessions[sessionCode.toUpperCase()];

  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Tri des scores pour récupérer le top 3
  const sortedScores = session.scores.slice().sort((a, b) => {
    if (a.moves === b.moves) {
      return a.finalTime - b.finalTime;
    }
    return a.moves - b.moves;
  });

  // Génération du message pour le top 3
  let top3Message = "🎉 Top 3 des joueurs : ";
  sortedScores.slice(0, 3).forEach((score, index) => {
    top3Message += `\n${index + 1}. ${score.player} - ${score.moves} coups - ${score.finalTime}s`;
  });

  // Envoi du message dans le chat
  if (global.chatClient && global.chatConnected) {
    try {
      global.chatClient.say(global.connectedUser.login, top3Message);
    } catch (err) {
      console.error("Erreur lors de l’envoi du message chat :", err);
    }
  } else {
    console.warn("Le chat n'est pas connecté, impossible d'envoyer le message.");
  }

  // Suppression de la session après la fin
  delete sessions[sessionCode.toUpperCase()];
  res.json({ message: 'Session terminée avec succès', top3Message });
});

// Vérifier l'état de la session (pour polling)
router.get('/session/state/:sessionCode', (req, res) => {
  const code = req.params.sessionCode.toUpperCase();
  const session = sessions[code];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ isLaunched: session.isLaunched });
});

// Un joueur rejoint la session
router.post('/session/join', requireTwitchAuth, async (req, res) => {
  const { sessionCode } = req.body;
  const code = sessionCode.toUpperCase();
  const session = sessions[code];

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.playersPlayed.has(global.connectedUser.display_name)) {
    return res.status(403).json({ error: 'Vous avez déjà joué dans cette session.' });
  }

  // Partie non lancée
  if (!session.isLaunched) {
    // Inscrit si pas déjà inscrit
    if (!session.players.includes(global.connectedUser.display_name)) {
      session.players.push(global.connectedUser.display_name);
    }
    return res.json({ isLaunched: false, message: 'Vous êtes déjà inscrit, en attente du lancement.' });
  }

  // Partie lancée
  // Crée le game pour ce joueur s'il n'existe pas déjà
  const pageData = await getWikiPageData(session.start);
  const gameId = Date.now().toString() + Math.floor(Math.random()*10000).toString();

  games[gameId] = {
    sessionCode: code,
    currentPage: session.start,
    targetPage: session.end,
    visited: [session.start],
    links: pageData.links,
    htmlContent: pageData.htmlContent,
    status: 'in-progress',
    player: global.connectedUser.display_name,
    startTime: Date.now()
  };

  res.json({
    isLaunched: true,
    gameId,
    currentPage: session.start,
    targetPage: session.end,
    linksAvailable: pageData.links,
    htmlContent: pageData.htmlContent,
    status: 'in-progress',
    player: global.connectedUser.display_name,
    elapsedTime: 0
  });
});

// Récupérer l'état du jeu
router.get('/game/:gameId', requireTwitchAuth, (req, res) => {
  const { gameId } = req.params;
  const game = games[gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });

  if (game.player !== global.connectedUser.display_name) {
    return res.status(403).json({ error: 'Cette partie appartient à un autre joueur.' });
  }

  res.json({
    gameId,
    currentPage: game.currentPage,
    targetPage: game.targetPage,
    visited: game.visited,
    linksAvailable: game.links,
    htmlContent: game.htmlContent,
    status: game.status,
    player: game.player,
    elapsedTime: getElapsedTime(game.startTime)
  });
});

// Move
router.post('/game/:gameId/move', requireTwitchAuth, async (req, res) => {
  const { gameId } = req.params;
  const { nextPage } = req.body;

  const game = games[gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });

  if (game.player !== global.connectedUser.display_name) {
    return res.status(403).json({ error: 'Cette partie appartient à un autre joueur.' });
  }

  if (game.status !== 'in-progress') {
    return res.status(400).json({ error: 'Game is already finished' });
  }

  if (!game.links.includes(nextPage)) {
    return res.status(400).json({ error: 'Invalid move, link not available' });
  }

  if (game.visited.includes(nextPage)) {
    return res.status(400).json({ error: 'Page already visited (no going back)' });
  }

  game.currentPage = nextPage;
  game.visited.push(nextPage);

  const session = sessions[game.sessionCode];

  if (nextPage === game.targetPage) {
    game.status = 'finished';
    game.links = [];
    game.htmlContent = '';
    const elapsed = getElapsedTime(game.startTime);
    const moves = game.visited.length - 1;

    const session = sessions[game.sessionCode];
    session.scores.push({
        player: game.player,
        finalTime: elapsed,
        moves: moves,
        visited: game.visited // On stocke la liste des pages visitées
      });
    session.playersPlayed.add(game.player);

    return res.json({
        gameId,
        currentPage: game.currentPage,
        targetPage: game.targetPage,
        visited: game.visited,
        linksAvailable: game.links,
        htmlContent: game.htmlContent,
        status: game.status,
        player: game.player,
        elapsedTime: elapsed
      });
  }

  // Si pas encore arrivé à la cible, on met à jour la page
  const pageData = await getWikiPageData(game.currentPage);
  const filteredLinks = pageData.links.filter(l => !game.visited.includes(l));
  game.links = filteredLinks;
  game.htmlContent = pageData.htmlContent;

  res.json({
    gameId,
    currentPage: game.currentPage,
    targetPage: game.targetPage,
    visited: game.visited,
    linksAvailable: game.links,
    htmlContent: game.htmlContent,
    status: game.status,
    player: game.player,
    elapsedTime: getElapsedTime(game.startTime)
  });
});

// Scoreboard
router.get('/scoreboard/:sessionCode', (req, res) => {
  const { sessionCode } = req.params;
  const session = sessions[sessionCode.toUpperCase()];

  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Tri basé sur le nombre de coups, puis le temps
  const sortedScores = session.scores.slice().sort((a, b) => {
    if (a.moves === b.moves) {
      return a.finalTime - b.finalTime; // Si égalité en nombre de coups, on trie par temps
    }
    return a.moves - b.moves; // Priorité au moins de coups
  });

  // Ajout de la position pour chaque joueur
  sortedScores.forEach((score, index) => {
    score.position = index + 1; // Classement basé sur l'ordre trié
  });

  res.json(sortedScores);
});

// Stockage temporaire des configurations par streamer
const botConfigs = {}; // Format : { streamerLogin: { botUsername, botToken } }

// Route pour configurer le bot
router.post('/bot/configure', requireTwitchAuth, (req, res) => {
  const { botUsername, botToken } = req.body;

  if (!botToken) {
    return res.status(400).json({ error: "Le nom d'utilisateur du bot et le token sont requis." });
  }

  // Enregistrer les informations du bot pour ce streamer
  botConfigs[connectedUser.login] = { botUsername, botToken };

  res.json({ message: "Configuration du bot enregistrée avec succès." });
});

// Récupérer la configuration du bot pour un streamer
router.get('/bot/config', requireTwitchAuth, (req, res) => {
  const botConfig = botConfigs[connectedUser.login];

  if (!botConfig) {
    return res.status(404).json({ error: "Aucune configuration de bot trouvée pour ce streamer." });
  }

  res.json(botConfig);
});

module.exports = router;
