const clans = [
    { name: "TDR", start: 2022, end: 2025, color: "#FF5733" },
    { name: "Royal Clans", start: 2018, end: 2023, color: "#C70039" },
    { name: "Valhalla", start: 2019, end: 2022, color: "#900C3F" },
    { name: "ARC", start: 2020, end: 2025, color: "#581845" },
    { name: "STACK", start: 2017, end: 2021, color: "#FFC300" },
    { name: "DOGE", start: 2021, end: 2024, color: "#DAF7A6" },
    { name: "X4F", start: 2023, end: 2025, color: "#3498DB" },
    { name: "RR", start: 2016, end: 2020, color: "#A569BD" },
];

const startYear = 2016; // Début de la frise
const endYear = 2026;   // Fin de la frise

// Fonction pour afficher les années
function generateYears() {
    const yearsContainer = document.getElementById("years");
    yearsContainer.innerHTML = ""; // Réinitialiser les années
    for (let year = startYear; year <= endYear; year++) {
        const yearDiv = document.createElement("div");
        yearDiv.style.flex = "1";
        yearDiv.textContent = year;
        yearsContainer.appendChild(yearDiv);
    }
}

// Fonction pour générer les segments des clans
function generateTimeline() {
    const container = document.getElementById("clan-container");
    container.innerHTML = ""; // Réinitialiser les segments
    const totalYears = endYear - startYear + 1;
    const containerWidth = container.offsetWidth;
    const yearWidth = containerWidth / totalYears;
    const rowHeight = 40;

    clans.forEach((clan, index) => {
        const segment = document.createElement("div");
        segment.className = "segment";
        segment.style.backgroundColor = clan.color;

        // Empêcher les segments de dépasser 2025
        const adjustedEnd = Math.min(clan.end, 2025);

        // Correction de la largeur (on ne rajoute pas d'année supplémentaire)
        const left = (clan.start - startYear) * yearWidth;
        const width = (adjustedEnd - clan.start) * yearWidth;

        // Position verticale
        const top = index * rowHeight;

        // Application des styles
        segment.style.left = `${left}px`;
        segment.style.width = `${width}px`;
        segment.style.top = `${top}px`;
        segment.textContent = `${clan.name} (${clan.start} - ${adjustedEnd})`;

        container.appendChild(segment);
    });

    // Ajuster la hauteur du conteneur
    container.style.height = `${clans.length * rowHeight}px`;
}

window.onload = () => {
    generateYears();
    generateTimeline();
};
