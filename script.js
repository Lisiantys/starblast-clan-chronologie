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
let currentFilteredClans = [];

// Variables pour le zoom et le pan
let currentZoom = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_SPEED = 0.02; // Changé de 0.1 à 0.02 pour zoom 2 par 2
const MONTH_HIDE_THRESHOLD = 0.6;

// Variables pour le pan
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let scrollLeft = 0;
let scrollTop = 0;

// Variables pour le pinch-to-zoom mobile
let initialPinchDistance = 0;
let initialZoomLevel = 1;

// Variables pour les paramètres
let settings = {
    displayMode: 'normal' // normal par défaut, pas de sélection UI
};

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
        indicator.textContent = `${Math.round(currentZoom * 100)}%`;
    }
}

function generateYears() {
    const timelineContainer = document.getElementById("timeline-container");
    const yearsContainer = document.querySelector(".years");
    yearsContainer.innerHTML = "";
    yearsContainer.style.position = "relative";

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

    if (currentZoom < MONTH_HIDE_THRESHOLD) {
        monthsContainer.style.display = "none";
        return;
    } else {
        monthsContainer.style.display = "block";
    }

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

function generateLabels(clans) {
    const labelsContainer = document.querySelector(".clan-labels");
    if (!labelsContainer) return;

    // Créer ou récupérer le conteneur interne
    let innerContainer = labelsContainer.querySelector(".clan-labels-inner");
    if (!innerContainer) {
        innerContainer = document.createElement("div");
        innerContainer.className = "clan-labels-inner";
        labelsContainer.appendChild(innerContainer);
    }

    innerContainer.innerHTML = "";
    const rowHeight = settings.displayMode === 'compact' ? 30 :
        settings.displayMode === 'extended' ? 50 : 40;

    // Calculer le padding-top pour aligner avec la timeline
    // Years = 25px + 10px margin = 35px
    // Months = 20px + 15px margin = 35px (si visible)
    const yearsHeight = 35;
    const monthsHeight = currentZoom >= MONTH_HIDE_THRESHOLD ? 35 : 0;
    const topPadding = yearsHeight + monthsHeight + 10; // +10 pour le padding du clan-container

    innerContainer.style.paddingTop = `${topPadding}px`;

    clans.forEach((clan, index) => {
        const labelDiv = document.createElement("div");
        labelDiv.className = "clan-label";
        labelDiv.style.top = `${index * rowHeight}px`;
        labelDiv.style.height = `${rowHeight}px`;
        labelDiv.style.lineHeight = `${rowHeight}px`;
        labelDiv.textContent = clan.name;
        labelDiv.style.backgroundColor = clan.color;
        labelDiv.title = clan.fullName || clan.name;
        innerContainer.appendChild(labelDiv);
    });

    // Important : définir la hauteur totale du conteneur interne
    const totalHeight = clans.length * rowHeight + topPadding;
    innerContainer.style.height = `${totalHeight}px`;

    // Synchroniser immédiatement
    setTimeout(() => syncLabelsScroll(), 0);
}

function syncLabelsScroll() {
    const timelineContainer = document.getElementById("timeline-container");
    const labelsContainer = document.querySelector(".clan-labels");

    if (timelineContainer && labelsContainer) {
        // Synchroniser le scroll vertical
        labelsContainer.scrollTop = timelineContainer.scrollTop;
    }
}

function setupScrollSync() {
    const timelineContainer = document.getElementById("timeline-container");

    if (timelineContainer) {
        // Écouter le scroll de la timeline
        timelineContainer.addEventListener("scroll", () => {
            syncLabelsScroll();
        });
    }
}

function generateTimeline(clans) {
    const container = document.getElementById("clan-container");
    const timelineContainer = document.getElementById("timeline-container");
    container.innerHTML = "";
    container.style.position = "relative";

    const containerWidth = timelineContainer.clientWidth;
    const calculatedWidth = Math.max(TIMELINE_WIDTH, containerWidth);
    container.style.width = calculatedWidth + "px";

    const rowHeight = settings.displayMode === 'compact' ? 30 :
        settings.displayMode === 'extended' ? 50 : 40;
    const segmentHeight = settings.displayMode === 'compact' ? 20 :
        settings.displayMode === 'extended' ? 30 : 24;

    const tooltip = document.getElementById("tooltip");

    clans.forEach((clan, index) => {
        const clanColor = clan.color || "#ffffff";

        clan.segments.forEach((segment) => {
            const segmentDiv = document.createElement("div");
            segmentDiv.className = "segment";
            segmentDiv.style.backgroundColor = clanColor;
            segmentDiv.style.height = `${segmentHeight}px`;
            segmentDiv.style.lineHeight = `${segmentHeight}px`;

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
            segmentDiv.dataset.clanName = clan.name;

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
                <div class="tooltip-body">
                    <div class="tooltip-row"><span class="tooltip-label">Region :</span> <span class="tooltip-value">${clan.mainRegion}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Period :</span> <span class="tooltip-value">${segment.start} - ${segment.end}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Leader :</span> <span class="tooltip-value">${segment.leader}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Active :</span> <span class="tooltip-value">${clan.isActive ? "Yes" : "No"}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Reputation :</span> <span class="tooltip-value">${clan.isCheaterClan ? "Cheaters" : "Fair"}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Type :</span> <span class="tooltip-value">${clan.isClan ? "Clan" : "Team"}</span></div>
                </div>
            `;

            segmentDiv.addEventListener("mouseenter", () => {
                tooltip.innerHTML = segmentInfo;
                tooltip.style.display = "block";
                segmentDiv.style.filter = "brightness(1.2)";
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
                segmentDiv.style.filter = "none";
            });

            container.appendChild(segmentDiv);
        });
    });

    container.style.height = `${clans.length * rowHeight}px`;
    generateLabels(clans);
}

function refreshTimeline(clans) {
    currentFilteredClans = clans;
    updateDimensions();
    generateYears();
    generateMonths();
    generateTimeline(clans);
    updateZoomIndicator();

    // IMPORTANT : Synchroniser après le refresh
    setTimeout(() => syncLabelsScroll(), 50);
}

function initializeZoom() {
    const timelineContainer = document.getElementById("timeline-container");

    // Calculer la largeur disponible selon la taille d'écran
    let availableWidth = window.innerWidth;

    // Soustraire le panneau de filtres si visible
    if (window.innerWidth > 768) {
        availableWidth -= 340; // Panneau de filtre
    }
    if (window.innerWidth > 1024) {
        availableWidth -= 200; // Labels
    }

    const containerWidth = availableWidth - 40; // Soustraire padding
    const initialZoom = containerWidth / (totalMonths * BASE_MONTH_WIDTH);
    currentZoom = Math.max(MIN_ZOOM, Math.min(initialZoom * 0.9, 1));
    refreshTimeline(originalClansData);
}

function setupZoom() {
    const timelineContainer = document.getElementById("timeline-container");

    // Zoom avec Ctrl+molette
    timelineContainer.addEventListener("wheel", (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();

        const rect = timelineContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scrollX = timelineContainer.scrollLeft;
        const scrollY = timelineContainer.scrollTop;
        const relativeX = (scrollX + mouseX) / TIMELINE_WIDTH;
        const relativeY = (scrollY + mouseY) / currentZoom;

        const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));

        if (newZoom !== currentZoom) {
            currentZoom = newZoom;
            const currentClans = getCurrentFilteredClans();
            refreshTimeline(currentClans);
            updateZoomIndicator();

            const newTimelineWidth = totalMonths * BASE_MONTH_WIDTH * currentZoom;
            timelineContainer.scrollLeft = relativeX * newTimelineWidth - mouseX;
            timelineContainer.scrollTop = relativeY * currentZoom - mouseY;
        }
    }, { passive: false });

    // Pinch-to-zoom pour mobile
    timelineContainer.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            initialPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            initialZoomLevel = currentZoom;
        }
    }, { passive: false });

    timelineContainer.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            const scale = currentDistance / initialPinchDistance;
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoomLevel * scale));

            if (Math.abs(newZoom - currentZoom) > 0.01) {
                currentZoom = newZoom;
                const currentClans = getCurrentFilteredClans();
                refreshTimeline(currentClans);
                updateZoomIndicator();
            }
        }
    }, { passive: false });
}

function setupPan() {
    const timelineContainer = document.getElementById("timeline-container");

    // Support souris
    timelineContainer.addEventListener("mousedown", (e) => {
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

    timelineContainer.addEventListener("selectstart", (e) => {
        if (isPanning) e.preventDefault();
    });

    // Support tactile (mobile)
    timelineContainer.addEventListener("touchstart", (e) => {
        if (e.target.classList.contains("segment")) return;

        const touch = e.touches[0];
        isPanning = true;
        startPanX = touch.clientX;
        startPanY = touch.clientY;
        scrollLeft = timelineContainer.scrollLeft;
        scrollTop = timelineContainer.scrollTop;
    }, { passive: true });

    timelineContainer.addEventListener("touchmove", (e) => {
        if (!isPanning) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - startPanX;
        const deltaY = touch.clientY - startPanY;

        timelineContainer.scrollLeft = scrollLeft - deltaX;
        timelineContainer.scrollTop = scrollTop - deltaY;
    }, { passive: true });

    timelineContainer.addEventListener("touchend", () => {
        isPanning = false;
    }, { passive: true });
}

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        // Ctrl + 0 : Reset zoom
        if (e.ctrlKey && e.key === "0") {
            e.preventDefault();
            currentZoom = 1;
            refreshTimeline(currentFilteredClans);
        }

        // Ctrl + + : Zoom in
        if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
            e.preventDefault();
            currentZoom = Math.min(MAX_ZOOM, currentZoom + ZOOM_SPEED);
            refreshTimeline(currentFilteredClans);
        }

        // Ctrl + - : Zoom out
        if (e.ctrlKey && e.key === "-") {
            e.preventDefault();
            currentZoom = Math.max(MIN_ZOOM, currentZoom - ZOOM_SPEED);
            refreshTimeline(currentFilteredClans);
        }
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

// Fonctions pour les contrôles
function resetFilters() {
    document.getElementById("filter-form").reset();
    refreshTimeline(originalClansData);
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
            currentFilteredClans = clans;

            // Initialiser la timeline
            initializeZoom();

            // Configurer les contrôles
            setupZoom();
            setupPan();
            setupScrollSync(); // IMPORTANT : Configurer la synchronisation du scroll
            setupKeyboardShortcuts();

            // Forcer une première synchronisation
            setTimeout(() => syncLabelsScroll(), 100);
        })
        .catch((error) => {
            console.error("Erreur:", error);
        });
}

// Event listeners
document.getElementById("filter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const filteredData = getCurrentFilteredClans();
    refreshTimeline(filteredData);
});

document.getElementById("reset-filters")?.addEventListener("click", resetFilters);

// Menu mobile
document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
    const filterPanel = document.getElementById("filter-panel");
    filterPanel.classList.toggle("open");
});

// Fermer le menu mobile en cliquant en dehors
document.addEventListener("click", (e) => {
    const filterPanel = document.getElementById("filter-panel");
    const menuBtn = document.getElementById("mobile-menu-btn");

    if (window.innerWidth <= 768 &&
        filterPanel.classList.contains("open") &&
        !filterPanel.contains(e.target) &&
        e.target !== menuBtn) {
        filterPanel.classList.remove("open");
    }
});

window.addEventListener("resize", () => {
    initializeZoom();
});

window.onload = loadClans;