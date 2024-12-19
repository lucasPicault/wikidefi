(async function checkAuthStatus() {
    try {
        const response = await fetch('https://api.wikidefi.fr/auth/status', {
            method: 'GET',
            credentials: 'include', // Inclure les cookies pour les sessions
        });

        if (!response.ok) {
            throw new Error('Erreur réseau ou de serveur');
        }

        const data = await response.json();

        if (!data.authenticated) {
            console.log('Redirection vers Twitch pour authentification.');
            window.location.href = 'https://api.wikidefi.fr/auth/login';
        } else {
            console.log('Utilisateur connecté :', data.user);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification :', error);
    }
})();
