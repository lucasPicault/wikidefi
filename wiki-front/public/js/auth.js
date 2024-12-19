(async function checkAuthStatus() {
    const response = await fetch('https://wikidefi.fr/api/index.php/auth/status');
    const data = await response.json();

    if (!data.authenticated) {
        console.log('Redirection vers Twitch pour authentification.');
        window.location.href = 'https://wikidefi.fr/api/index.php/auth/login';
    } else {
        console.log('Utilisateur connecté :', data.user);
    }
})();

