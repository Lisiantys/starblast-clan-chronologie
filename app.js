/* ============================================================
   STARBLAST CLANS & TEAMS TIMELINE
   ============================================================ */

// ---------- Constants ----------
const TIMELINE_START_YEAR = 2016;
const TIMELINE_END_YEAR = 2025;
const TOTAL_MONTHS = (TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1) * 12; // inclusive end year
const BASE_PX_PER_MONTH = 14;  // at 100% zoom
const MIN_ZOOM = 0.10;
const MAX_ZOOM = 3.0;
const MONTHS_VISIBLE_THRESHOLD = 1.82; // hide months bar below this zoom
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ---------- State ----------
let clans = [];
let zoom = 1.0;
let selectedClans = new Set(); // names
let hoveredSegment = null;

// ---------- Utilities ----------
function monthStringToIndex(s) {
  // "YYYY-MM" -> months since timeline start (Jan TIMELINE_START_YEAR)
  if (!s || s === "?") return null;
  const [y, m] = s.split("-").map(Number);
  return (y - TIMELINE_START_YEAR) * 12 + (m - 1);
}
function indexToDateLabel(idx) {
  const y = TIMELINE_START_YEAR + Math.floor(idx / 12);
  const m = idx % 12;
  return `${MONTH_NAMES[m]} ${y}`;
}
function pxPerMonth() { return BASE_PX_PER_MONTH * zoom; }
function timelineWidth() { return pxPerMonth() * TOTAL_MONTHS; }
function getSegmentEndIdx(seg) {
  if (seg.end === "?") return TOTAL_MONTHS;
  return monthStringToIndex(seg.end);
}
function getSegmentStartIdx(seg) {
  return monthStringToIndex(seg.start);
}
function isSegmentCheating(clan, seg) {
  if (typeof seg.isCheating === "boolean") return seg.isCheating;
  return !!clan.isCheaterClan;
}
function reputationLabel(clan, seg) {
  const segCheats = isSegmentCheating(clan, seg);
  if (segCheats === clan.isCheaterClan) {
    return segCheats ? "Cheaters" : "Fair";
  }
  // Override
  return segCheats ? "Cheaters (during this period)" : "Fair (reformed)";
}
function regionFullName(r) {
  return r === "EU" ? "Europe" : r === "US" ? "America" : r === "AS" ? "Asia" : r;
}
function durationMonths(seg) {
  const s = getSegmentStartIdx(seg);
  const e = getSegmentEndIdx(seg);
  return Math.max(1, e - s);
}
function formatDuration(months) {
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y}y` : `${y}y ${m}mo`;
}

// ---------- Loading data ----------
async function loadData() {
  try {
    const res = await fetch("data.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) { /* fall through */ }
}

// ---------- DOM refs ----------
const $ = id => document.getElementById(id);
const timelineScroll = $("timelineScroll");
const timelineContent = $("timelineContent");
const yearsBar = $("yearsBar");
const monthsBar = $("monthsBar");
const gridLines = $("gridLines");
const rowsContainer = $("rowsContainer");
const leftLabels = $("leftLabels");
const leftLabelsScroll = $("leftLabelsScroll");
const tooltip = $("tooltip");
const compareBar = $("compareBar");
const compareChips = $("compareChips");
const compareBtn = $("compareBtn");
const clearBtn = $("clearBtn");
const modalBackdrop = $("modalBackdrop");
const modalBody = $("modalBody");
const modalClose = $("modalClose");
const zoomIndicator = $("zoomIndicator");
const filterStats = $("filterStats");
const emptyState = $("emptyState");
const rightPanel = $("rightPanel");

// ---------- Filtering ----------
function getFilters() {
  return {
    search: $("searchInput").value.trim().toLowerCase(),
    reputation: $("reputationFilter").value,
    structure: $("structureFilter").value,
    status: $("statusFilter").value,
    region: $("regionFilter").value,
    startDate: $("startDateFilter").value,
    endDate: $("endDateFilter").value,
  };
}
function clanMatchesFilters(clan, f) {
  // Status
  if (f.status === "active" && !clan.isActive) return false;
  if (f.status === "inactive" && clan.isActive) return false;
  // Structure
  if (f.structure === "clan" && !clan.isClan) return false;
  if (f.structure === "team" && clan.isClan) return false;
  // Region
  if (f.region !== "all" && clan.mainRegion !== f.region) return false;

  // We need at least one segment matching the date / search / reputation filters
  const startIdx = f.startDate ? monthStringToIndex(f.startDate) : null;
  const endIdx = f.endDate ? monthStringToIndex(f.endDate) : null;

  const matchingSegs = clan.segments.filter(seg => {
    if (f.search && !seg.name.toLowerCase().includes(f.search)) return false;
    if (f.reputation !== "all") {
      const cheats = isSegmentCheating(clan, seg);
      if (f.reputation === "fair" && cheats) return false;
      if (f.reputation === "cheaters" && !cheats) return false;
    }
    const segStart = getSegmentStartIdx(seg);
    const segEnd = getSegmentEndIdx(seg);
    if (startIdx !== null && segStart < startIdx) return false;
    if (endIdx !== null && segEnd > endIdx) return false;
    return true;
  });

  return matchingSegs.length > 0;
}

function getVisibleClans() {
  const f = getFilters();
  return clans.filter(c => clanMatchesFilters(c, f));
}

// ---------- Rendering ----------
function buildHeader() {
  yearsBar.innerHTML = "";
  monthsBar.innerHTML = "";
  gridLines.innerHTML = "";
  const ppm = pxPerMonth();
  const yearWidth = ppm * 12;
  for (let y = 0; y <= (TIMELINE_END_YEAR - TIMELINE_START_YEAR); y++) {
    const left = y * yearWidth;
    const tick = document.createElement("div");
    tick.className = "year-tick";
    tick.style.left = left + "px";
    tick.style.width = yearWidth + "px";
    tick.textContent = TIMELINE_START_YEAR + y;
    yearsBar.appendChild(tick);

    const gline = document.createElement("div");
    gline.className = "grid-line-year major";
    gline.style.left = left + "px";
    gridLines.appendChild(gline);
  }
  // Months
  for (let i = 0; i < TOTAL_MONTHS; i++) {
    const left = i * ppm;
    const m = document.createElement("div");
    m.className = "month-tick";
    m.style.left = left + "px";
    m.style.width = ppm + "px";
    m.textContent = MONTH_NAMES[i % 12];
    monthsBar.appendChild(m);

    if (i % 12 !== 0 && i % 3 === 0) {
      const gline = document.createElement("div");
      gline.className = "grid-line-year";
      gline.style.left = left + "px";
      gridLines.appendChild(gline);
    }
  }
  // Hide months bar if too zoomed out
  if (zoom < MONTHS_VISIBLE_THRESHOLD) {
    monthsBar.classList.add("hidden");
  } else {
    monthsBar.classList.remove("hidden");
  }
}

function buildRows() {
  rowsContainer.innerHTML = "";
  leftLabels.innerHTML = "";
  const visible = getVisibleClans();
  emptyState.style.display = visible.length === 0 ? "block" : "none";
  filterStats.innerHTML = `Showing <strong>${visible.length}</strong> of <strong>${clans.length}</strong> clans`;

  const ppm = pxPerMonth();
  const totalH = visible.length * (44 + 6);
  rowsContainer.style.minHeight = totalH + "px";

  const f = getFilters();
  const search = f.search;

  visible.forEach((clan, rowIndex) => {
    // Left label
    const label = document.createElement("div");
    label.className = "clan-label" + (clan.isActive ? "" : " inactive") + (selectedClans.has(clan.name) ? " selected" : "") + (clan.isCheaterClan ? " cheater" : "");
    label.style.background = clan.color;
    label.dataset.clan = clan.name;
    label.innerHTML = `
      <span class="clan-label-name">${escapeHtml(clan.name)}</span>
      <span class="clan-label-status"></span>
    `;
    label.addEventListener("click", () => toggleClanSelected(clan.name));
    label.addEventListener("mouseenter", e => showClanTooltip(e, clan));
    label.addEventListener("mouseleave", hideTooltip);
    label.addEventListener("mousemove", positionTooltip);
    leftLabels.appendChild(label);

    // Row
    const row = document.createElement("div");
    row.className = "clan-row";
    if (selectedClans.size > 0 && !selectedClans.has(clan.name)) {
      row.classList.add("dimmed");
    }
    row.dataset.clan = clan.name;

    clan.segments.forEach((seg, segIdx) => {
      // Apply filter visibility per segment within row
      if (search && !seg.name.toLowerCase().includes(search)) return;
      if (f.reputation !== "all") {
        const cheats = isSegmentCheating(clan, seg);
        if (f.reputation === "fair" && cheats) return;
        if (f.reputation === "cheaters" && !cheats) return;
      }
      const startIdx = f.startDate ? monthStringToIndex(f.startDate) : null;
      const endIdx = f.endDate ? monthStringToIndex(f.endDate) : null;
      const segStart = getSegmentStartIdx(seg);
      const segEnd = getSegmentEndIdx(seg);
      if (startIdx !== null && segStart < startIdx) return;
      if (endIdx !== null && segEnd > endIdx) return;

      const left = segStart * ppm;
      const width = Math.max(20, (segEnd - segStart) * ppm);
      const cheats = isSegmentCheating(clan, seg);
      const segDiv = document.createElement("div");
      segDiv.className = "segment" + (cheats ? " cheating" : "");
      if (selectedClans.has(clan.name)) segDiv.classList.add("highlighted");
      segDiv.style.left = left + "px";
      segDiv.style.width = width + "px";
      segDiv.style.background = clan.color;

      const datesText = `${formatShortDate(seg.start)}${seg.end === "?" ? " → now" : " → " + formatShortDate(seg.end)}`;
      segDiv.innerHTML = `
        <div class="segment-text">
          <span class="segment-name">${escapeHtml(seg.name)}</span>
          <span class="segment-dates">${datesText}</span>
        </div>
      `;
      segDiv.addEventListener("mouseenter", e => showSegmentTooltip(e, clan, seg));
      segDiv.addEventListener("mouseleave", hideTooltip);
      segDiv.addEventListener("mousemove", positionTooltip);
      // Don't trigger pan when clicking segments
      segDiv.addEventListener("mousedown", e => e.stopPropagation());
      segDiv.addEventListener("touchstart", e => e.stopPropagation(), { passive: true });

      row.appendChild(segDiv);
    });

    rowsContainer.appendChild(row);
  });

  timelineContent.style.width = timelineWidth() + "px";
}

function formatShortDate(s) {
  if (s === "?") return "now";
  const [y, m] = s.split("-").map(Number);
  return `${MONTH_NAMES[m-1]} '${String(y).slice(-2)}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}

