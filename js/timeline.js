// timeline.js - Génération de la timeline et des éléments visuels

function generateYears() {
    const timelineContainer = document.getElementById("timeline-container");
    const yearsContainer = document.querySelector(".years");
    yearsContainer.innerHTML = "";
    yearsContainer.style.position = "relative";

    const containerWidth = timelineContainer.clientWidth;
    const calculatedWidth = Math.max(STATE.TIMELINE_WIDTH, containerWidth);
    yearsContainer.style.width = calculatedWidth + "px";
    yearsContainer.style.height = "25px";

    for (let year = CONFIG.startYear; year <= CONFIG.endYear; year++) {
        const yearDiv = document.createElement("div");
        yearDiv.style.position = "absolute";
        yearDiv.style.left = ((year - CONFIG.startYear) * STATE.YEAR_WIDTH) + "px";
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

    if (STATE.currentZoom < CONFIG.MONTH_HIDE_THRESHOLD) {
        monthsContainer.style.display = "none";
        return;
    } else {
        monthsContainer.style.display = "block";
    }

    const containerWidth = timelineContainer.clientWidth;
    const calculatedWidth = Math.max(STATE.TIMELINE_WIDTH, containerWidth);
    monthsContainer.style.width = calculatedWidth + "px";
    monthsContainer.style.height = "20px";

    for (let i = 0; i < CONFIG.totalMonths; i++) {
        const monthIndex = i % 12;
        const monthName = CONFIG.monthNames[monthIndex];
        const monthDiv = document.createElement("div");
        monthDiv.style.position = "absolute";
        monthDiv.style.left = (i * STATE.MONTH_WIDTH) + "px";
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

    const containerWidth = timelineContainer.clientWidth;
    const calculatedWidth = Math.max(STATE.TIMELINE_WIDTH, containerWidth);
    container.style.width = calculatedWidth + "px";

    const rowHeight = CONFIG.settings.displayMode === 'compact' ? 30 :
        CONFIG.settings.displayMode === 'extended' ? 50 : 40;
    const segmentHeight = CONFIG.settings.displayMode === 'compact' ? 20 :
        CONFIG.settings.displayMode === 'extended' ? 30 : 24;

    const tooltip = document.getElementById("tooltip");

    clans.forEach((clan, index) => {
        const clanColor = clan.color || "#ffffff";

        clan.segments.forEach((segment) => {
            const segmentDiv = document.createElement("div");
            segmentDiv.className = "segment";

            // Déterminer si ce segment est cheater
            const segmentIsCheater = isSegmentCheater(segment, clan);

            // Appliquer un style visuel différent si le segment est cheater
            segmentDiv.style.backgroundColor = clanColor;
            if (segmentIsCheater) {
                segmentDiv.style.borderColor = "#ff4444";
                segmentDiv.style.borderWidth = "2px";
            }

            segmentDiv.style.height = `${segmentHeight}px`;
            segmentDiv.style.lineHeight = `${segmentHeight}px`;

            const [segStartYear, segStartMonth] = segment.start.split("-").map(Number);
            const [segEndYear, segEndMonth] = segment.end === "?"
                ? [CONFIG.endYear, 12]
                : segment.end.split("-").map(Number);

            const startOffset = ((segStartYear - CONFIG.startYear) * 12) + (segStartMonth - 1);
            const endOffset = ((segEndYear - CONFIG.startYear) * 12) + (segEndMonth - 1);

            const left = startOffset * STATE.MONTH_WIDTH;
            const width = (endOffset - startOffset + 1) * STATE.MONTH_WIDTH;
            const top = index * rowHeight;

            segmentDiv.style.position = "absolute";
            segmentDiv.style.left = `${left}px`;
            segmentDiv.style.width = `${width}px`;
            segmentDiv.style.top = `${top}px`;
            segmentDiv.textContent = `${segment.name} (${segment.start} - ${segment.end})`;
            segmentDiv.dataset.clanName = clan.name;

            const darkColor = darkenColor(clanColor, 30);
            const segmentReputation = getSegmentReputation(segment, clan);

            const segmentInfo = `
                <div class="tooltip-header" style="background: linear-gradient(135deg, ${clanColor}, ${darkColor});">${segment.name}</div>
                <div class="tooltip-body">
                    <div class="tooltip-row"><span class="tooltip-label">Region :</span> <span class="tooltip-value">${clan.mainRegion}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Period :</span> <span class="tooltip-value">${segment.start} - ${segment.end}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Leader :</span> <span class="tooltip-value">${segment.leader || "Unknown"}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Active :</span> <span class="tooltip-value">${clan.isActive ? "Yes" : "No"}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Reputation :</span> <span class="tooltip-value" style="${segmentIsCheater ? 'color: #ff6666;' : ''}">${segmentReputation}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Type :</span> <span class="tooltip-value">${clan.isClan ? "Clan" : "Team"}</span></div>
                </div>
            `;

            // Tooltip events
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
    STATE.currentFilteredClans = clans;
    updateDimensions();
    generateYears();
    generateMonths();
    generateTimeline(clans);
    updateZoomIndicator();

    setTimeout(() => syncLabelsScroll(), 50);
}