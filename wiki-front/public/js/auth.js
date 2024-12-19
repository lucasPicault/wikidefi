(async function checkAuthStatus() {
    const response = await fetch('/api.php/auth/status');
    const data = await response.json();

    if (!data.authenticated) {
        console.log('Redirection vers Twitch pour authentification.');
        window.location.href = '/api.php/auth/login';
    } else {
        console.log('Utilisateur connecté :', data.user);
    }
})();


// Vérification au chargement
checkAuthStatus();