function render() {
  buildHeader();
  buildRows();
  updateZoomIndicator();
  syncLeftLabels();
}

function updateZoomIndicator() {
  zoomIndicator.textContent = Math.round(zoom * 100) + "%";
}

// ---------- Tooltips ----------
function showSegmentTooltip(e, clan, seg) {
  hoveredSegment = seg;
  const cheats = isSegmentCheating(clan, seg);
  const repClass = cheats ? "cheaters" : "fair";
  const period = `${formatShortDate(seg.start)} – ${seg.end === "?" ? "present" : formatShortDate(seg.end)}`;
  tooltip.innerHTML = `
    <div class="tooltip-title">
      <span class="tooltip-color-dot" style="background:${clan.color}"></span>
      ${escapeHtml(seg.name)}
    </div>
    <div class="tooltip-row"><span class="tooltip-key">Region:</span><span class="tooltip-val">${regionFullName(clan.mainRegion)}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Period:</span><span class="tooltip-val">${period}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Leader:</span><span class="tooltip-val">${escapeHtml(seg.leader || "—")}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Status:</span><span class="tooltip-val">${clan.isActive ? "Active" : "Inactive"}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Reputation:</span><span class="tooltip-val ${repClass}">${reputationLabel(clan, seg)}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Type:</span><span class="tooltip-val">${clan.isClan ? "Clan" : "Team"}</span></div>
  `;
  tooltip.classList.add("visible");
  positionTooltip(e);
}

