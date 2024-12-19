async function checkAuthStatus() {
    const response = await fetch('/api.php/auth/status');
    const data = await response.json();

    if (data.authenticated) {
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('logout-button').style.display = 'block';
        console.log('Utilisateur connecté :', data.user);
    } else {
        document.getElementById('login-button').style.display = 'block';
        document.getElementById('logout-button').style.display = 'none';
        console.log('Utilisateur non connecté.');
    }
}

// Vérification au chargement
checkAuthStatus();
