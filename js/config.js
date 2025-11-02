// config.js - Configuration et constantes globales

const CONFIG = {
    // Période temporelle
    startYear: 2016,
    endYear: 2025,

    // Dimensions de base
    BASE_MONTH_WIDTH: 50,

    // Paramètres de zoom
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 3,
    ZOOM_SPEED: 0.02,
    MONTH_HIDE_THRESHOLD: 0.6,

    // Noms des mois
    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

    // Mode d'affichage
    settings: {
        displayMode: 'normal' // normal, compact, extended
    }
};

// Variables calculées
CONFIG.totalYears = CONFIG.endYear - CONFIG.startYear + 1;
CONFIG.totalMonths = CONFIG.totalYears * 12;

// Variables d'état global
const STATE = {
    // Données
    originalClansData: [],
    currentFilteredClans: [],

    // Dimensions actuelles
    MONTH_WIDTH: CONFIG.BASE_MONTH_WIDTH,
    YEAR_WIDTH: CONFIG.BASE_MONTH_WIDTH * 12,
    TIMELINE_WIDTH: CONFIG.totalMonths * CONFIG.BASE_MONTH_WIDTH,

    // Zoom et pan
    currentZoom: 1,
    isPanning: false,
    startPanX: 0,
    startPanY: 0,
    scrollLeft: 0,
    scrollTop: 0,

    // Mobile
    initialPinchDistance: 0,
    initialZoomLevel: 1
};