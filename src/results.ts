import { Application, Graphics } from "pixi.js";
import { supabase } from "./supabase";
import { BoxInfo } from "./grid";
import { Connection, drawConnection } from "./connections";
import { THEME } from "./config";

interface AggregateRow {
  source_box: number;
  target_box: number;
  count: number;
}

const AGGREGATE_COLOR = THEME.aggregate;
const USER_COLOR = THEME.userHighlight;
const MIN_WIDTH = 1.5;
const MAX_WIDTH = 10;

/**
 * Fetch aggregate connection counts from Supabase via the RPC function.
 * Returns rows with 1-based box indices and counts.
 */
async function fetchAggregateResults(): Promise<AggregateRow[]> {
  const { data, error } = await supabase.rpc("get_aggregate_connections");
  if (error) throw new Error(error.message);
  return (data ?? []) as AggregateRow[];
}

/**
 * Manages fetching and rendering aggregate results on the canvas.
 */
export function createResultsRenderer(app: Application, boxes: BoxInfo[]) {
  const aggregateLayer = new Graphics();
  const userLayer = new Graphics();

  // Insert aggregate layer below the existing lines/preview layers,
  // but above the box containers. The stage children order is:
  // [box containers..., highlightLayer, linesLayer, previewLayer]
  // We want aggregate below highlight, so insert at position after boxes.
  const insertIndex = boxes.length;
  app.stage.addChildAt(aggregateLayer, insertIndex);
  app.stage.addChildAt(userLayer, insertIndex + 1);

  let visible = false;

  async function showResults(userConnections: Connection[]) {
    const rows = await fetchAggregateResults();

    const maxCount = rows.length > 0 ? Math.max(...rows.map((r) => r.count)) : 1;

    // Draw aggregate lines
    aggregateLayer.clear();
    for (const row of rows) {
      // Convert 1-based DB indices to 0-based
      const srcIdx = row.source_box - 1;
      const tgtIdx = row.target_box - 1;
      const source = boxes[srcIdx];
      const target = boxes[tgtIdx];
      if (!source || !target) continue;

      const ratio = row.count / maxCount;
      const width = MIN_WIDTH + ratio * (MAX_WIDTH - MIN_WIDTH);
      drawConnection(aggregateLayer, source, target, AGGREGATE_COLOR, width);
    }
    aggregateLayer.alpha = 0.7;

    // Draw user's own connections on top in a distinct color
    userLayer.clear();
    for (const conn of userConnections) {
      const source = boxes[conn.source];
      const target = boxes[conn.target];
      if (!source || !target) continue;
      drawConnection(userLayer, source, target, USER_COLOR, 3);
    }

    visible = true;
  }

  function hide() {
    aggregateLayer.clear();
    userLayer.clear();
    visible = false;
  }

  return { showResults, hide, get visible() { return visible; } };
}
