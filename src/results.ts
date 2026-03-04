import { supabase } from "./supabase";
import { BoxInfo } from "./grid";
import { Connection, ConnectionManager, ResultArrow } from "./connections";
import { THEME, PERSONALITIES } from "./config";

interface AggregateRow {
  source_box: number;
  target_box: number;
  count: number;
}

const MIN_WIDTH = 1.5;
const MAX_WIDTH = 10;
const NS = "http://www.w3.org/2000/svg";

async function fetchAggregateResults(): Promise<AggregateRow[]> {
  const { data, error } = await supabase.rpc("get_aggregate_connections");
  if (error) throw new Error(error.message);
  return (data ?? []) as AggregateRow[];
}

function ensureMarker(color: string): string {
  const id = "mk-" + color.replace("#", "");
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
    m.appendChild(p);
    defs.appendChild(m);
  }
  return id;
}

export function createResultsRenderer(
  boxes: BoxInfo[],
  manager: ConnectionManager,
) {
  const resultsLayer = document.getElementById("results-layer")!;
  const userResultsLayer = document.getElementById("user-results-layer")!;

  let visible = false;

  async function showResults(userConnections: Connection[]) {
    const rows = await fetchAggregateResults();
    const maxCount =
      rows.length > 0 ? Math.max(...rows.map((r) => r.count)) : 1;

    // Clear previous
    resultsLayer.innerHTML = "";
    userResultsLayer.innerHTML = "";

    const aggMarkerId = ensureMarker(THEME.aggregate);
    const userMarkerId = ensureMarker(THEME.userHighlight);

    const resultArrows: ResultArrow[] = [];

    // Aggregate lines
    for (const row of rows) {
      const srcIdx = row.source_box - 1;
      const tgtIdx = row.target_box - 1;
      const source = boxes[srcIdx];
      const target = boxes[tgtIdx];
      if (!source || !target) continue;

      const ratio = row.count / maxCount;
      const width = MIN_WIDTH + ratio * (MAX_WIDTH - MIN_WIDTH);

      const path = document.createElementNS(NS, "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", THEME.aggregate);
      path.setAttribute("stroke-width", String(width));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("marker-end", `url(#${aggMarkerId})`);
      path.style.opacity = "0.7";
      resultsLayer.appendChild(path);

      const seed = Math.random() * 100;
      const personality =
        PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]!;
      resultArrows.push({
        seed,
        personality,
        path,
        pulsePhase: Math.random() * Math.PI * 2,
        sourceEl: source.element,
        targetEl: target.element,
        basePulse: true,
      });
    }

    // User's own connections on top
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
      resultArrows.push({
        seed,
        personality,
        path,
        pulsePhase: Math.random() * Math.PI * 2,
        sourceEl: source.element,
        targetEl: target.element,
        basePulse: false,
      });
    }

    manager.registerResultArrows(resultArrows);
    visible = true;
  }

  function hide() {
    resultsLayer.innerHTML = "";
    userResultsLayer.innerHTML = "";
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
