// Variables pour stocker le temps de début de session et l'ID du timer
let startTime = null;
let activeTabId = null;
let timer = null;

// Stocker les données de temps par jour
let dailyData = {};

// Initialisation des données
function initializeData() {
    chrome.storage.local.get(['dailyData'], (result) => {
        dailyData = result.dailyData || {};
    });
}

// Met à jour le temps passé aujourd'hui
function updateDailyTime() {
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    const now = Date.now();

    if (startTime) {
        const elapsedTime = now - startTime;

        if (!dailyData[today]) {
            dailyData[today] = 0;
        }

        dailyData[today] += elapsedTime;

        // Sauvegarde les données
        chrome.storage.local.set({ dailyData });
    }

    // Met à jour le début de session pour le nouvel intervalle
    startTime = now;
}

// Démarre le timer si l'onglet est sur app.studi.fr
function startTimer() {
    if (timer) clearInterval(timer); // Stop any existing timer

    timer = setInterval(() => {
        // Vérifie si l'onglet actif est sur app.studi.fr
        if (activeTabId !== null) {
            chrome.tabs.get(activeTabId, (tab) => {
                if (tab && tab.url.includes('app.studi.fr')) {
                    updateDailyTime();
                } else {
                    // Si l'onglet n'est pas sur le site, arrêtez le timer
                    clearInterval(timer);
                    timer = null; // Réinitialiser le timer
                }
            });
        }
    }, 1000); // Mettez à jour toutes les secondes
}

// Écoute les changements d'onglets
chrome.tabs.onActivated.addListener((activeInfo) => {
    handleTabChange(activeInfo.tabId);
});

// Écoute les changements de mise à jour des onglets (par exemple, le rechargement ou le changement de domaine)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        handleTabChange(tabId);
    }
});

// Fonction pour gérer les changements d'onglet
function handleTabChange(tabId) {
    if (activeTabId !== null) {
        // Sauvegarder le temps écoulé pour l'ancien onglet
        updateDailyTime();
    }

    // Récupérer le nouvel onglet
    chrome.tabs.get(tabId, (tab) => {
        if (tab && tab.url && tab.url.includes('app.studi.fr')) {
            activeTabId = tabId;
            startTime = Date.now();
            startTimer(); // Démarrer le timer
        } else {
            activeTabId = null;
            startTime = null;
            clearInterval(timer); // Arrêtez le timer si ce n'est pas le bon onglet
            timer = null;
        }
    });
}

// Fonction pour calculer le temps total de la semaine
function getWeeklyTime(callback) {
    chrome.storage.local.get(['dailyData'], (result) => {
        const weeklyData = result.dailyData || {};
        let totalWeekTime = 0;
        const currentDate = new Date();

        // Calcule le temps passé pour chaque jour de la semaine courante
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i)
                .toISOString().slice(0, 10);
            totalWeekTime += weeklyData[day] || 0;
        }
        callback(totalWeekTime);
    });
}

// Au démarrage de l'extension, initialise les données
chrome.runtime.onStartup.addListener(initializeData);
chrome.runtime.onInstalled.addListener(initializeData);

// Gère le déchargement de l'onglet actif (fermeture ou changement d'onglet)
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        if (activeTabId !== null) {
            updateDailyTime();
        }
    }
});
