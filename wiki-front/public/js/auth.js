// Vérifiez que l'élément avec l'ID 'login-btn' existe avant d'ajouter l'écouteur
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            // ID client Twitch
            const clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi'; // Remplacez par votre propre Client ID Twitch
            
            // URL de redirection configurée dans Twitch Developer Console
            const redirectUri = 'https://wikidefi.fr/php/index.php/auth/callback'; // Remplacez par votre URL de redirection
            
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
