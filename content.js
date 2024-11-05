// Crée un élément de conteneur pour le compteur
const container = document.createElement('div');
container.style.position = 'absolute';
container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
container.style.color = 'white';
container.style.borderRadius = '10px';
container.style.padding = '0px';
container.style.zIndex = '9999';
container.style.display = 'flex';
container.style.gap = '10px';
container.style.flexDirection = 'column';
container.style.cursor = 'move'; // Pour permettre le déplacement
document.body.appendChild(container);

// Ajouter le contenu HTML
container.innerHTML = `
    <div style="display: flex; flex-direction: row; align-items: center; padding-inline: 5px;">
        <h2 style="padding-top: 5px; margin-block: 0; font-size: 1.5em;">Studi Time Tracker</h2>
        <ul style="padding-block: 5px; margin-block: 0; padding-left: 0; padding-inline: 20px; list-style: none; font-size: 1.25em; display: flex; justify-content: center; align-items: center; gap: 20px;">
            <li style="text-wrap: nowrap">
                Temps de travail aujourd'hui: <br><strong id="todayTime">0:00</strong>
            </li>
            <li style="text-wrap: nowrap">
                Temps sur la semaine: <br><strong id="weeklyTime">0:00</strong>
            </li>
        </ul>
    </div>
`;

// Fonction pour formater le temps
function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
}

// Fonction pour lire et mettre à jour le temps à partir de chrome.storage
function refreshTimeDisplay() {
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    chrome.storage.local.get(['dailyData'], (result) => {
        const dailyData = result.dailyData || {};
        const todayTime = dailyData[today] || 0;

        // Calculer le temps total de la semaine (lundi à dimanche)
        let weeklyTime = 0;
        const currentDate = new Date();
        
        // Trouver le jour de la semaine (0=dimanche, 1=lundi, ..., 6=samedi)
        const currentDay = currentDate.getDay();
        
        // Calculer le premier jour de la semaine (lundi)
        const firstDayOfWeek = new Date(currentDate);
        firstDayOfWeek.setDate(currentDate.getDate() - (currentDay + 6) % 7); // Remonter jusqu'au lundi

        // Calcule le temps passé pour chaque jour de la semaine courante (lundi à dimanche)
        for (let i = 0; i < 7; i++) {
            const day = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate() + i)
                .toISOString().slice(0, 10); // Format YYYY-MM-DD
            
            weeklyTime += dailyData[day] || 0;
        }

        // Met à jour l'affichage
        document.getElementById('todayTime').textContent = formatTime(todayTime);
        document.getElementById('weeklyTime').textContent = formatTime(weeklyTime);
    });
}

// Met à jour l'affichage toutes les secondes
setInterval(refreshTimeDisplay, 1000);

// Fonction pour récupérer et appliquer la position stockée
function loadPosition() {
    chrome.storage.local.get(['containerPosition'], (result) => {
        const position = result.containerPosition || { left: '30px', top: '20px' }; // Valeurs par défaut
        container.style.left = position.left;
        container.style.top = position.top;
    });
}

// Fonction pour stocker la position du conteneur
function savePosition() {
    const left = container.style.left;
    const top = container.style.top;
    chrome.storage.local.set({ containerPosition: { left, top } });
}

// Permettre le déplacement de l'élément
let isDragging = false;
let offsetX, offsetY;

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - container.getBoundingClientRect().left;
    offsetY = e.clientY - container.getBoundingClientRect().top;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        container.style.left = `${e.clientX - offsetX}px`;
        container.style.top = `${e.clientY - offsetY}px`;
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        savePosition(); // Sauvegarde la position lors du relâchement
    }
});

// Charger la position du conteneur au démarrage
loadPosition();

// Récupérer le temps initial et l'afficher
refreshTimeDisplay();
