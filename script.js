// Constantes globales
const startYear = 2016;
const endYear = 2025;
const totalYears = endYear - startYear + 1;
const totalMonths = totalYears * 12;

// Largeur par mois (base)
const BASE_MONTH_WIDTH = 50;
let MONTH_WIDTH = BASE_MONTH_WIDTH;
let YEAR_WIDTH = MONTH_WIDTH * 12;
let TIMELINE_WIDTH = totalMonths * MONTH_WIDTH;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let originalClansData = [];

// Variables pour le zoom et le pan
let currentZoom = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_SPEED = 0.1;
const MONTH_HIDE_THRESHOLD = 0.6; // Augmenté pour cacher les mois plus tôt

// Variables pour le pan
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let scrollLeft = 0;
let scrollTop = 0;

// Fonction utilitaire pour parser une date "YYYY-MM" en un nombre (année * 12 + mois)
function parseDateStr(str) {
    if (!str) return null;
    const parts = str.split("-");
    if (parts.length < 2) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    return y * 12 + m;
}

function updateDimensions() {
    MONTH_WIDTH = BASE_MONTH_WIDTH * currentZoom;
    YEAR_WIDTH = MONTH_WIDTH * 12;
    TIMELINE_WIDTH = totalMonths * MONTH_WIDTH;
}

function updateZoomIndicator() {
    const indicator = document.getElementById("zoom-indicator");
    if (indicator) {
        indicator.textContent = `Zoom: ${Math.round(currentZoom * 100)}%`;
    }
}

function generateYears() {
    const timelineContainer = document.getElementById("timeline-container");
    const yearsContainer = document.querySelector(".years");
    yearsContainer.innerHTML = "";
    yearsContainer.style.position = "relative";

    // S'assurer que la largeur est au moins celle du conteneur
    const containerWidth = timelineContainer.clientWidth;
    const calculatedWidth = Math.max(TIMELINE_WIDTH, containerWidth);
    yearsContainer.style.width = calculatedWidth + "px";
    yearsContainer.style.height = "25px";

    for (let year = startYear; year <= endYear; year++) {
        const yearDiv = document.createElement("div");
        yearDiv.style.position = "absolute";
        yearDiv.style.left = ((year - startYear) * YEAR_WIDTH) + "px";
        yearDiv.textContent = year;
        yearDiv.style.color = "#fff";
        yearDiv.style.fontSize = "1rem";
        yearDiv.style.fontWeight = "bold";
        yearDiv.style.top = "0";
        yearsContainer.appendChild(yearDiv);
    }
}

function generateMonths() {
    const timelineContainer = document.getElementById("timeline-container");
    const monthsContainer = document.querySelector(".months");
    monthsContainer.innerHTML = "";
    monthsContainer.style.position = "relative";

    // Cacher les mois si le zoom est trop petit
    if (currentZoom < MONTH_HIDE_THRESHOLD) {
        monthsContainer.style.display = "none";
        return;
    } else {
        monthsContainer.style.display = "block";
    }

    // S'assurer que la largeur est au moins celle du conteneur
    const containerWidth = timelineContainer.clientWidth;
    const calculatedWidth = Math.max(TIMELINE_WIDTH, containerWidth);
    monthsContainer.style.width = calculatedWidth + "px";
    monthsContainer.style.height = "20px";

    for (let i = 0; i < totalMonths; i++) {
        const monthIndex = i % 12;
        const monthName = monthNames[monthIndex];
        const monthDiv = document.createElement("div");
        monthDiv.style.position = "absolute";
        monthDiv.style.left = (i * MONTH_WIDTH) + "px";
        monthDiv.textContent = monthName;
        monthDiv.style.color = "#999";
        monthDiv.style.fontSize = "0.75rem";
        monthDiv.style.top = "0";
        monthsContainer.appendChild(monthDiv);
    }
}

