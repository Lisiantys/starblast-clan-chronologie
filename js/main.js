// main.js

function loadClans() {
    fetch("data.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erreur lors du chargement des données.");
            }
            return response.json();
        })
        .then((data) => {
            let clans = Array.isArray(data) ? data : [];

            // Trier les clans par date de début
            clans.sort((a, b) => {
                const aStartDates = a.segments.map(s => parseDateStr(s.start)).filter(d => d !== null);
                const bStartDates = b.segments.map(s => parseDateStr(s.start)).filter(d => d !== null);
                const aMin = Math.min(...aStartDates);
                const bMin = Math.min(...bStartDates);
                return aMin - bMin;
            });

            STATE.originalClansData = clans;
            STATE.currentFilteredClans = clans;

            // Initialiser la timeline
            initializeZoom();

            // Configurer les contrôles
            setupZoom();
            setupPan();
            setupScrollSync();
            setupKeyboardShortcuts();

            // Configurer les événements de filtre
            setupFilterEvents();
            setupMobileMenu();

            // Forcer une première synchronisation
            setTimeout(() => syncLabelsScroll(), 100);
        })
        .catch((error) => {
            console.error("Erreur:", error);
            // Optionnel : afficher un message d'erreur à l'utilisateur
            const container = document.getElementById("clan-container");
            if (container) {
                container.innerHTML = `<div style="color: red; padding: 20px;">
                    Erreur lors du chargement des données : ${error.message}
                </div>`;
            }
        });
}

// Listener pour le redimensionnement de fenêtre
window.addEventListener("resize", () => {
    initializeZoom();
});

// Initialisation au chargement de la page
window.onload = function () {
    console.log("Initialisation de Starblast Clans Timeline...");
    loadClans();
};