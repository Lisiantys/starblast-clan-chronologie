// compare.js - Système de comparaison de clans

const COMPARE = {
    selectedClans: new Set()
};

function toggleClanSelection(clanName) {
    if (COMPARE.selectedClans.has(clanName)) {
        COMPARE.selectedClans.delete(clanName);
    } else {
        COMPARE.selectedClans.add(clanName);
    }
    updateSelectionUI();
    updateCompareBar();
}

function clearSelection() {
    COMPARE.selectedClans.clear();
    updateSelectionUI();
    updateCompareBar();
}

function updateSelectionUI() {
    // Labels
    document.querySelectorAll(".clan-label").forEach(label => {
        const name = label.dataset.clanName;
        if (!name) return;
        label.classList.toggle("selected-for-compare", COMPARE.selectedClans.has(name));
    });

    // Segments
    const hasSelection = COMPARE.selectedClans.size > 0;
    document.querySelectorAll(".segment").forEach(seg => {
        const name = seg.dataset.clanName;
        if (hasSelection) {
            const isSelected = COMPARE.selectedClans.has(name);
            seg.style.opacity = isSelected ? "1" : "0.2";
            seg.classList.toggle("segment-compared", isSelected);
        } else {
            seg.style.opacity = "1";
            seg.classList.remove("segment-compared");
        }
    });
}

function updateCompareBar() {
    let bar = document.getElementById("compare-bar");

    if (COMPARE.selectedClans.size === 0) {
        if (bar) bar.classList.remove("visible");
        return;
    }

    if (!bar) {
        bar = document.createElement("div");
        bar.id = "compare-bar";
        document.body.appendChild(bar);
    }

    const clansArray = Array.from(COMPARE.selectedClans);

    const chips = clansArray.map(name => {
        const clan = STATE.originalClansData.find(c => c.name === name);
        const color = clan ? clan.color : "#888";
        const safeName = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        return `<span class="compare-chip" style="background:${color}" onclick="event.stopPropagation(); toggleClanSelection('${safeName}')">${name} ✕</span>`;
    }).join("");

    const compareBtn = COMPARE.selectedClans.size >= 2
        ? `<button class="compare-btn" onclick="openCompareModal()">Compare (${COMPARE.selectedClans.size})</button>`
        : `<span class="compare-hint">Select at least 2 clans</span>`;

    bar.innerHTML = `
        <div class="compare-bar-left">${chips}</div>
        <div class="compare-bar-right">
            <button class="compare-clear-btn" onclick="clearSelection()">Clear</button>
            ${compareBtn}
        </div>
    `;
    bar.classList.add("visible");
}

// === Stats helpers ===

function getClanDuration(clan) {
    let minStart = Infinity, maxEnd = -Infinity;
    clan.segments.forEach(seg => {
        const s = parseDateStr(seg.start);
        if (s !== null && s < minStart) minStart = s;
        const e = seg.end === "?"
            ? parseDateStr(`${CONFIG.endYear}-12`)
            : parseDateStr(seg.end);
        if (e !== null && e > maxEnd) maxEnd = e;
    });
    return maxEnd - minStart + 1;
}

function getClanFirstDate(clan) {
    let min = null;
    clan.segments.forEach(seg => {
        if (!min || seg.start < min) min = seg.start;
    });
    return min || "?";
}

function getClanLastDate(clan) {
    let max = null;
    clan.segments.forEach(seg => {
        if (seg.end === "?") { max = "Present"; return; }
        if (!max || seg.end > max) max = seg.end;
    });
    return max || "?";
}

function getClanLeaders(clan) {
    const leaders = new Set();
    clan.segments.forEach(seg => {
        if (seg.leader && seg.leader !== "Unknown" && seg.leader.trim() !== "") {
            seg.leader.split(",").forEach(name => {
                const trimmed = name.trim();
                if (trimmed) leaders.add(trimmed);
            });
        }
    });
    return leaders.size > 0 ? Array.from(leaders).join(", ") : "Unknown";
}

function formatDuration(months) {
    if (!isFinite(months) || months < 0) return "?";
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y > 0 && m > 0) return `${y}y ${m}m`;
    if (y > 0) return `${y}y`;
    return `${m}m`;
}

const regionMap = { EU: "Europe", US: "America", AS: "Asia" };

// === Modal ===