function generateTimeline(clans) {
    const container = document.getElementById("clan-container");
    const timelineContainer = document.getElementById("timeline-container");
    container.innerHTML = "";
    container.style.position = "relative";

    // S'assurer que la largeur est au moins celle du conteneur
    const containerWidth = timelineContainer.clientWidth;
    const calculatedWidth = Math.max(TIMELINE_WIDTH, containerWidth);
    container.style.width = calculatedWidth + "px";

    const rowHeight = 40;
    const tooltip = document.getElementById("tooltip");

    clans.forEach((clan, index) => {
        const clanColor = clan.color || "#ffffff";

        clan.segments.forEach((segment) => {
            const segmentDiv = document.createElement("div");
            segmentDiv.className = "segment";
            segmentDiv.style.backgroundColor = clanColor;

            const [segStartYear, segStartMonth] = segment.start.split("-").map(Number);
            const [segEndYear, segEndMonth] = segment.end === "?"
                ? [endYear, 12]
                : segment.end.split("-").map(Number);

            const startOffset = ((segStartYear - startYear) * 12) + (segStartMonth - 1);
            const endOffset = ((segEndYear - startYear) * 12) + (segEndMonth - 1);

            const left = startOffset * MONTH_WIDTH;
            const width = (endOffset - startOffset + 1) * MONTH_WIDTH;
            const top = index * rowHeight;

            segmentDiv.style.position = "absolute";
            segmentDiv.style.left = `${left}px`;
            segmentDiv.style.width = `${width}px`;
            segmentDiv.style.top = `${top}px`;
            segmentDiv.textContent = `${segment.name} (${segment.start} - ${segment.end})`;

            // Fonction pour assombrir une couleur (pour le gradient)
            const darkenColor = (color, amount = 20) => {
                const num = parseInt(color.replace("#", ""), 16);
                const r = Math.max(0, (num >> 16) - amount);
                const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
                const b = Math.max(0, (num & 0x0000FF) - amount);
                return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
            };

            const darkColor = darkenColor(clanColor, 30);

            const segmentInfo = `
                <div class="tooltip-header" style="background: linear-gradient(135deg, ${clanColor}, ${darkColor});">${segment.name}</div>
                <div class="tooltip-row"><span class="tooltip-label">Region:</span> <span class="tooltip-value">${clan.mainRegion}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">Period:</span> <span class="tooltip-value">${segment.start} - ${segment.end}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">Leader:</span> <span class="tooltip-value">${segment.leader}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">Active:</span> <span class="tooltip-value">${clan.isActive ? "✓ Yes" : "✗ No"}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">Reputation:</span> <span class="tooltip-value">${clan.isCheaterClan ? "⚠ Cheaters" : "✓ Fair"}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">Type:</span> <span class="tooltip-value">${clan.isClan ? "Clan" : "Team"}</span></div>
            `;

            segmentDiv.addEventListener("mouseenter", () => {
                tooltip.innerHTML = segmentInfo;
                tooltip.style.display = "block";
            });

            segmentDiv.addEventListener("mousemove", (e) => {
                const containerRect = timelineContainer.getBoundingClientRect();
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;

                const mouseX = e.clientX - containerRect.left;
                const mouseY = (e.clientY + 170) - containerRect.top;

                let tooltipLeft = mouseX - (tooltipWidth / 2);
                if (tooltipLeft < 0) tooltipLeft = 0;
                const maxLeft = containerRect.width - tooltipWidth;
                if (tooltipLeft > maxLeft) {
                    tooltipLeft = maxLeft;
                }

                const tooltipTop = mouseY - tooltipHeight;

                tooltip.style.left = tooltipLeft + "px";
                tooltip.style.top = tooltipTop + "px";
            });

            segmentDiv.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
            });

            container.appendChild(segmentDiv);
        });
    });

    // Ajuster la hauteur du conteneur en fonction du nombre de clans
    container.style.height = `${clans.length * rowHeight}px`;
}

function refreshTimeline(clans) {
    updateDimensions();
    generateYears();
    generateMonths();
    generateTimeline(clans);
    updateZoomIndicator();
}

function initializeZoom() {
    const timelineContainer = document.getElementById("timeline-container");

    // Calculer le zoom initial pour voir toute la timeline
    const containerWidth = window.innerWidth - 340; // Soustraire la largeur du panneau de filtre
    const initialZoom = containerWidth / (totalMonths * BASE_MONTH_WIDTH);
    currentZoom = Math.max(MIN_ZOOM, Math.min(initialZoom * 0.9, 1));

    refreshTimeline(originalClansData);
}

function setupZoom() {
    const timelineContainer = document.getElementById("timeline-container");

    timelineContainer.addEventListener("wheel", (e) => {
        // Zoom uniquement avec Ctrl+molette
        if (!e.ctrlKey) return;

        e.preventDefault();

        const rect = timelineContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Position relative dans le contenu avant le zoom
        const scrollX = timelineContainer.scrollLeft;
        const scrollY = timelineContainer.scrollTop;
        const relativeX = (scrollX + mouseX) / TIMELINE_WIDTH;
        const relativeY = (scrollY + mouseY) / currentZoom;

        // Calculer le nouveau zoom
        const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));

        if (newZoom !== currentZoom) {
            currentZoom = newZoom;

            // Récupérer les données filtrées actuelles
            const currentClans = getCurrentFilteredClans();
            refreshTimeline(currentClans);

            // Mettre à jour après le refresh
            updateZoomIndicator();

            // Ajuster le scroll pour garder le point sous la souris
            const newTimelineWidth = totalMonths * BASE_MONTH_WIDTH * currentZoom;
            timelineContainer.scrollLeft = relativeX * newTimelineWidth - mouseX;
            timelineContainer.scrollTop = relativeY * currentZoom - mouseY;
        }
    }, { passive: false });
}

