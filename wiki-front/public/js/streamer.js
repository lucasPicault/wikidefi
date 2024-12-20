let sessionCode = null;

// Création de la session
document.getElementById('create-session').addEventListener('click', async () => {
  const startInput = document.getElementById('start-page').value.trim();
  const endInput = document.getElementById('end-page').value.trim();

  if (!startInput || !endInput) {
    alert("Veuillez entrer les pages de départ et d'arrivée.");
    return;
  }

  // Validation des pages
  const startValidation = await validateWikipediaPage(startInput);
  const endValidation = await validateWikipediaPage(endInput);

  if (!startValidation.valid || !endValidation.valid) {
    alert("Une ou plusieurs des pages saisies n'existent pas sur Wikipedia. Veuillez vérifier vos entrées.");
    return;
  }

  // Récupération des titres normalisés et des URLs
  const normalizedStart = startValidation.normalizedTitle;
  const normalizedEnd = endValidation.normalizedTitle;

  try {
    const resp = await fetch('/session/create', { // Correction ici
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: normalizedStart, end: normalizedEnd })
    });

    if (resp.ok) {
      const data = await resp.json();
      sessionCode = data.sessionCode;

      // Mise à jour de l'interface avec les informations de session
      document.getElementById('session-info').innerHTML = `
        <strong>Session créée</strong>: ${data.sessionCode}<br>
        <strong>Page de départ</strong>: <a href="${startValidation.pageUrl}" target="_blank">${normalizedStart}</a><br>
        <strong>Page d'arrivée</strong>: <a href="${endValidation.pageUrl}" target="_blank">${normalizedEnd}</a>
      `;
      toggleSessionCreation(false); // Désactiver la création et afficher les options de gestion
    } else {
      const error = await resp.json();
      alert("Erreur : " + error.error);
    }
  } catch (error) {
    console.error("Erreur lors de la requête fetch :", error);
    alert("Une erreur est survenue. Consultez la console pour plus de détails.");
  }
});

// Lancer la partie
document.getElementById('launch-game').addEventListener('click', async () => {
  if (!sessionCode) {
    alert("Aucune session créée.");
    return;
  }

  try {
    const resp = await fetch('/session/launch', { // Correction ici
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode })
    });

    if (resp.ok) {
      alert("La partie est maintenant lancée !");
      onSessionStarted(); // Activer le bouton "Fin de partie"
    } else {
      const error = await resp.json();
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
    const resp = await fetch('/session/end', { // Correction ici
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode })
    });

    if (resp.ok) {
      const data = await resp.json();
      alert(data.message); // Notification pour le streamer

      // Réinitialiser l'interface
      sessionCode = null;
      document.getElementById('session-info').innerText = "";
      toggleSessionCreation(true); // Réactiver la création
      disableButtons(); // Désactiver les boutons inutiles
    } else {
      const error = await resp.json();
      alert("Erreur : " + error.error);
    }
  } catch (error) {
    console.error("Erreur lors de la fin de session :", error);
  }
});


// Configuration et test du bot
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-bot-config').addEventListener('click', async () => {
      const botUsername = document.getElementById('bot-username').value.trim();
      const botToken = document.getElementById('bot-token').value.trim();

      if (!botUsername || !botToken) {
          document.getElementById('bot-config-status').innerText = "Veuillez remplir tous les champs.";
          return;
      }

      try {
          const resp = await fetch('https://api.wikidefi.fr/bot/configure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ botUsername, botToken }),
          });

          if (resp.ok) {
              document.getElementById('bot-config-status').innerText = "Configuration enregistrée avec succès.";
              document.getElementById('test-bot-config').disabled = false;
          } else {
              const error = await resp.json();
              document.getElementById('bot-config-status').innerText = "Erreur : " + error.error;
          }
      } catch (error) {
          console.error("Erreur lors de l'enregistrement du bot :", error);
      }
  });

  document.getElementById('test-bot-config').addEventListener('click', async () => {
      try {
          const resp = await fetch('https://api.wikidefi.fr/bot/test', { method: 'POST' });

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