function showClanTooltip(e, clan) {
  if (!clan.description && (!clan.founders || clan.founders.length === 0)) return;
  const founders = clan.founders && clan.founders.length ? clan.founders.join(", ") : "—";
  tooltip.innerHTML = `
    <div class="tooltip-title">
      <span class="tooltip-color-dot" style="background:${clan.color}"></span>
      ${escapeHtml(clan.fullName || clan.name)}
    </div>
    <div class="tooltip-row"><span class="tooltip-key">Region:</span><span class="tooltip-val">${regionFullName(clan.mainRegion)}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Status:</span><span class="tooltip-val">${clan.isActive ? "Active" : "Inactive"}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Type:</span><span class="tooltip-val">${clan.isClan ? "Clan" : "Team"}</span></div>
    <div class="tooltip-row"><span class="tooltip-key">Founders:</span><span class="tooltip-val">${escapeHtml(founders)}</span></div>
    ${clan.description ? `<div class="tooltip-desc">${escapeHtml(clan.description)}</div>` : ""}
  `;
  tooltip.classList.add("visible");
  positionTooltip(e);
}

function hideTooltip() {
  tooltip.classList.remove("visible");
  hoveredSegment = null;
}

function positionTooltip(e) {
  const x = e.clientX;
  const y = e.clientY;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  let left = x + 14;
  let top = y + 14;
  if (left + tw > window.innerWidth - 8) left = x - tw - 14;
  if (top + th > window.innerHeight - 8) top = y - th - 14;
  if (left < 8) left = 8;
  if (top < 8) top = 8;
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

// ---------- Selection / Comparison ----------
function toggleClanSelected(name) {
  if (selectedClans.has(name)) selectedClans.delete(name);
  else selectedClans.add(name);
  updateCompareBar();
  buildRows(); // re-render to update dim/highlight
}

function clearSelection() {
  selectedClans.clear();
  updateCompareBar();
  buildRows();
}

function updateCompareBar() {
  if (selectedClans.size === 0) {
    compareBar.classList.remove("visible");
    return;
  }
  compareBar.classList.add("visible");
  compareChips.innerHTML = "";
  selectedClans.forEach(name => {
    const clan = clans.find(c => c.name === name);
    if (!clan) return;
    const chip = document.createElement("div");
    chip.className = "compare-chip";
    chip.innerHTML = `
      <span class="compare-chip-color" style="background:${clan.color}"></span>
      <span>${escapeHtml(clan.name)}</span>
      <span class="compare-chip-x">×</span>
    `;
    chip.addEventListener("click", () => toggleClanSelected(name));
    compareChips.appendChild(chip);
  });
  compareBtn.style.display = selectedClans.size >= 2 ? "inline-flex" : "none";
}

function openCompareModal() {
  const selected = Array.from(selectedClans).map(n => clans.find(c => c.name === n)).filter(Boolean);
  if (selected.length < 2) return;
  modalBody.innerHTML = renderCompareTable(selected) + renderMiniTimeline(selected);
  modalBackdrop.classList.add("visible");
}

function closeCompareModal() {
  modalBackdrop.classList.remove("visible");
}

function renderCompareTable(selected) {
  // Compute stats per clan
  const stats = selected.map(c => {
    const totalMonths = c.segments.reduce((a, s) => a + durationMonths(s), 0);
    const firstStart = Math.min(...c.segments.map(getSegmentStartIdx));
    const lastEnd = Math.max(...c.segments.map(getSegmentEndIdx));
    const cheaters = c.segments.some(s => isSegmentCheating(c, s));
    const allCheating = c.segments.every(s => isSegmentCheating(c, s));
    let repText = "Fair";
    if (allCheating) repText = "Cheaters";
    else if (cheaters) repText = "Mixed";
    return {
      clan: c,
      totalMonths,
      firstStart,
      lastEnd,
      segmentCount: c.segments.length,
      reputation: repText,
      leaders: [...new Set(c.segments.map(s => s.leader).filter(Boolean))].join(", ") || "—",
    };
  });
  const maxDuration = Math.max(...stats.map(s => s.totalMonths));
  const maxSegs = Math.max(...stats.map(s => s.segmentCount));

  let header = `<tr><th></th>` + stats.map(s =>
    `<th class="clan-col" style="border-bottom:3px solid ${s.clan.color}">${escapeHtml(s.clan.name)}</th>`
  ).join("") + `</tr>`;

  function row(label, getter, bestCheck) {
    return `<tr><td class="compare-row-label">${label}</td>` +
      stats.map(s => {
        const v = getter(s);
        const isBest = bestCheck && bestCheck(s);
        return `<td${isBest ? ' class="best"' : ""}>${v}</td>`;
      }).join("") + `</tr>`;
  }

  const rows = [
    row("Full Name", s => escapeHtml(s.clan.fullName || s.clan.name)),
    row("Region", s => regionFullName(s.clan.mainRegion)),
    row("Type", s => s.clan.isClan ? "Clan" : "Team"),
    row("Status", s => s.clan.isActive ? "Active" : "Inactive"),
    row("Reputation", s => `<span class="${s.reputation === 'Cheaters' ? 'cheaters' : s.reputation === 'Fair' ? 'fair' : ''}" style="color:${s.reputation === 'Cheaters' ? 'var(--danger)' : s.reputation === 'Fair' ? 'var(--success)' : 'var(--warning)'}">${s.reputation}</span>`),
    row("First Seen", s => indexToDateLabel(s.firstStart)),
    row("Last Active", s => s.lastEnd >= TOTAL_MONTHS ? "Ongoing" : indexToDateLabel(Math.min(s.lastEnd, TOTAL_MONTHS - 1))),
    row("Total Duration", s => formatDuration(s.totalMonths), s => s.totalMonths === maxDuration),
    row("Segments", s => s.segmentCount, s => s.segmentCount === maxSegs && stats.length > 1 && stats.some(x => x.segmentCount !== maxSegs)),
    row("Leaders", s => escapeHtml(s.leaders)),
  ].join("");

  return `<table class="compare-table"><thead>${header}</thead><tbody>${rows}</tbody></table>`;
}

function renderMiniTimeline(selected) {
  // Compute global range for these clans
  let minIdx = Infinity, maxIdx = -Infinity;
  selected.forEach(c => {
    c.segments.forEach(s => {
      minIdx = Math.min(minIdx, getSegmentStartIdx(s));
      const e = getSegmentEndIdx(s);
      maxIdx = Math.max(maxIdx, Math.min(e, TOTAL_MONTHS));
    });
  });
  // Pad slightly
  minIdx = Math.max(0, minIdx - 2);
  maxIdx = Math.min(TOTAL_MONTHS, maxIdx + 2);
  const span = Math.max(1, maxIdx - minIdx);

  function pct(idx) { return ((idx - minIdx) / span) * 100; }

  const rows = selected.map(c => {
    const segs = c.segments.map(s => {
      const sStart = getSegmentStartIdx(s);
      const sEnd = Math.min(getSegmentEndIdx(s), TOTAL_MONTHS);
      const left = pct(sStart);
      const width = pct(sEnd) - left;
      const cheats = isSegmentCheating(c, s);
      return `<div class="mini-segment${cheats ? ' cheating' : ''}" style="left:${left}%;width:${width}%;background:${c.color};${cheats ? 'box-shadow:0 0 0 1px var(--danger), inset 0 1px 0 rgba(255,255,255,0.2);' : ''}"></div>`;
    }).join("");
    return `
      <div class="mini-row">
        <div class="mini-row-label" style="background:${c.color}">${escapeHtml(c.name)}</div>
        <div class="mini-track">${segs}</div>
      </div>
    `;
  }).join("");

  // Axis ticks (year-level)
  const startYear = TIMELINE_START_YEAR + Math.floor(minIdx / 12);
  const endYear = TIMELINE_START_YEAR + Math.floor((maxIdx - 1) / 12);
  let ticks = "";
  for (let y = startYear; y <= endYear; y++) {
    const idx = (y - TIMELINE_START_YEAR) * 12;
    if (idx < minIdx || idx > maxIdx) continue;
    const left = pct(idx);
    ticks += `<div class="mini-axis-tick" style="left:${left}%">${y}</div>`;
  }

  return `
    <div class="mini-timeline">
      <div class="mini-timeline-title">Lifespan Comparison</div>
      ${rows}
      <div class="mini-axis">${ticks}</div>
    </div>
  `;
}

// ---------- Zoom ----------
function setZoom(newZoom, anchorClientX) {
  newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
  if (newZoom === zoom) return;

  const rect = timelineScroll.getBoundingClientRect();
  const anchor = anchorClientX !== undefined ? anchorClientX - rect.left : rect.width / 2;
  const scrollLeft = timelineScroll.scrollLeft;
  const contentX = scrollLeft + anchor;
  const ratio = newZoom / zoom;

  zoom = newZoom;
  render();

  const newContentX = contentX * ratio;
  const newScrollLeft = newContentX - anchor;
  timelineScroll.scrollLeft = newScrollLeft;
}

function autoFitZoom() {
  zoom = 1.82;
  render();
}

// ---------- Pan / Drag ----------
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragScrollLeft = 0, dragScrollTop = 0;
let didDrag = false;

timelineScroll.addEventListener("mousedown", e => {
  if (e.target.closest(".segment")) return;
  isDragging = true;
  didDrag = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragScrollLeft = timelineScroll.scrollLeft;
  dragScrollTop = timelineScroll.scrollTop;
  timelineScroll.classList.add("grabbing");
  e.preventDefault();
});
window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  if (Math.abs(dx) + Math.abs(dy) > 4) didDrag = true;
  timelineScroll.scrollLeft = dragScrollLeft - dx;
  timelineScroll.scrollTop = dragScrollTop - dy;
});
window.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    timelineScroll.classList.remove("grabbing");
  }
});