function setupPan() {
    const timelineContainer = document.getElementById("timeline-container");

    timelineContainer.addEventListener("mousedown", (e) => {
        // Ignorer si on clique sur un segment (pour garder le tooltip fonctionnel)
        if (e.target.classList.contains("segment")) return;

        isPanning = true;
        startPanX = e.clientX;
        startPanY = e.clientY;
        scrollLeft = timelineContainer.scrollLeft;
        scrollTop = timelineContainer.scrollTop;
        timelineContainer.style.cursor = "grabbing";
        e.preventDefault();
    });

    timelineContainer.addEventListener("mousemove", (e) => {
        if (!isPanning) return;

        const deltaX = e.clientX - startPanX;
        const deltaY = e.clientY - startPanY;

        timelineContainer.scrollLeft = scrollLeft - deltaX;
        timelineContainer.scrollTop = scrollTop - deltaY;
    });

    timelineContainer.addEventListener("mouseup", () => {
        isPanning = false;
        timelineContainer.style.cursor = "grab";
    });

    timelineContainer.addEventListener("mouseleave", () => {
        isPanning = false;
        timelineContainer.style.cursor = "grab";
    });

    // Empêcher la sélection de texte pendant le pan
    timelineContainer.addEventListener("selectstart", (e) => {
        if (isPanning) e.preventDefault();
    });
}

function getCurrentFilteredClans() {
    const form = document.getElementById("filter-form");
    if (!form) return originalClansData;

    const segmentNameVal = form.segmentName.value.trim().toLowerCase();
    const isCheaterClanVal = form.isCheaterClan.value;
    const isClanVal = form.isClan.value;
    const isActiveVal = form.isActive.value;
    const mainRegionVal = form.mainRegion.value;
    const startDateVal = form.startDate.value;
    const endDateVal = form.endDate.value;

    const filterCheater = isCheaterClanVal === "" ? null : (isCheaterClanVal === "true");
    const filterClan = isClanVal === "" ? null : (isClanVal === "true");
    const filterActive = isActiveVal === "" ? null : (isActiveVal === "true");
    const filterRegion = mainRegionVal === "" ? null : mainRegionVal;

    const filterStartDate = parseDateStr(startDateVal);
    const filterEndDate = parseDateStr(endDateVal);

    return originalClansData.filter(clan => {
        if (filterCheater !== null && clan.isCheaterClan !== filterCheater) return false;
        if (filterClan !== null && clan.isClan !== filterClan) return false;
        if (filterActive !== null && clan.isActive !== filterActive) return false;
        if (filterRegion !== null && clan.mainRegion !== filterRegion) return false;

        const segmentFits = clan.segments.some(seg => {
            if (segmentNameVal && !seg.name.toLowerCase().includes(segmentNameVal)) return false;

            if (filterStartDate !== null) {
                const segStart = parseDateStr(seg.start);
                if (segStart < filterStartDate) return false;
            }

            if (filterEndDate !== null) {
                const segEnd = parseDateStr(seg.end);
                if (segEnd > filterEndDate) return false;
            }

            return true;
        });

        if (!segmentFits) return false;
        return true;
    });
}

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

            clans.sort((a, b) => {
                const aStartDates = a.segments.map(s => parseDateStr(s.start)).filter(d => d !== null);
                const bStartDates = b.segments.map(s => parseDateStr(s.start)).filter(d => d !== null);
                const aMin = Math.min(...aStartDates);
                const bMin = Math.min(...bStartDates);
                return aMin - bMin;
            });

            originalClansData = clans;

            // Initialiser avec un zoom adapté
            initializeZoom();

            // Configurer les contrôles
            setupZoom();
            setupPan();
        })
        .catch((error) => {
            console.error("Erreur:", error);
        });
}

// Écouteur sur le formulaire de filtre
document.getElementById("filter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const filteredData = getCurrentFilteredClans();
    refreshTimeline(filteredData);
});

// Recalculer le zoom initial si la fenêtre change de taille
window.addEventListener("resize", () => {
    initializeZoom();
});

window.onload = loadClans;