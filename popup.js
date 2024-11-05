// Fonction pour convertir les millisecondes en heures, minutes et secondes
function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
}

// Récupère le temps passé aujourd'hui et le total hebdomadaire depuis le stockage
function updatePopup() {
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

    chrome.storage.local.get(['dailyData'], (result) => {
        const dailyData = result.dailyData || {};
        
        // Temps passé aujourd'hui
        const todayTime = dailyData[today] || 0;
        
        // Calcule le temps total de la semaine
        let weeklyTime = 0;
        const currentDate = new Date();
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i)
                            .toISOString().slice(0, 10);
            weeklyTime += dailyData[day] || 0;
        }

        // Affiche les résultats dans le popup
        document.getElementById('todayTime').textContent = formatTime(todayTime);
        document.getElementById('weeklyTime').textContent = formatTime(weeklyTime);
    });
}


// Fonction pour initialiser et gérer le rafraîchissement toutes les secondes
function startRefreshing() {
    updatePopup();  // Rafraîchir immédiatement à l'ouverture

    // Définir un intervalle pour mettre à jour toutes les secondes
    const refreshInterval = setInterval(updatePopup, 1000);

    // Nettoyer l'intervalle lorsque le popup est fermé
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearInterval(refreshInterval);
        }
    });
}

// Initialise le rafraîchissement à l'ouverture du popup
document.addEventListener('DOMContentLoaded', startRefreshing);