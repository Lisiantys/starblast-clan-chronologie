// Constantes globales
const startYear = 2016;
const endYear = 2026;
const totalYears = endYear - startYear + 1;
const totalMonths = totalYears * 12;

// Largeur par mois
const MONTH_WIDTH = 80;
const YEAR_WIDTH = MONTH_WIDTH * 12;
const TIMELINE_WIDTH = totalMonths * MONTH_WIDTH;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const clanColors = [
    "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe",
    "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080"
];

let originalClansData = [];

// Fonction utilitaire pour parser une date "YYYY-MM" en un nombre (année * 12 + mois)
function parseDateStr(str) {
    if (!str) return null;
    const parts = str.split("-");
    if (parts.length < 2) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    return y * 12 + m;
}

function generateYears() {
    const yearsContainer = document.getElementById("years");
    yearsContainer.innerHTML = "";
    yearsContainer.style.position = "relative";
    yearsContainer.style.width = TIMELINE_WIDTH + "px";
    yearsContainer.style.height = "20px";

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

function generateMonths() {
    const monthsContainer = document.getElementById("months");
    monthsContainer.innerHTML = "";
    monthsContainer.style.position = "relative";
    monthsContainer.style.width = TIMELINE_WIDTH + "px";
    monthsContainer.style.height = "20px";

    for (let i = 0; i < totalMonths; i++) {
        const monthIndex = i % 12;
        const monthName = monthNames[monthIndex];
        const monthDiv = document.createElement("div");
        monthDiv.style.position = "absolute";
        monthDiv.style.left = (i * MONTH_WIDTH) + "px";
        monthDiv.textContent = monthName;
        monthDiv.style.color = "#ccc";
        monthDiv.style.fontSize = "0.7rem";
        monthDiv.style.top = "0";
        monthsContainer.appendChild(monthDiv);
    }
}

function generateTimeline(clans) {
    const container = document.getElementById("clan-container");
    container.innerHTML = "";
    container.style.position = "relative";
    container.style.width = TIMELINE_WIDTH + "px";

    const rowHeight = 40;
    container.style.marginTop = "50px";
    const tooltip = document.getElementById("tooltip");
    const timelineContainer = document.getElementById("timeline-container");

    clans.forEach((clan, index) => {
        const clanColor = clanColors[index % clanColors.length];

        clan.segments.forEach((segment) => {
            const segmentDiv = document.createElement("div");
            segmentDiv.className = "segment";
            segmentDiv.style.backgroundColor = clanColor;

            const [segStartYear, segStartMonth] = segment.start.split("-").map(Number);
            const [segEndYear, segEndMonth] = segment.end.split("-").map(Number);

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

            const segmentInfo = `
                <hr/>
                <div><strong>${segment.name}</strong></div>
                <div><strong>Play in </strong> ${clan.mainRegion}</div>
                <div><strong>Start :</strong> ${segment.start}</div>
                <div><strong>End :</strong> ${segment.end}</div>
                <div><strong>Leader :</strong> ${segment.leader}</div>
                <div><strong>Currently Active : </strong> ${clan.isActive}</div>
                <div><strong>Active members :</strong> ${segment.playerCount}</div>
                <div><strong>Cheating : </strong> ${clan.isCheaterClan}</div>
                <div><strong>Team : </strong> ${clan.isTeam}</div>
            `;
            const tooltipContent = segmentInfo;

            segmentDiv.addEventListener("mouseenter", () => {
                tooltip.innerHTML = tooltipContent;
                tooltip.style.display = "block";
            });

            // Mise à jour de la position du tooltip par rapport à la souris
            segmentDiv.addEventListener("mousemove", (e) => {
                const containerRect = timelineContainer.getBoundingClientRect();
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;

                const mouseX = e.clientX - containerRect.left;
                const mouseY = (e.clientY + 120) - containerRect.top;

                // Centrage horizontal du tooltip par rapport à la souris
                let tooltipLeft = mouseX - (tooltipWidth / 2);
                if (tooltipLeft < 0) tooltipLeft = 0;
                const maxLeft = containerRect.width - tooltipWidth;
                if (tooltipLeft > maxLeft) {
                    tooltipLeft = maxLeft;
                }

                // Position au-dessus (avec l'ajout de 120px comme modifié)
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
            originalClansData = data;
            generateYears();
            generateMonths();
            generateTimeline(data);
        })
        .catch((error) => {
            console.error("Erreur:", error);
        });
}

// Écouteur sur le formulaire de filtre
document.getElementById("filter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;

    const nameVal = form.name.value.trim();
    const isCheaterClanVal = form.isCheaterClan.value;
    const isTeamVal = form.isTeam.value;
    const isActiveVal = form.isActive.value;
    const startDateVal = form.startDate.value; // "YYYY-MM"
    const endDateVal = form.endDate.value;     // "YYYY-MM"
    const minPlayerCountVal = form.minPlayerCount.value;
    const maxPlayerCountVal = form.maxPlayerCount.value;

    // Conversion des champs booléens
    const filterCheater = isCheaterClanVal === "" ? null : (isCheaterClanVal === "true");
    const filterTeam = isTeamVal === "" ? null : (isTeamVal === "true");
    const filterActive = isActiveVal === "" ? null : (isActiveVal === "true");

    const filterStartDate = parseDateStr(startDateVal);
    const filterEndDate = parseDateStr(endDateVal);

    const minPC = minPlayerCountVal ? parseInt(minPlayerCountVal, 10) : null;
    const maxPC = maxPlayerCountVal ? parseInt(maxPlayerCountVal, 10) : null;

    const filteredData = originalClansData.filter(clan => {
        // Filtre par nom
        if (nameVal && !clan.name.toLowerCase().includes(nameVal.toLowerCase())) {
            return false;
        }

        // Filtres booléens
        if (filterCheater !== null && clan.isCheaterClan !== filterCheater) return false;
        if (filterTeam !== null && clan.isTeam !== filterTeam) return false;
        if (filterActive !== null && clan.isActive !== filterActive) return false;

        // Filtres par date
        const clanStart = parseDateStr(clan.start);
        const clanEnd = parseDateStr(clan.end);
        if (filterStartDate !== null && clanStart < filterStartDate) return false;
        if (filterEndDate !== null && clanEnd > filterEndDate) return false;

        // Filtre par playerCount sur les segments
        if (minPC !== null || maxPC !== null) {
            // On vérifie si au moins un segment convient
            const segmentFits = clan.segments.some(seg => {
                const pc = seg.playerCount || 0;
                if (minPC !== null && pc < minPC) return false;
                if (maxPC !== null && pc > maxPC) return false;
                return true;
            });
            if (!segmentFits) return false;
        }

        return true;
    });

    generateTimeline(filteredData);
});

window.onload = loadClans;
