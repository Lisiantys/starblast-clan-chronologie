// Constantes globales
const startYear = 2016;
const endYear = 2025;
const totalYears = endYear - startYear + 1;
const totalMonths = totalYears * 12;

// Largeur par mois
const MONTH_WIDTH = 50;
const YEAR_WIDTH = MONTH_WIDTH * 12;
const TIMELINE_WIDTH = totalMonths * MONTH_WIDTH;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    const yearsContainer = document.querySelector(".years");
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
    const monthsContainer = document.querySelector(".months");
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
        // Utiliser la couleur du clan définie dans le JSON
        const clanColor = clan.color || "#ffffff";

        clan.segments.forEach((segment) => {
            const segmentDiv = document.createElement("div");
            segmentDiv.className = "segment";
            segmentDiv.style.backgroundColor = clanColor;

            // Parsing de la date de début et de fin du segment
            const [segStartYear, segStartMonth] = segment.start.split("-").map(Number);
            const [segEndYear, segEndMonth] = segment.end === "?"
                ? [endYear, 12] // si '?' on prend la fin de la frise comme limite
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

            const segmentInfo = `
                <hr/>
                <div><strong>${segment.name}</strong></div>
                <div>Play in <strong>${clan.mainRegion}</strong></div>
                <div>${segment.start} - ${segment.end}</div>
                <div><strong>Leader :</strong> ${segment.leader}</div>
                <div><strong>Currently Active :</strong> ${clan.isActive ? "Yes" : "No"}</div>
                <div><strong>Cheating :</strong> ${clan.isCheaterClan ? "Yes" : "No"}</div>
                <div><strong>Clan :</strong> ${clan.isClan ? "Yes" : "No"}</div>
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
}

function loadClans() {
    fetch("data.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erreur lors du chargement des données.");
            }
            // Ici on gère le cas où les données peuvent inclure des arrays ou des objets.
            // On suppose que le data.json renvoie un tableau de clans.  
            // Si ce n'est pas le cas, on adaptera ici la logique pour extraire le tableau de clans.
            return response.json();
        })
        .then((data) => {
            // data peut être un tableau ou un objet complexe.
            // Vérifions si data est un tableau:
            let clans = Array.isArray(data) ? data : [];

            // Si ce n'est pas un tableau, il faut peut-être extraire les données autrement
            // Exemple : if (data.clans && Array.isArray(data.clans)) { clans = data.clans; }

            // On trie les clans du plus récent au plus ancien.
            // Critère: date la plus récente du premier segment
            // On récupère la date de début du premier segment et on trie par ordre décroissant.
            clans.sort((a, b) => {
                // Trouver la date du premier segment (le plus ancien segment) pour chaque clan
                const aStartDates = a.segments.map(s => parseDateStr(s.start)).filter(d => d !== null);
                const bStartDates = b.segments.map(s => parseDateStr(s.start)).filter(d => d !== null);
                const aMin = Math.min(...aStartDates);
                const bMin = Math.min(...bStartDates);

                // On veut du plus récent au plus ancien, donc on compare à l'envers :
                // Si aMin > bMin, alors a est plus récent (plus grande date)
                return aMin - bMin; // Plus ancien au plus récent
            });

            originalClansData = clans;
            generateYears();
            generateMonths();
            generateTimeline(clans);
        })
        .catch((error) => {
            console.error("Erreur:", error);
        });
}



// Écouteur sur le formulaire de filtre
document.getElementById("filter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;

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

    const filteredData = originalClansData.filter(clan => {
        // Filtres booléens & région
        if (filterCheater !== null && clan.isCheaterClan !== filterCheater) return false;
        if (filterClan !== null && clan.isClan !== filterClan) return false;
        if (filterActive !== null && clan.isActive !== filterActive) return false;
        if (filterRegion !== null && clan.mainRegion !== filterRegion) return false;

        // Maintenant filtrage sur les segments
        // On veut au moins un segment qui matche tous les critères segments
        const segmentFits = clan.segments.some(seg => {
            // Filtre par nom de segment
            if (segmentNameVal && !seg.name.toLowerCase().includes(segmentNameVal)) return false;

            // Filtre par date : le segment doit commencer après startDate si défini
            if (filterStartDate !== null) {
                const segStart = parseDateStr(seg.start);
                if (segStart < filterStartDate) return false;
            }

            // Filtre par date de fin : segment doit finir avant endDate si défini
            if (filterEndDate !== null) {
                const segEnd = parseDateStr(seg.end);
                if (segEnd > filterEndDate) return false;
            }

            return true;
        });

        if (!segmentFits) return false;
        return true;
    });

    generateTimeline(filteredData);
});

window.onload = loadClans;
