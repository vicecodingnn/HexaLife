function startGame() {
    alert("Le jeu a commencé !");
   // Initialiser l'état du jeu 
    let gameState = {
        health: 100,
        happiness: 100,
        money: 50
    };
}

    // Afficher les informations du jeu
    document.getElementById("gameInfo").style.display = "block";
    document.getElementById("health").textContent = "Santé: " + gameState.health;
    document.getElementById("happiness").textContent = "Happiness: " + gameState.happiness;
    document.getElementById("money").textContent = "Argent: " + gameState.money;

    // Mettre à jour les informations du jeu toutes les secondes
    setInterval(function() {
        // Mettre à jour les informations du jeu
        document.getElementById("health").textContent = "Santé: " + gameState.health;
        document.getElementById("happiness").textContent = "Happiness: " + gameState.happiness;
        document.getElementById("money").textContent = "Argent: " + gameState.money;
    }, 1000);





 



 