function openCompareModal() {
    if (COMPARE.selectedClans.size < 2) return;

    const clans = Array.from(COMPARE.selectedClans)
        .map(name => STATE.originalClansData.find(c => c.name === name))
        .filter(Boolean);

    const old = document.getElementById("compare-modal-overlay");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "compare-modal-overlay";
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeCompareModal();
    });

    // Stat rows definition
    const rows = [
        { label: "Full Name", get: c => c.fullName || c.name },
        { label: "Region", get: c => regionMap[c.mainRegion] || c.mainRegion },
        { label: "Type", get: c => c.isClan ? "Clan" : "Team" },
        { label: "Status", get: c => c.isActive ? "Active" : "Inactive", cls: c => c.isActive ? "stat-active" : "stat-inactive" },
        { label: "Reputation", get: c => c.isCheaterClan ? "Cheaters" : "Fair", cls: c => c.isCheaterClan ? "stat-cheater" : "stat-fair" },
        { label: "First Seen", get: c => getClanFirstDate(c) },
        { label: "Last Active", get: c => getClanLastDate(c) },
        { label: "Duration", get: c => formatDuration(getClanDuration(c)), rank: c => getClanDuration(c) },
        { label: "Segments", get: c => c.segments.length, rank: c => c.segments.length },
        { label: "Leaders", get: c => getClanLeaders(c) },
    ];

    // Pre-calc best values for ranking
    const rankBest = {};
    rows.forEach(row => {
        if (row.rank) {
            rankBest[row.label] = Math.max(...clans.map(c => row.rank(c)));
        }
    });

    // Build table
    let html = `<div class="compare-table-wrapper"><table class="compare-table"><thead><tr><th class="compare-label-col"></th>`;
    clans.forEach(c => {
        html += `<th><span class="compare-clan-header" style="border-bottom: 3px solid ${c.color}">${c.name}</span></th>`;
    });
    html += `</tr></thead><tbody>`;

    rows.forEach(row => {
        html += `<tr><td class="compare-label-col">${row.label}</td>`;
        clans.forEach(c => {
            let cls = row.cls ? row.cls(c) : "";
            if (row.rank && row.rank(c) === rankBest[row.label]) cls += " stat-best";
            html += `<td class="${cls}">${row.get(c)}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    // Mini timeline
    const totalSpan = CONFIG.totalMonths;
    html += `<div class="compare-timeline-section"><h3>Timeline Overview</h3><div class="compare-mini-timelines">`;
    clans.forEach(c => {
        const bars = c.segments.map(seg => {
            const s = parseDateStr(seg.start);
            const e = seg.end === "?" ? parseDateStr(`${CONFIG.endYear}-12`) : parseDateStr(seg.end);
            const base = CONFIG.startYear * 12 + 1;
            const startPct = ((s - base) / totalSpan * 100);
            const widthPct = ((e - s + 1) / totalSpan * 100);
            return `<div class="compare-mini-bar" style="left:${startPct}%;width:${widthPct}%;background:${c.color}" title="${seg.name}: ${seg.start} → ${seg.end}"><span class="compare-mini-bar-label">${seg.name}</span></div>`;
        }).join("");
        html += `<div class="compare-mini-row"><span class="compare-mini-label" style="color:${c.color}">${c.name}</span><div class="compare-mini-track">${bars}</div></div>`;
    });
    html += `</div><div class="compare-mini-years">`;
    for (let y = CONFIG.startYear; y <= CONFIG.endYear; y += 2) {
        const pct = ((y - CONFIG.startYear) * 12) / totalSpan * 100;
        html += `<span style="left:${pct}%">${y}</span>`;
    }
    html += `</div></div>`;

    overlay.innerHTML = `
        <div id="compare-modal">
            <div class="compare-modal-header">
                <h2>Clan Comparison</h2>
                <button class="compare-modal-close" onclick="closeCompareModal()">✕</button>
            </div>
            <div class="compare-modal-content">${html}</div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("visible"));
}

function closeCompareModal() {
    const overlay = document.getElementById("compare-modal-overlay");
    if (overlay) {
        overlay.classList.remove("visible");
        setTimeout(() => overlay.remove(), 300);
    }
}

// === Keyboard ===
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const modal = document.getElementById("compare-modal-overlay");
        if (modal) {
            closeCompareModal();
        } else if (COMPARE.selectedClans.size > 0) {
            clearSelection();
        }
    }
});