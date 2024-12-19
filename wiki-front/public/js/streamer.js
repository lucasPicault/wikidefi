let sessionCode = null;
const API_URL = '';

// Création de la session
document.getElementById('create-session').addEventListener('click', async () => {
  const startInput = document.getElementById('start-page').value.trim();
  const endInput = document.getElementById('end-page').value.trim();

  if (!startInput || !endInput) {
    alert("Veuillez entrer les pages de départ et d'arrivée.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: startInput, end: endInput }),
    });

    if (response.ok) {
      const data = await response.json();
      sessionCode = data.sessionCode;

      document.getElementById('session-info').innerHTML = `
        <strong>Session créée</strong>: ${sessionCode}<br>
        <strong>Page de départ</strong>: ${startInput}<br>
        <strong>Page d'arrivée</strong>: ${endInput}
      `;
      toggleSessionCreation(false);
    } else {
      const error = await response.json();
      alert("Erreur : " + error.error);
    }
  } catch (error) {
    console.error("Erreur lors de la création de session :", error);
  }
});


// Lancer la partie
document.getElementById('launch-game').addEventListener('click', async () => {
  if (!sessionCode) {
    alert("Aucune session créée.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}session/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode }),
    });

    if (response.ok) {
      alert("La partie est maintenant lancée !");
    } else {
      const error = await response.json();
      alert("Erreur : " + error.error);
    }
  } catch (error) {
    console.error("Erreur lors du lancement :", error);
  }
});


// Terminer la session
document.getElementById('end-session-btn').addEventListener('click', async () => {
  if (!sessionCode) {
    alert("Aucune session active.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode }),
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);

      sessionCode = null;
      document.getElementById('session-info').innerText = "";
      toggleSessionCreation(true);
    } else {
      const error = await response.json();
      alert("Erreur : " + error.error);
    }
  } catch (error) {
    console.error("Erreur lors de la fin de session :", error);
  }
});


// Configuration et test du bot
document.getElementById('save-bot-config').addEventListener('click', async () => {
  const botToken = document.getElementById('bot-token').value;

  if (!botToken) {
    alert("Veuillez renseigner le token du bot.");
    return;
  }

  const twitchUser = JSON.parse(localStorage.getItem('twitch_user'));

  if (!twitchUser || !twitchUser.login) {
    alert("Utilisateur non connecté.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}bot/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botUsername: "Bot",
        botToken: botToken,
        login: twitchUser.login, // Transmet le login au back-end
      }),
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById('bot-config-status').textContent = result.message;
    } else {
      alert(result.error || 'Erreur lors de la configuration du bot.');
    }
  } catch (error) {
    console.error('Erreur lors de la requête vers le back-end :', error);
    alert('Une erreur est survenue.');
  }
});

document.getElementById('test-bot-config').addEventListener('click', async () => {
  try {
    const resp = await fetch(`${API_URL}bot/test`, { method: 'POST' });

    if (resp.ok) {
      document.getElementById('bot-config-status').innerText = "Le bot a envoyé un message de test avec succès.";
    } else {
      const error = await resp.json();
      document.getElementById('bot-config-status').innerText = "Erreur lors du test : " + error.error;
    }
  } catch (error) {
    console.error("Erreur lors du test du bot :", error);
  }
});

// Suggestions pour les champs de texte
const startInput = document.getElementById("start-page");
const startSuggestions = document.getElementById("start-suggestions");

startInput.addEventListener("input", async () => handleInputSuggestions(startInput, startSuggestions));

const endInput = document.getElementById("end-page");
const endSuggestions = document.getElementById("end-suggestions");

endInput.addEventListener("input", async () => handleInputSuggestions(endInput, endSuggestions));

function handleInputSuggestions(inputElement, suggestionsElement) {
  const query = inputElement.value.trim();
  if (query.length > 2) {
    fetchSuggestions(query).then((suggestions) =>
      createSuggestionList(inputElement, suggestionsElement, suggestions)
    );
  } else {
    suggestionsElement.innerHTML = "";
  }
}

async function validateWikipediaPage(page) {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&format=json&origin=*`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId === "-1") {
      return { valid: false, normalizedTitle: null, pageUrl: null };
    }

    const pageInfo = pages[pageId];
    const normalizedTitle = pageInfo.title;
    const pageUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(normalizedTitle.replace(/ /g, '_'))}`;

    return { valid: true, normalizedTitle, pageUrl };
  } catch (error) {
    console.error("Erreur lors de la validation de la page Wikipedia :", error);
    return { valid: false, normalizedTitle: null, pageUrl: null };
  }
}

async function fetchSuggestions(query) {
  const response = await fetch(`https://fr.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(query)}&limit=10&namespace=0&origin=*`);
  if (response.ok) {
    const data = await response.json();
    return data[1];
  }
  return [];
}

function createSuggestionList(inputElement, suggestionsElement, suggestions) {
  suggestionsElement.innerHTML = "";
  suggestions.forEach((suggestion) => {
    const li = document.createElement("li");
    li.textContent = suggestion;
    li.addEventListener("click", () => {
      inputElement.value = suggestion;
      suggestionsElement.innerHTML = "";
    });
    suggestionsElement.appendChild(li);
  });
}

function toggleSessionCreation(show) {
  document.getElementById('session-creation').style.display = show ? 'block' : 'none';
  document.getElementById('launch-section').style.display = show ? 'none' : 'block';
}

function disableButtons() {
  document.getElementById('launch-game').disabled = true;
  document.getElementById('end-session-btn').disabled = true;
  document.getElementById('create-session').disabled = false;
}
