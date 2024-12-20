// Vérifiez que l'élément avec l'ID 'login-btn' existe avant d'ajouter l'écouteur
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            // ID client Twitch
            const clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi'; // Remplacez par votre propre Client ID Twitch
            
            // URL de redirection configurée dans Twitch Developer Console
            const redirectUri = 'https://api.wikidefi.fr/auth/callback'; // Remplacez par votre URL de redirection
            
            // Scopes nécessaires pour l'application (ici, accès à l'email de l'utilisateur)
            const scope = 'user:read:email';

            // Construire l'URL d'autorisation OAuth
            const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

            // Redirige l'utilisateur vers Twitch pour l'authentification
            console.log("Redirection vers :", authUrl); // Debug
            window.location.href = authUrl;
        });
    } else {
        console.error("Le bouton avec l'ID 'login-btn' n'a pas été trouvé.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Appel API pour récupérer les données utilisateur
    fetch('https://api.wikidefi.fr/auth/info', {
        method: 'GET',
        credentials: 'include', // Inclut les cookies pour accéder à la session PHP
    })
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                console.log('Données utilisateur récupérées :', data.user);

                // Stocker les données utilisateur dans le local storage
                localStorage.setItem('twitch_user', JSON.stringify(data.user));

                alert('Bienvenue, ' + data.user.display_name + ' !');
            } else {
                console.error('Utilisateur non authentifié');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données utilisateur :', error);
        });
});

