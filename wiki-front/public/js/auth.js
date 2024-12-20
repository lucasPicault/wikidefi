document.addEventListener('DOMContentLoaded', () => {
    // Appel API pour vérifier si l'utilisateur est déjà connecté
    fetch('https://api.wikidefi.fr/auth/info', {
        method: 'GET',
        credentials: 'include', // Inclut les cookies pour accéder à la session PHP
    })
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                // L'utilisateur est connecté
                console.log('Utilisateur authentifié :', data.user);

                // Stocker les données utilisateur dans le local storage
                localStorage.setItem('twitch_user', JSON.stringify(data.user));
            } else {
                // L'utilisateur n'est pas authentifié, redirection automatique vers Twitch
                console.log('Utilisateur non authentifié, redirection vers Twitch.');

                // ID client Twitch
                const clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi'; // Remplacez par votre propre Client ID Twitch
                
                // URL de redirection configurée dans Twitch Developer Console
                const redirectUri = 'https://api.wikidefi.fr/auth/callback'; // Remplacez par votre URL de redirection
                
                // Scopes nécessaires pour l'application (ici, accès à l'email de l'utilisateur)
                const scope = 'user:read:email';

                // Construire l'URL d'autorisation OAuth
                const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

                // Redirige l'utilisateur vers Twitch pour l'authentification
                window.location.href = authUrl;
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification de l\'authentification :', error);
        });
});
