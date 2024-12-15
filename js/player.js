let sessionCode = window.location.pathname.replace('/', '').toUpperCase();
let gameId = null;
let refreshInterval = null;
let scoreboardInterval = null;
let isLaunched = false;
let waitingInterval = null;

async function joinSession() {
  const resp = await fetch('/session/join', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ sessionCode })
  });

  if (resp.ok) {
    const data = await resp.json();
    if (!data.isLaunched) {
      document.getElementById('info').innerText = data.message || 'En attente du lancement...';
      document.getElementById('waiting-message').style.display = 'block';
      startWaitingForLaunch();
    } else {
      onGameLaunched(data);
    }
  } else {
    const err = await resp.json();
    document.getElementById('info').innerText = "Erreur: " + err.error;
  }
}

function startWaitingForLaunch() {
  if (waitingInterval) clearInterval(waitingInterval);
  waitingInterval = setInterval(checkIfLaunched, 5000);
}

async function checkIfLaunched() {
  const resp = await fetch(`/session/state/${sessionCode}`);
  if (resp.ok) {
    const stateData = await resp.json();
    if (stateData.isLaunched) {
      clearInterval(waitingInterval);
      waitingInterval = null;
      joinAfterLaunch();
    }
  }
}

async function joinAfterLaunch() {
  const resp = await fetch('/session/join', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ sessionCode })
  });
  
  if (resp.ok) {
    const data = await resp.json();
    if (data.isLaunched) {
      onGameLaunched(data);
    } else {
      document.getElementById('info').innerText = "Toujours pas lancé, réessaie...";
      startWaitingForLaunch();
    }
  } else {
    const err = await resp.json();
    document.getElementById('info').innerText = "Erreur: " + err.error;
  }
}

function onGameLaunched(data) {
  isLaunched = true;
  gameId = data.gameId;
  document.getElementById('waiting-message').style.display = 'none';
  
  // Mettre à jour le titre de la page et le h1 avec le pseudo du joueur
  if (data.player) {
    document.title = "Wiki Game - " + data.player;
    document.getElementById('page-title').innerText = "Wiki Game - " + data.player;
  }

  document.getElementById('info').innerText = `Page: ${data.currentPage} | Objectif: ${data.targetPage} | Temps: ${data.elapsedTime}s`;
  document.getElementById('game-content').style.display = 'block';
  updateGameContent(data);
  startRealTimeUpdates();
  startScoreboardUpdates();
}

function updateGameContent(data) {
  const pageContentDiv = document.getElementById('page-content');
  pageContentDiv.innerHTML = data.htmlContent || 'Pas de contenu';

  document.getElementById('info').innerText = `Page: ${data.currentPage} | Objectif: ${data.targetPage} | Temps: ${data.elapsedTime}s`;

  const linksInPage = pageContentDiv.querySelectorAll('a[href^="/wiki/"]');
  linksInPage.forEach(a => {
    let pageName = decodeURIComponent(a.getAttribute('href').replace('/wiki/', ''));
    pageName = pageName.replace(/_/g, ' ');
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      if (data.status === 'in-progress' && isLaunched) {
        const moveResp = await fetch(`/game/${gameId}/move`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ nextPage: pageName })
        });
        const moveData = await moveResp.json();
        if (moveResp.ok) {
          updateGameContent(moveData);
        } else {
          alert("Erreur: " + moveData.error);
        }
      } else {
        alert("La partie n'est pas lancée ou est terminée.");
      }
    });
  });
}

function startRealTimeUpdates() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(async () => {
    const resp = await fetch(`/game/${gameId}`);
    if (resp.ok) {
      const data = await resp.json();
      updateGameContent(data);
    }
  }, 2000);
}

async function updateScoreboard() {
    const resp = await fetch(`/scoreboard/${sessionCode}`);
    if (resp.ok) {
      const scores = await resp.json();
      const scoreboardDiv = document.getElementById('scoreboard');
  
      if (scores.length === 0) {
        scoreboardDiv.innerHTML = "<p>Aucun score pour le moment.</p>";
        return;
      }
  
      let html = "<table><tr><th>Position</th><th>Pseudo</th><th>Temps (s)</th><th>Nb liens cliqués</th><th>Chemin</th></tr>";
      scores.forEach(s => {
        const path = s.visited.join(" → "); // Chemin des pages visitées
        html += `<tr>
                   <td>${s.position}</td>
                   <td>${s.player}</td>
                   <td>${s.finalTime}</td>
                   <td>${s.moves}</td>
                   <td>${path}</td>
                 </tr>`;
      });
      html += "</table>";
      scoreboardDiv.innerHTML = html;
    }
  }

function startScoreboardUpdates() {
  if (scoreboardInterval) clearInterval(scoreboardInterval);
  scoreboardInterval = setInterval(updateScoreboard, 5000);
  updateScoreboard();
}

// Premier appel pour tenter de rejoindre
joinSession();