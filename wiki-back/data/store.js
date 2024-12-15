// Stockage en mémoire
module.exports = {
    sessions: {}, // sessions[sessionCode] = { start, end, scores: [], playersPlayed: Set() }
    games: {}      // games[gameId] = { sessionCode, currentPage, targetPage, visited, ... }
  };
  