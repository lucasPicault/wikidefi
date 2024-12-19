let sessionCode = null;
const API_URL = 'https://api.wikidefi.fr/';

// Vérifier si l'utilisateur est déjà connecté
function checkLogin() {
  const user = localStorage.getItem('twitch_user');
  const params = new URLSearchParams(window.location.search);

  if (user) {
    console.log('Utilisateur connecté trouvé :', JSON.parse(user));
    return JSON.parse(user);
  }

  // Si aucun utilisateur n'est trouvé et aucun code n'est présent, redirige vers Twitch
  if (!params.has('code')) {
    console.log('Aucun utilisateur connecté, redirection vers Twitch...');
    connectToTwitch();
  }
}


// Rediriger l'utilisateur vers Twitch pour se connecter
function connectToTwitch() {
  fetch(`${API_URL}auth/twitch`)
    .then(response => response.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url; // Redirection vers Twitch
      } else {
        console.error('Erreur lors de la récupération de l’URL de connexion Twitch.');
      }
    })
    .catch(error => {
      console.error('Erreur :', error);
    });
}

// Gestion du callback après connexion
function handleTwitchCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    console.log('Code détecté, envoi au back-end pour échange...');

    // Envoyer le code au back-end pour obtenir le token et les informations utilisateur
    fetch(`${API_URL}auth/twitch/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.user && data.access_token) {
          console.log('Utilisateur reçu du back-end :', data.user);

          // Sauvegarder les infos utilisateur dans le localStorage
          localStorage.setItem('twitch_user', JSON.stringify(data.user));
          localStorage.setItem('twitch_access_token', data.access_token);

          // Nettoyer l'URL pour enlever le "code"
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          window.history.replaceState(null, '', url.toString());
        } else {
          console.error('Erreur lors de la récupération des informations utilisateur :', data);
        }
      })
      .catch(error => {
        console.error('Erreur lors de l\'appel au back-end :', error);
      });
  }
}


// Appeler la fonction de gestion au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  if (params.has('code')) {
    console.log('Code détecté dans l\'URL, traitement...');
    handleTwitchCallback(); // Traite le paramètre code
  } else {
    console.log('Aucun code détecté, vérification de la connexion...');
    checkLogin(); // Vérifie si l'utilisateur est connecté
  }
});

//--------------------
//-----LOGIN--FIN-----
//--------------------


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
    const resp = await fetch(`${API_URL}session/create`, {
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
    const resp = await fetch(`${API_URL}session/launch`, {
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
    const resp = await fetch(`${API_URL}session/end`, {
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
document.getElementById('save-bot-config').addEventListener('click', async () => {
  const botToken = document.getElementById('bot-token').value;

  if (!botToken) {
    alert("Veuillez renseigner le token du bot.");
    return;
  } 

  try {
    const response = await fetch(`${API_URL}bot/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botUsername: "Bot", botToken }), // "Bot" est utilisé ici comme nom d'utilisateur
    });

    const result = await response.json();
    console.log('Réponse du back-end :', result);

    if (response.ok) {
      document.getElementById('bot-config-status').textContent = result.message;
      document.getElementById('test-bot-config').disabled = false;
    } else {
      alert(result.error || 'Erreur lors de la configuration du bot.');
    }
  } catch (error) {
    console.error('Erreur lors de l\'appel au back-end :', error);
    alert('Une erreur est survenue. Consultez la console pour plus de détails.');
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
