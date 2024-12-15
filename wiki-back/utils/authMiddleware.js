function requireTwitchAuth(req, res, next) {
    if (!global.connectedUser) {
      return res.status(401).json({ error: 'Vous devez être connecté via Twitch pour cette opération.' });
    }
    next();
  }
  
  module.exports = { requireTwitchAuth };
  