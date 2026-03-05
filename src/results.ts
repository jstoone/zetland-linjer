import { supabase } from "./supabase";
import { BoxInfo } from "./grid";
import { Connection, ConnectionManager, ResultArrow } from "./connections";
import { THEME, PERSONALITIES } from "./config";

interface AggregateRow {
  source_box: number;
  target_box: number;
  count: number;
}

const NS = "http://www.w3.org/2000/svg";

const MIN_COUNT_THRESHOLD = 2;
const STAGGER_DELAY_MS = 150;
const USER_PAUSE_MS = 1500;
const FADE_DURATION_MS = 400;
const TOP_N_LABELS = 5;

// Top connections: bold, glowing, clearly visible
const TOP_WIDTH = 4;
const TOP_OPACITY = 0.85;

// Background connections: faded texture
const BG_MIN_WIDTH = 0.75;
const BG_MAX_WIDTH = 2;
const BG_OPACITY = 0.15;

async function fetchAggregateResults(): Promise<AggregateRow[]> {
  const { data, error } = await supabase.rpc("get_aggregate_connections");
  if (error) throw new Error(error.message);
  return (data ?? []) as AggregateRow[];
}

function ensureMarker(color: string, opacity?: number): string {
  const suffix = opacity !== undefined ? `-${Math.round(opacity * 100)}` : "";
  const id = "mk-" + color.replace("#", "") + suffix;
  const defs = document.getElementById("marker-defs")!;
  if (!document.getElementById(id)) {
    const m = document.createElementNS(NS, "marker");
    m.setAttribute("id", id);
    m.setAttribute("markerWidth", "8");
    m.setAttribute("markerHeight", "8");
    m.setAttribute("refX", "6");
    m.setAttribute("refY", "3");
    m.setAttribute("orient", "auto");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M0,0 L0,6 L8,3 z");
    p.setAttribute("fill", color);
    if (opacity !== undefined) p.setAttribute("opacity", String(opacity));
    m.appendChild(p);
    defs.appendChild(m);
  }
  return id;
}

export function createResultsRenderer(
  boxes: BoxInfo[],
  manager: ConnectionManager,
) {
  const resultsBgLayer = document.getElementById("results-bg-layer")!;
  const resultsLayer = document.getElementById("results-layer")!;
  const resultsLabelsLayer = document.getElementById("results-labels-layer")!;
  const userResultsLayer = document.getElementById("user-results-layer")!;
  const connectionsLayer = document.getElementById("connections-layer")!;

  let visible = false;
  let hasRevealedOnce = false;

  async function showResults(userConnections: Connection[]) {
    const rows = await fetchAggregateResults();

    // Filter out one-off connections
    const filtered = rows.filter((r) => r.count >= MIN_COUNT_THRESHOLD);

    // Sort by count descending (most popular first)
    filtered.sort((a, b) => b.count - a.count);

    const maxCount =
      filtered.length > 0 ? Math.max(...filtered.map((r) => r.count)) : 1;

    // Clear previous
    resultsBgLayer.innerHTML = "";
    resultsLayer.innerHTML = "";
    resultsLabelsLayer.innerHTML = "";
    userResultsLayer.innerHTML = "";

    const aggMarkerId = ensureMarker(THEME.aggregate);
    const aggBgMarkerId = ensureMarker(THEME.aggregate, BG_OPACITY);
    const userMarkerId = ensureMarker(THEME.userHighlight);

    const resultArrows: ResultArrow[] = [];
    const stagger = !hasRevealedOnce;
    const now = performance.now();

    // User's own connections — fade in immediately
    for (const conn of userConnections) {
      const source = boxes[conn.source];
      const target = boxes[conn.target];
      if (!source || !target) continue;

      const path = document.createElementNS(NS, "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", THEME.userHighlight);
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("marker-end", `url(#${userMarkerId})`);
      path.style.filter = `drop-shadow(0 0 4px ${THEME.userHighlight}88)`;
      userResultsLayer.appendChild(path);

      const seed = Math.random() * 100;
      const personality =
        PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]!;

      const arrow: ResultArrow = {
        seed,
        personality,
        path,
        pulsePhase: Math.random() * Math.PI * 2,
        sourceEl: source.element,
        targetEl: target.element,
        basePulse: false,
        targetOpacity: 1,
      };

      if (stagger) {
        arrow.revealAt = now;
        arrow.revealDuration = FADE_DURATION_MS;
      }

      resultArrows.push(arrow);
    }

    // Aggregate lines — split into top (foreground) and background
    for (let i = 0; i < filtered.length; i++) {
      const row = filtered[i]!;
      const srcIdx = row.source_box - 1;
      const tgtIdx = row.target_box - 1;
      const source = boxes[srcIdx];
      const target = boxes[tgtIdx];
      if (!source || !target) continue;

      const isTop = i < TOP_N_LABELS;
      const ratio = row.count / maxCount;

      const path = document.createElementNS(NS, "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", THEME.aggregate);
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");

      if (isTop) {
        // Top connections: bold, glowing, in foreground layer
        const width = TOP_WIDTH + ratio * 2;
        path.setAttribute("stroke-width", String(width));
        path.setAttribute("marker-end", `url(#${aggMarkerId})`);
        path.style.filter = `drop-shadow(0 0 6px ${THEME.aggregate}66)`;
        resultsLayer.appendChild(path);
      } else {
        // Background connections: thin, very faded
        const width = BG_MIN_WIDTH + ratio * (BG_MAX_WIDTH - BG_MIN_WIDTH);
        path.setAttribute("stroke-width", String(width));
        path.setAttribute("marker-end", `url(#${aggBgMarkerId})`);
        resultsBgLayer.appendChild(path);
      }

      const seed = Math.random() * 100;
      const personality =
        PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]!;

      const arrow: ResultArrow = {
        seed,
        personality,
        path,
        pulsePhase: Math.random() * Math.PI * 2,
        sourceEl: source.element,
        targetEl: target.element,
        basePulse: !isTop,
        targetOpacity: isTop ? TOP_OPACITY : BG_OPACITY,
      };

      if (stagger) {
        arrow.revealAt = now + USER_PAUSE_MS + i * STAGGER_DELAY_MS;
        arrow.revealDuration = FADE_DURATION_MS;
      }

      // Count labels on top connections — in dedicated top label layer
      if (isTop) {
        const bg = document.createElementNS(NS, "rect");
        bg.setAttribute("width", "28");
        bg.setAttribute("height", "20");
        bg.setAttribute("rx", "6");
        bg.setAttribute("fill", THEME.aggregate);
        bg.style.opacity = "0";
        resultsLabelsLayer.appendChild(bg);

        const label = document.createElementNS(NS, "text");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("fill", "#FFFFFF");
        label.setAttribute("font-size", "11");
        label.setAttribute("font-weight", "700");
        label.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
        label.textContent = String(row.count);
        label.style.opacity = "0";
        resultsLabelsLayer.appendChild(label);

        arrow.countBg = bg;
        arrow.countLabel = label;
      }

      resultArrows.push(arrow);
    }

    // Hide original user arrows so they don't double up
    connectionsLayer.style.display = "none";

    manager.registerResultArrows(resultArrows);
    visible = true;
    hasRevealedOnce = true;
  }

  function hide() {
    resultsBgLayer.innerHTML = "";
    resultsLayer.innerHTML = "";
    resultsLabelsLayer.innerHTML = "";
    userResultsLayer.innerHTML = "";
    connectionsLayer.style.display = "";
    manager.clearResultArrows();
    visible = false;
  }

  return {
    showResults,
    hide,
    get visible() {
      return visible;
    },
  };
}
