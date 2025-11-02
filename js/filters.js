// filters.js - Gestion des filtres

function getCurrentFilteredClans() {
    const form = document.getElementById("filter-form");
    if (!form) return STATE.originalClansData;

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

    return STATE.originalClansData.filter(clan => {
        // Pour le filtre cheater, vérifier si au moins un segment correspond
        if (filterCheater !== null) {
            const hasMatchingSegment = clan.segments.some(segment =>
                isSegmentCheater(segment, clan) === filterCheater
            );
            if (!hasMatchingSegment) return false;
        }

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

function resetFilters() {
    document.getElementById("filter-form").reset();
    refreshTimeline(STATE.originalClansData);
}

function setupFilterEvents() {
    // Formulaire de filtre
    document.getElementById("filter-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const filteredData = getCurrentFilteredClans();
        refreshTimeline(filteredData);
    });

    // Bouton reset
    document.getElementById("reset-filters")?.addEventListener("click", resetFilters);
}

function setupMobileMenu() {
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
}