// utils.js - Fonctions utilitaires

// Parser une date "YYYY-MM" en un nombre (année * 12 + mois)
function parseDateStr(str) {
    if (!str) return null;
    const parts = str.split("-");
    if (parts.length < 2) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    return y * 12 + m;
}

// Mettre à jour les dimensions selon le zoom
function updateDimensions() {
    STATE.MONTH_WIDTH = CONFIG.BASE_MONTH_WIDTH * STATE.currentZoom;
    STATE.YEAR_WIDTH = STATE.MONTH_WIDTH * 12;
    STATE.TIMELINE_WIDTH = CONFIG.totalMonths * STATE.MONTH_WIDTH;
}

// Mettre à jour l'indicateur de zoom
function updateZoomIndicator() {
    const indicator = document.getElementById("zoom-indicator");
    if (indicator) {
        indicator.textContent = `${Math.round(STATE.currentZoom * 100)}%`;
    }
}

// Déterminer si un segment est cheater
function isSegmentCheater(segment, clan) {
    // Si le segment a une valeur isCheating définie, l'utiliser
    if (segment.isCheating !== undefined) {
        return segment.isCheating;
    }
    // Sinon, utiliser la valeur par défaut du clan
    return clan.isCheaterClan;
}

// Obtenir le texte de réputation pour un segment
function getSegmentReputation(segment, clan) {
    const isCheater = isSegmentCheater(segment, clan);

    // Si le segment a une valeur différente du clan, l'indiquer
    if (segment.isCheating !== undefined && segment.isCheating !== clan.isCheaterClan) {
        if (isCheater) {
            return "Cheaters (during this period)";
        } else {
            return "Fair (reformed)";
        }
    }

    return isCheater ? "Cheaters" : "Fair";
}

// Assombrir une couleur
function darkenColor(color, amount = 20) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}