// Touch
let touchState = null;
timelineScroll.addEventListener("touchstart", e => {
  if (e.target.closest(".segment")) return;
  if (e.touches.length === 1) {
    touchState = {
      mode: "pan",
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      scrollLeft: timelineScroll.scrollLeft,
      scrollTop: timelineScroll.scrollTop,
    };
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    touchState = { mode: "pinch", startDist: dist, startZoom: zoom, centerX: cx };
  }
}, { passive: true });
timelineScroll.addEventListener("touchmove", e => {
  if (!touchState) return;
  if (touchState.mode === "pan" && e.touches.length === 1) {
    const dx = e.touches[0].clientX - touchState.startX;
    const dy = e.touches[0].clientY - touchState.startY;
    timelineScroll.scrollLeft = touchState.scrollLeft - dx;
    timelineScroll.scrollTop = touchState.scrollTop - dy;
  } else if (touchState.mode === "pinch" && e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const factor = dist / touchState.startDist;
    setZoom(touchState.startZoom * factor, touchState.centerX);
  }
}, { passive: false });
timelineScroll.addEventListener("touchend", () => { touchState = null; });

// Wheel zoom
timelineScroll.addEventListener("wheel", e => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * factor, e.clientX);
  }
}, { passive: false });

// Sync left labels with vertical scroll
timelineScroll.addEventListener("scroll", () => {
  syncLeftLabels();
});
function syncLeftLabels() {
  leftLabels.style.transform = `translateY(${-timelineScroll.scrollTop}px)`;
}

