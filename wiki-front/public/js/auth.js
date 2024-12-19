(async function checkAuthStatus() {
    const response = await fetch('https://api.wikidefi.fr/auth/status');
    const data = await response.json();

    if (!data.authenticated) {
        console.log('Redirection vers Twitch pour authentification.');
        window.location.href = 'https://api.wikidefi.fr/auth/login';
    } else {
        console.log('Utilisateur connecté :', data.user);
    }
})();

