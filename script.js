const startYear = 2016; // Début de la frise
const endYear = 2026;   // Fin de la frise
const totalYears = endYear - startYear + 1;
const totalMonths = totalYears * 12;

// Définir une largeur fixe par mois pour garantir un alignement parfait
const MONTH_WIDTH = 40;
const YEAR_WIDTH = MONTH_WIDTH * 12;
const TIMELINE_WIDTH = totalMonths * MONTH_WIDTH;

// Palette de couleurs pour les clans
const clanColors = [
    "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe",
    "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080"
];

// Fonction pour afficher les années
function generateYears() {
    const yearsContainer = document.getElementById("years");
    yearsContainer.innerHTML = "";
    yearsContainer.style.position = "relative";
    yearsContainer.style.width = TIMELINE_WIDTH + "px";

    for (let year = startYear; year <= endYear; year++) {
        const yearDiv = document.createElement("div");
        yearDiv.style.position = "absolute";
        yearDiv.style.left = ((year - startYear) * YEAR_WIDTH) + "px";
        yearDiv.textContent = year;
        yearDiv.style.color = "#aaa";
        yearDiv.style.fontSize = "0.9rem";
        yearDiv.style.top = "0";
        yearsContainer.appendChild(yearDiv);
    }
}

// Fonction pour générer les segments des clans
function generateTimeline(clans) {
    const container = document.getElementById("clan-container");
    container.innerHTML = "";
    container.style.position = "relative";
    container.style.width = TIMELINE_WIDTH + "px";

    const rowHeight = 40;

    clans.forEach((clan, index) => {
        const clanColor = clanColors[index % clanColors.length];

        clan.segments.forEach((segment) => {
            const segmentDiv = document.createElement("div");
            segmentDiv.className = "segment";
            segmentDiv.style.backgroundColor = clanColor;

            // Extraction des années et mois depuis le segment
            const [segStartYear, segStartMonth] = segment.start.split("-").map(Number);
            const [segEndYear, segEndMonth] = segment.end.split("-").map(Number);

            // Calcul des offsets en mois par rapport à la frise de départ
            const startOffset = ((segStartYear - startYear) * 12) + (segStartMonth - 1);
            const endOffset = ((segEndYear - startYear) * 12) + (segEndMonth - 1);

            const left = startOffset * MONTH_WIDTH;
            const width = (endOffset - startOffset + 1) * MONTH_WIDTH;

            // Position verticale : chaque clan est sur une ligne distincte
            const top = index * rowHeight;

            // Positionnement des segments
            segmentDiv.style.position = "absolute";
            segmentDiv.style.left = `${left}px`;
            segmentDiv.style.width = `${width}px`;
            segmentDiv.style.top = `${top}px`;
            segmentDiv.textContent = `${segment.name} (${segment.start} - ${segment.end})`;

            container.appendChild(segmentDiv);

            // Affichage du leader si présent
            if (segment.leader) {
                const leaderLabel = document.createElement("div");
                leaderLabel.className = "leader";
                leaderLabel.style.position = "absolute";
                leaderLabel.style.left = `${left}px`;
                leaderLabel.style.top = `${top - 20}px`;
                leaderLabel.textContent = `Leader: ${segment.leader}`;
                container.appendChild(leaderLabel);
            }
        });
    });

    container.style.height = `${clans.length * rowHeight}px`;
}

// Fonction pour charger les données des clans
function loadClans() {
    fetch("data.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erreur lors du chargement des données.");
            }
            return response.json();
        })
        .then((data) => {
            generateYears();
            generateTimeline(data);
        })
        .catch((error) => {
            console.error("Erreur:", error);
        });
}

window.onload = loadClans;
