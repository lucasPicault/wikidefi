(async function checkAuthStatus() {
    const response = await fetch('https://wikidefi.fr/php/index.php/auth/status');
    const data = await response.json();
    console.log(response);

    if (!data.authenticated) {
        console.log('Redirection vers Twitch pour authentification.');
        window.location.href = 'https://wikidefi.fr/php/index.php/auth/login';
    } else {
        console.log('Utilisateur connecté :', data.user);
    }
})();

