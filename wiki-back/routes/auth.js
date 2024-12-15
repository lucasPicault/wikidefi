const express = require('express');
const router = express.Router();
const axios = require('axios');
const tmi = require('tmi.js');

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URI = process.env.TWITCH_REDIRECT_URI;

global.botConfigs = {}; // Stocker les configurations des bots par streamer

router.get('/auth/twitch', (req, res) => {
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=user:read:email`;
  res.redirect(twitchAuthUrl);
});

router.get('/auth/twitch/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Code is required');
  }

  try {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      },
    });

    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Client-Id': CLIENT_ID,
      },
    });

    const userData = userResponse.data.data[0];
    global.connectedUser = {
      id: userData.id,
      login: userData.login,
      display_name: userData.display_name,
    };

    // Vérifiez si une configuration du bot existe pour ce streamer
    const botConfig = global.botConfigs[global.connectedUser.login];
    if (!botConfig) {
      console.warn("Le bot n'est pas configuré pour ce streamer.");
      return res.redirect('/streamer'); // Rediriger pour configurer le bot
    }

    global.chatClient = new tmi.Client({
      options: { debug: true },
      identity: {
        username: botConfig.botUsername,
        password: botConfig.botToken,
      },
      channels: [global.connectedUser.login],
    });

    try {
      await global.chatClient.connect();
      console.log(`Connecté au chat de ${global.connectedUser.login}`);
      global.chatConnected = true;
    } catch (err) {
      console.error("Erreur de connexion au chat:", err);
    }

    res.redirect('/streamer');
  } catch (error) {
    console.error('Erreur Twitch:', error.response ? error.response.data : error.message);
    res.status(500).send('Erreur de connexion Twitch');
  }
});

router.post('/bot/configure', async (req, res) => {
  const { botUsername, botToken } = req.body;

  if (!botUsername || !botToken) {
    return res.status(400).json({ error: "Le nom d'utilisateur et le token du bot sont requis." });
  }

  try {
    // Initialisez le bot TMI avec la configuration du streamer
    global.chatClient = new tmi.Client({
      options: { debug: true },
      identity: {
        username: botUsername,
        password: botToken,
      },
      channels: [global.connectedUser.login],
    });

    await global.chatClient.connect();
    global.chatConnected = true;

    // Stockez la configuration du bot pour ce streamer
    global.botConfigs[global.connectedUser.login] = { botUsername, botToken };

    res.json({ message: "Configuration du bot enregistrée et bot connecté avec succès." });
  } catch (err) {
    console.error("Erreur lors de la connexion du bot :", err);
    res.status(500).json({ error: "Erreur lors de la connexion du bot. Veuillez vérifier les informations fournies." });
  }
});


router.get('/bot/config', (req, res) => {
  const botConfig = global.botConfigs[global.connectedUser.login];
  if (!botConfig) {
    return res.status(404).json({ error: "Aucune configuration de bot trouvée pour ce streamer." });
  }
  res.json(botConfig);
});

router.post('/bot/test', async (req, res) => {
  const botConfig = global.botConfigs[global.connectedUser.login];

  if (!botConfig) {
    return res.status(404).json({ error: "Aucune configuration de bot trouvée pour ce streamer." });
  }

  if (!global.chatClient) {
    return res.status(400).json({ error: "Le client TMI n'a pas été initialisé." });
  }

  try {
    // Si le bot est connecté, envoyez un message de test
    if (global.chatConnected) {
      await global.chatClient.say(global.connectedUser.login, "Test du bot réussi !");
      return res.json({ message: "Message envoyé avec succès." });
    } else {
      console.warn("Le bot n'est pas connecté, tentative de reconnexion...");
      await global.chatClient.connect(); // Essayez de reconnecter le bot
      global.chatConnected = true; // Mettez à jour l'état de connexion
      await global.chatClient.say(global.connectedUser.login, "Test du bot réussi après reconnexion !");
      return res.json({ message: "Message envoyé avec succès après reconnexion." });
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi du message de test :", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi du message de test." });
  }
});

module.exports = router;
