require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();
const port = 3000;

// Middleware global pour les variables globales
global.connectedUser = null;
global.chatClient = null;
global.chatConnected = false;

// Middleware global pour forcer la connexion Twitch, sauf pour /auth/twitch
function globalAuthCheck(req, res, next) {
  if (!global.connectedUser && !req.path.startsWith('/auth/twitch')) {
    return res.redirect('/auth/twitch');
  }
  next();
}

// Middleware pour gérer les erreurs globales
function globalErrorHandler(err, req, res, next) {
  console.error('Erreur détectée :', err.message);
  res.status(500).send('Une erreur interne est survenue.');
}

// Middleware CORS pour autoriser les requêtes cross-origin
app.use(cors({
  origin: 'http://localhost:3000', // Autorise uniquement les requêtes provenant de cette origine
  methods: ['GET', 'POST', 'OPTIONS'], // Méthodes HTTP autorisées
  credentials: true, // Autorise les cookies ou les headers d'authentification
}));

// Middleware JSON et fichiers statiques
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// On active le middleware global pour les redirections Twitch
app.use(globalAuthCheck);

// Routes pour l'authentification et les jeux
app.use('/', authRoutes);
app.use('/', gameRoutes);

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour les streamers
app.get('/streamer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'streamer.html'));
});

// Route pour les viewers
app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Route paramétrique pour les joueurs : /:sessionCode
app.get('/:sessionCode', (req, res) => {
  try {
    const { sessions } = require('./data/store');
    const sessionCode = req.params.sessionCode.toUpperCase();

    if (!sessions || !sessions[sessionCode]) {
      // Session introuvable
      return res.redirect('/auth/twitch');
    }

    res.sendFile(path.join(__dirname, 'public', 'player.html'));
  } catch (err) {
    console.error('Erreur lors de la vérification de sessionCode :', err.message);
    res.redirect('/auth/twitch');
  }
});

// Route pour https://api.wikidefi.fr/test
app.get('/test', (req, res) => {
  res.send('Ceci est un texte de test depuis l\'API wikidefi !');
});

// Gestionnaire global des erreurs
app.use(globalErrorHandler);

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
