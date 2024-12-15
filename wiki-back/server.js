require('dotenv').config();
const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const port = 3000;

// Variables globales
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

// Autorise les requêtes cross-origin
app.use(cors({
  origin: 'http://localhost:3000', // Autorise uniquement les requêtes provenant de cette origine
  methods: ['GET', 'POST', 'OPTIONS'], // Autorise les méthodes HTTP nécessaires
  credentials: true, // Autorise l'envoi des cookies ou des headers d'authentification
}));

// On active le middleware global
app.use(globalAuthCheck);

// Routes
app.use('/', authRoutes);
app.use('/', gameRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/streamer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'streamer.html'));
});

app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Route paramétrique pour le joueur : /:sessionCode
app.get('/:sessionCode', (req, res) => {
  const { sessions } = require('./data/store');
  const sessionCode = req.params.sessionCode.toUpperCase();
  if (!sessions[sessionCode]) {
    // Session introuvable
    return res.redirect('/auth/twitch');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
