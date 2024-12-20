let sessionCode = null;

// Création de la session
document.getElementById('create-session').addEventListener('click', async () => {
  const startPage = document.getElementById('start-page').value.trim();
  const endPage = document.getElementById('end-page').value.trim();

  if (!startPage || !endPage) {
    alert("Veuillez remplir les champs de départ et de fin.");
    return;
  }

  // Validation des pages via l'API Wikipedia
  const startValidation = await validateWikipediaPage(startPage);
  const endValidation = await validateWikipediaPage(endPage);

  if (!startValidation.valid || !endValidation.valid) {
    alert("Les pages saisies ne sont pas valides sur Wikipedia.");
    return;
  }

  try {
    const response = await fetch('https://api.wikidefi.fr/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: startValidation.normalizedTitle,
        end: endValidation.normalizedTitle,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      sessionCode = data.sessionCode;

      document.getElementById('session-info').innerHTML = `
        <p><strong>Session créée :</strong> ${sessionCode}</p>
        <p><strong>Départ :</strong> ${startValidation.normalizedTitle}</p>
        <p><strong>Fin :</strong> ${endValidation.normalizedTitle}</p>
      `;
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
      const botToken = document.getElementById('bot-token').value.trim();
      const clientId = document.getElementById('client-id').value.trim();

      if (!botToken) {
          document.getElementById('bot-config-status').innerText = "Veuillez entrer un token.";
          return;
      }
      if (!clientId) {
        document.getElementById('bot-config-status').innerText = "Veuillez entrer un client ID.";
        return;
      }

      try {
          const resp = await fetch('https://api.wikidefi.fr/bot/configure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ botToken, clientId }),
          });

          if (resp.ok) {
              document.getElementById('bot-config-status').innerText = "Token enregistré avec succès.";
              document.getElementById('test-bot-config').disabled = false;
          } else {
              const error = await resp.json();
              document.getElementById('bot-config-status').innerText = "Erreur : " + error.error;
          }
      } catch (error) {
          console.error("Erreur lors de l'enregistrement du token :", error);
      }
  });

  document.getElementById('test-bot-config').addEventListener('click', async () => {
      try {
          const resp = await fetch('https://api.wikidefi.fr/bot/test', { method: 'POST' });

          if (resp.ok) {
              document.getElementById('bot-config-status').innerText = "Message de test envoyé avec succès.";
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
      return { valid: false };
    }

    return {
      valid: true,
      normalizedTitle: pages[pageId].title,
    };
  } catch (error) {
    console.error("Erreur lors de la validation de la page :", error);
    return { valid: false };
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
