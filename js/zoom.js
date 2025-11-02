// zoom.js - Gestion du zoom et du pan

function initializeZoom() {
    const timelineContainer = document.getElementById("timeline-container");

    let availableWidth = window.innerWidth;

    if (window.innerWidth > 768) {
        availableWidth -= 340; // Panneau de filtre
    }
    if (window.innerWidth > 1024) {
        availableWidth -= 200; // Labels
    }

    const containerWidth = availableWidth - 40;
    const initialZoom = containerWidth / (CONFIG.totalMonths * CONFIG.BASE_MONTH_WIDTH);
    STATE.currentZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(initialZoom * 0.9, 1));
    refreshTimeline(STATE.originalClansData);
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
        const relativeX = (scrollX + mouseX) / STATE.TIMELINE_WIDTH;
        const relativeY = (scrollY + mouseY) / STATE.currentZoom;

        const delta = e.deltaY > 0 ? -CONFIG.ZOOM_SPEED : CONFIG.ZOOM_SPEED;
        const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, STATE.currentZoom + delta));

        if (newZoom !== STATE.currentZoom) {
            STATE.currentZoom = newZoom;
            const currentClans = getCurrentFilteredClans();
            refreshTimeline(currentClans);
            updateZoomIndicator();

            const newTimelineWidth = CONFIG.totalMonths * CONFIG.BASE_MONTH_WIDTH * STATE.currentZoom;
            timelineContainer.scrollLeft = relativeX * newTimelineWidth - mouseX;
            timelineContainer.scrollTop = relativeY * STATE.currentZoom - mouseY;
        }
    }, { passive: false });

    // Pinch-to-zoom pour mobile
    timelineContainer.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            STATE.initialPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            STATE.initialZoomLevel = STATE.currentZoom;
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

            const scale = currentDistance / STATE.initialPinchDistance;
            const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, STATE.initialZoomLevel * scale));

            if (Math.abs(newZoom - STATE.currentZoom) > 0.01) {
                STATE.currentZoom = newZoom;
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

        STATE.isPanning = true;
        STATE.startPanX = e.clientX;
        STATE.startPanY = e.clientY;
        STATE.scrollLeft = timelineContainer.scrollLeft;
        STATE.scrollTop = timelineContainer.scrollTop;
        timelineContainer.style.cursor = "grabbing";
        e.preventDefault();
    });

    timelineContainer.addEventListener("mousemove", (e) => {
        if (!STATE.isPanning) return;

        const deltaX = e.clientX - STATE.startPanX;
        const deltaY = e.clientY - STATE.startPanY;

        timelineContainer.scrollLeft = STATE.scrollLeft - deltaX;
        timelineContainer.scrollTop = STATE.scrollTop - deltaY;
    });

    timelineContainer.addEventListener("mouseup", () => {
        STATE.isPanning = false;
        timelineContainer.style.cursor = "grab";
    });

    timelineContainer.addEventListener("mouseleave", () => {
        STATE.isPanning = false;
        timelineContainer.style.cursor = "grab";
    });

    timelineContainer.addEventListener("selectstart", (e) => {
        if (STATE.isPanning) e.preventDefault();
    });

    // Support tactile (mobile)
    timelineContainer.addEventListener("touchstart", (e) => {
        if (e.target.classList.contains("segment")) return;

        const touch = e.touches[0];
        STATE.isPanning = true;
        STATE.startPanX = touch.clientX;
        STATE.startPanY = touch.clientY;
        STATE.scrollLeft = timelineContainer.scrollLeft;
        STATE.scrollTop = timelineContainer.scrollTop;
    }, { passive: true });

    timelineContainer.addEventListener("touchmove", (e) => {
        if (!STATE.isPanning) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - STATE.startPanX;
        const deltaY = touch.clientY - STATE.startPanY;

        timelineContainer.scrollLeft = STATE.scrollLeft - deltaX;
        timelineContainer.scrollTop = STATE.scrollTop - deltaY;
    }, { passive: true });

    timelineContainer.addEventListener("touchend", () => {
        STATE.isPanning = false;
    }, { passive: true });
}

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        // Ctrl + 0 : Reset zoom
        if (e.ctrlKey && e.key === "0") {
            e.preventDefault();
            STATE.currentZoom = 1;
            refreshTimeline(STATE.currentFilteredClans);
        }

        // Ctrl + + : Zoom in
        if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
            e.preventDefault();
            STATE.currentZoom = Math.min(CONFIG.MAX_ZOOM, STATE.currentZoom + CONFIG.ZOOM_SPEED);
            refreshTimeline(STATE.currentFilteredClans);
        }

        // Ctrl + - : Zoom out
        if (e.ctrlKey && e.key === "-") {
            e.preventDefault();
            STATE.currentZoom = Math.max(CONFIG.MIN_ZOOM, STATE.currentZoom - CONFIG.ZOOM_SPEED);
            refreshTimeline(STATE.currentFilteredClans);
        }
    });
}