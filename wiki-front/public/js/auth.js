document.getElementById('login-btn').addEventListener('click', () => {
    const clientId = '8x8rp1xpim5kjpywfjvrsrizsxizxi'; // Remplacez par votre Client ID Twitch
    const redirectUri = encodeURIComponent('https://wikidefi.fr/php/index.php/auth/callback'); // URL de redirection OAuth
    const scope = encodeURIComponent('user:read:email'); // Permissions nécessaires
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

    // Redirige l'utilisateur vers la page d'authentification de Twitch
    window.location.href = authUrl;
});
