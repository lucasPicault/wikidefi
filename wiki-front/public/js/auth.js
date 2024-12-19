(async function checkAuthStatus() {
    try {
        const response = await fetch('/api/index.php/auth/status', {
            method: 'GET',
            credentials: 'include', // Inclure les cookies pour les sessions
        });

        if (!response.ok) {
            throw new Error('Erreur réseau ou serveur');
        }

        const data = await response.json();

        if (!data.authenticated) {
            console.log('Redirection vers Twitch pour authentification.');
            // Redirigez l'utilisateur directement vers l'URL d'autorisation Twitch
            const clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi';
            const redirectUri = encodeURIComponent('https://wikidefi.fr/api/index.php/auth/callback');
            const scope = encodeURIComponent('user:read:email');
            const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
            window.location.href = twitchAuthUrl;
        } else {
            console.log('Utilisateur connecté :', data.user);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification :', error);
    }
})();
