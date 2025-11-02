// labels.js - Gestion des labels de clan avec tooltips

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
    const rowHeight = CONFIG.settings.displayMode === 'compact' ? 30 :
        CONFIG.settings.displayMode === 'extended' ? 50 : 40;

    // Calculer le padding-top pour aligner avec la timeline
    const yearsHeight = 35;
    const monthsHeight = STATE.currentZoom >= CONFIG.MONTH_HIDE_THRESHOLD ? 35 : 0;
    const topPadding = yearsHeight + monthsHeight + 10;

    innerContainer.style.paddingTop = `${topPadding}px`;

    // Récupérer le tooltip existant (le même que pour les segments)
    const tooltip = document.getElementById("tooltip");

    clans.forEach((clan, index) => {
        const labelDiv = document.createElement("div");
        labelDiv.className = "clan-label";
        labelDiv.style.position = "absolute";
        labelDiv.style.top = `${index * rowHeight}px`;
        labelDiv.style.height = `${rowHeight}px`;
        labelDiv.style.lineHeight = `${rowHeight}px`;
        labelDiv.style.backgroundColor = clan.color;
        labelDiv.title = clan.fullName || clan.name;

        // Ajouter le texte du nom
        const nameSpan = document.createElement("span");
        nameSpan.className = "clan-label-name";
        nameSpan.textContent = clan.name;
        labelDiv.appendChild(nameSpan);

        // Ajouter l'icône info si une description existe
        if (clan.description) {
            const infoIcon = document.createElement("div");
            infoIcon.className = "clan-info-icon";
            infoIcon.innerHTML = "ⓘ";

            // Créer le contenu du tooltip pour la description
            const darkenColor = (color, amount = 20) => {
                const num = parseInt(color.replace("#", ""), 16);
                const r = Math.max(0, (num >> 16) - amount);
                const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
                const b = Math.max(0, (num & 0x0000FF) - amount);
                return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
            };

            const darkColor = darkenColor(clan.color, 30);

            // Préparer le contenu du tooltip
            const tooltipContent = `
                <div class="tooltip-header" style="background: linear-gradient(135deg, ${clan.color}, ${darkColor});">
                    ${clan.fullName || clan.name}
                </div>
                <div class="tooltip-body">
                    <div style="padding: 12px 16px; color: #e0e0e0; line-height: 1.5;">
                        ${clan.description}
                    </div>
                    ${clan.founders && clan.founders.length > 0 ? `
                        <div class="tooltip-row">
                            <span class="tooltip-label">Founders:</span> 
                            <span class="tooltip-value">${clan.founders.join(", ")}</span>
                        </div>
                    ` : ''}
                    <div class="tooltip-row">
                        <span class="tooltip-label">Region:</span> 
                        <span class="tooltip-value">${clan.mainRegion}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Status:</span> 
                        <span class="tooltip-value">${clan.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Type:</span> 
                        <span class="tooltip-value">${clan.isClan ? "Clan" : "Team"}</span>
                    </div>
                </div>
            `;

            // Event listeners pour le tooltip
            infoIcon.addEventListener("mouseenter", (e) => {
                tooltip.innerHTML = tooltipContent;
                tooltip.style.display = "block";
                infoIcon.style.transform = "scale(1.2)";
            });

            infoIcon.addEventListener("mousemove", (e) => {
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;

                // Positionner le tooltip à droite de l'icône
                const iconRect = infoIcon.getBoundingClientRect();
                const containerRect = labelsContainer.getBoundingClientRect();

                let tooltipLeft = iconRect.right - containerRect.left + 10;
                let tooltipTop = iconRect.top - containerRect.top + (iconRect.height / 2) - (tooltipHeight / 2);

                // Ajuster si le tooltip sort de l'écran
                const maxTop = window.innerHeight - tooltipHeight - 20;
                if (iconRect.top + tooltipTop > maxTop) {
                    tooltipTop = maxTop - iconRect.top;
                }
                if (tooltipTop < 10) {
                    tooltipTop = 10;
                }

                tooltip.style.left = tooltipLeft + "px";
                tooltip.style.top = tooltipTop + "px";
            });

            infoIcon.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
                infoIcon.style.transform = "scale(1)";
            });

            labelDiv.appendChild(infoIcon);
        }

        innerContainer.appendChild(labelDiv);
    });

    const totalHeight = clans.length * rowHeight + topPadding;
    innerContainer.style.height = `${totalHeight}px`;

    setTimeout(() => syncLabelsScroll(), 0);
}

function syncLabelsScroll() {
    const timelineContainer = document.getElementById("timeline-container");
    const labelsContainer = document.querySelector(".clan-labels");

    if (timelineContainer && labelsContainer) {
        labelsContainer.scrollTop = timelineContainer.scrollTop;
    }
}

function setupScrollSync() {
    const timelineContainer = document.getElementById("timeline-container");

    if (timelineContainer) {
        timelineContainer.addEventListener("scroll", () => {
            syncLabelsScroll();
        });
    }
}