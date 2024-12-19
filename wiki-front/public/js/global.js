const API_URL = 'https://wikidefi.fr/api';

// Vérifier la connexion de l'utilisateur
async function verifyUser() {
  const user = localStorage.getItem('twitch_user');

  if (user) {
    console.log("Utilisateur trouvé :", JSON.parse(user));
    return JSON.parse(user);
  } else {
    const params = new URLSearchParams(window.location.search);

    if (!params.has('code')) {
      console.log('Redirection vers Twitch pour la connexion...');
      redirectToTwitch();
    } else {
      console.log('Code de connexion détecté, traitement...');
      await handleTwitchCallback();
    }
  }
}

// Redirection vers Twitch
function redirectToTwitch() {
  fetch(`${API_URL}auth/twitch`)
    .then(response => response.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Erreur lors de la récupération de l’URL de connexion Twitch.');
      }
    })
    .catch(error => console.error('Erreur :', error));
}

// Callback après connexion
async function handleTwitchCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    try {
      const response = await fetch(`${API_URL}auth/twitch/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.user && data.access_token) {
        localStorage.setItem('twitch_user', JSON.stringify(data.user));
        localStorage.setItem('twitch_access_token', data.access_token);
        console.log("Connexion réussie :", data.user);
      } else {
        console.error('Erreur lors de la récupération des informations utilisateur :', data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel au back-end :', error);
    }
  }
}

// Exécution au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  verifyUser();
});