// ---------- Keyboard ----------
window.addEventListener("keydown", e => {
  if (e.target.matches("input, select, textarea")) return;
  if ((e.ctrlKey || e.metaKey) && e.key === "0") {
    e.preventDefault(); autoFitZoom();
  } else if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
    e.preventDefault(); setZoom(zoom * 1.2);
  } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
    e.preventDefault(); setZoom(zoom / 1.2);
  } else if (e.key === "Escape") {
    if (modalBackdrop.classList.contains("visible")) {
      closeCompareModal();
    } else if (selectedClans.size > 0) {
      clearSelection();
    }
  }
});

// ---------- Filter wiring ----------
const filterIds = ["searchInput","reputationFilter","structureFilter","statusFilter","regionFilter","startDateFilter","endDateFilter"];
filterIds.forEach(id => {
  $(id).addEventListener("input", buildRows);
  $(id).addEventListener("change", buildRows);
});
$("resetBtn").addEventListener("click", () => {
  filterIds.forEach(id => { $(id).value = id === "searchInput" ? "" : ($(id).tagName === "SELECT" ? "all" : ""); });
  buildRows();
});

// ---------- Toolbar ----------
$("zoomIn").addEventListener("click", () => setZoom(zoom * 1.2));
$("zoomOut").addEventListener("click", () => setZoom(zoom / 1.2));
$("zoomReset").addEventListener("click", autoFitZoom);
compareBtn.addEventListener("click", openCompareModal);
clearBtn.addEventListener("click", clearSelection);
modalClose.addEventListener("click", closeCompareModal);
modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) closeCompareModal(); });
$("menuToggle").addEventListener("click", () => rightPanel.classList.toggle("open"));

// ---------- Init ----------
async function init() {
  const data = await loadData();
  // Sort by earliest segment start
  data.forEach(c => {
    c.segments.sort((a,b) => getSegmentStartIdx(a) - getSegmentStartIdx(b));
  });
  data.sort((a,b) => {
    const aMin = Math.min(...a.segments.map(getSegmentStartIdx));
    const bMin = Math.min(...b.segments.map(getSegmentStartIdx));
    return aMin - bMin;
  });
  clans = data;

  // Configure date filter bounds
  $("startDateFilter").min = `${TIMELINE_START_YEAR}-01`;
  $("startDateFilter").max = `${TIMELINE_END_YEAR}-12`;
  $("endDateFilter").min = `${TIMELINE_START_YEAR}-01`;
  $("endDateFilter").max = `${TIMELINE_END_YEAR}-12`;

  render();
  // Wait a frame, then auto-fit
  requestAnimationFrame(() => {
    autoFitZoom();
    $("loading").classList.add("hidden");
  });
}

window.addEventListener("resize", () => {
  // Re-render on resize for grid sizes
  buildHeader();
});

init();
