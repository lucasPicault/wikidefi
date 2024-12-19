<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viewer - Saisir un code</title>
    <base href="/">
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/viewer.css">
</head>
<body>
    <div class="container">
        <h1>Vous êtes Viewer</h1>
        <p>Entrez le code de session fourni par le streamer :</p>
        <input 
            type="text" 
            id="session-code" 
            placeholder="Code session ex: ABC123" 
            aria-label="Code de session"
        />
        <br/>
        <button id="join-btn" role="button">Rejoindre la session</button>
    </div>
    <script>
        document.getElementById('join-btn').addEventListener('click', () => {
            const code = document.getElementById('session-code').value.trim();
            
            // Validation de base pour le code de session
            if (!code) {
                alert("Veuillez entrer un code de session.");
                return;
            }
            
            if (!/^[A-Za-z0-9]+$/.test(code)) {
                alert("Le code de session doit contenir uniquement des lettres et des chiffres.");
                return;
            }
            
            // Redirection vers l'URL basé sur le lien fixe
            const baseURL = "/";
            window.location.href = `${baseURL}${code}`;
        });
    </script>
    <script src="js/auth.js"></script>

</body>
</html>
