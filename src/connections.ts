import {
  Application,
  Graphics,
  FederatedPointerEvent,
  Rectangle,
} from "pixi.js";
import { BoxInfo } from "./grid";

export interface Connection {
  source: number;
  target: number;
}

const LINE_COLOR = 0xe94560;
const PREVIEW_COLOR = 0x53c28b;
const SELECTED_COLOR = 0x53c28b;
const LINE_WIDTH = 2.5;
const PREVIEW_WIDTH = 2;
const ARROW_SIZE = 8;
const CURVE_OFFSET_RATIO = 0.15;
const TAP_THRESHOLD = 10;
const HIGHLIGHT_RADIUS = 10;
const LINE_HIT_THRESHOLD = 20;
const FADE_SPEED = 0.04;

export interface ConnectionManager {
  connections: Connection[];
  redraw: () => void;
  resetAll: () => Connection[];
}

/**
 * Sets up drag-to-connect interaction on the box grid.
 * Returns a ConnectionManager for use by future features (tap-tap, remove, reset).
 */
export function setupConnections(
  app: Application,
  boxes: BoxInfo[],
): ConnectionManager {
  const connections: Connection[] = [];
  const highlightLayer = new Graphics();
  const linesLayer = new Graphics();
  const previewLayer = new Graphics();
  app.stage.addChild(highlightLayer);
  app.stage.addChild(linesLayer);
  app.stage.addChild(previewLayer);

  let dragSource: BoxInfo | null = null;
  let pointerX = 0;
  let pointerY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let selectedBoxIndex: number | null = null;

  function toggle(source: number, target: number) {
    const idx = connections.findIndex(
      c => c.source === source && c.target === target
    );
    if (idx >= 0) {
      animateRemoval(app, boxes, connections.splice(idx, 1)[0]!);
    } else {
      connections.push({ source, target });
    }
  }

  // Make each box interactive
  for (const box of boxes) {
    box.container.eventMode = "static";
    box.container.cursor = "pointer";
    box.container.hitArea = new Rectangle(0, 0, box.w, box.h);
    box.container.on("pointerdown", (e: FederatedPointerEvent) => {
      dragSource = box;
      dragStartX = e.global.x;
      dragStartY = e.global.y;
      pointerX = e.global.x;
      pointerY = e.global.y;
    });
  }

  // Stage-level handlers for move and up
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  app.stage.on("pointermove", (e: FederatedPointerEvent) => {
    if (!dragSource) return;
    pointerX = e.global.x;
    pointerY = e.global.y;
    drawPreview();
  });

  const endDrag = (e: FederatedPointerEvent) => {
    if (!dragSource) return;

    const dx = e.global.x - dragStartX;
    const dy = e.global.y - dragStartY;
    const movedDist = Math.sqrt(dx * dx + dy * dy);

    if (movedDist < TAP_THRESHOLD) {
      // It's a tap — handle tap-tap selection
      const tappedBox = hitTest(e.global.x, e.global.y, boxes);
      if (tappedBox) {
        if (selectedBoxIndex === null) {
          // No selection — select this box
          selectedBoxIndex = tappedBox.index;
        } else if (selectedBoxIndex === tappedBox.index) {
          // Same box — deselect
          selectedBoxIndex = null;
        } else {
          // Different box — toggle connection from selected to tapped
          toggle(selectedBoxIndex, tappedBox.index);
          selectedBoxIndex = null;
          redraw();
        }
      } else {
        // Tapped empty space — check if tapped on a line
        const lineIdx = hitTestLine(e.global.x, e.global.y, connections, boxes);
        if (lineIdx >= 0) {
          animateRemoval(app, boxes, connections.splice(lineIdx, 1)[0]!);
          redraw();
        }
        selectedBoxIndex = null;
      }
      drawHighlight();
    } else {
      // It's a drag — existing behavior
      const target = hitTest(e.global.x, e.global.y, boxes);
      if (target && target.index !== dragSource.index) {
        toggle(dragSource.index, target.index);
        redraw();
      }
    }

    dragSource = null;
    previewLayer.clear();
  };

  app.stage.on("pointerup", endDrag);
  app.stage.on("pointerupoutside", endDrag);
  app.stage.on("pointercancel", () => {
    dragSource = null;
    previewLayer.clear();
  });

  function drawPreview() {
    previewLayer.clear();
    if (!dragSource) return;

    const sx = dragSource.cx;
    const sy = dragSource.cy;
    const dx = pointerX - sx;
    const dy = pointerY - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;

    const perpX = -dy / dist;
    const perpY = dx / dist;
    const offset = dist * 0.1;
    const cpX = (sx + pointerX) / 2 + perpX * offset;
    const cpY = (sy + pointerY) / 2 + perpY * offset;

    previewLayer.moveTo(sx, sy);
    previewLayer.quadraticCurveTo(cpX, cpY, pointerX, pointerY);
    previewLayer.stroke({
      width: PREVIEW_WIDTH,
      color: PREVIEW_COLOR,
      alpha: 0.6,
    });
  }

  function drawHighlight() {
    highlightLayer.clear();
    if (selectedBoxIndex === null) return;
    const b = boxes[selectedBoxIndex]!;
    const left = b.cx - b.w / 2;
    const top = b.cy - b.h / 2;
    highlightLayer.roundRect(left, top, b.w, b.h, HIGHLIGHT_RADIUS);
    highlightLayer.fill({ color: SELECTED_COLOR, alpha: 0.15 });
    highlightLayer.stroke({ width: 2, color: SELECTED_COLOR, alpha: 0.8 });
  }

  function redraw() {
    linesLayer.clear();
    for (const conn of connections) {
      const source = boxes[conn.source]!;
      const target = boxes[conn.target]!;
      drawConnection(linesLayer, source, target);
    }
  }

  function resetAll(): Connection[] {
    const removed = connections.splice(0, connections.length);
    selectedBoxIndex = null;
    drawHighlight();
    redraw();
    return removed;
  }

  return { connections, redraw, resetAll };
}

function getBezierParams(source: BoxInfo, target: BoxInfo) {
  const dx = target.cx - source.cx;
  const dy = target.cy - source.cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return null;

  const start = boxEdge(source, target.cx, target.cy);
  const end = boxEdge(target, source.cx, source.cy);

  const perpX = -dy / dist;
  const perpY = dx / dist;
  const offset = dist * CURVE_OFFSET_RATIO;

  const midX = (source.cx + target.cx) / 2;
  const midY = (source.cy + target.cy) / 2;

  return {
    start,
    end,
    cpX: midX + perpX * offset,
    cpY: midY + perpY * offset,
  };
}

export function drawConnection(g: Graphics, source: BoxInfo, target: BoxInfo, color = LINE_COLOR, width = LINE_WIDTH) {
  const bez = getBezierParams(source, target);
  if (!bez) return;

  g.moveTo(bez.start.x, bez.start.y);
  g.quadraticCurveTo(bez.cpX, bez.cpY, bez.end.x, bez.end.y);
  g.stroke({ width, color });

  const tdx = bez.end.x - bez.cpX;
  const tdy = bez.end.y - bez.cpY;
  const tLen = Math.sqrt(tdx * tdx + tdy * tdy);
  if (tLen < 1) return;

  const ux = tdx / tLen;
  const uy = tdy / tLen;

  g.moveTo(bez.end.x, bez.end.y);
  g.lineTo(
    bez.end.x - ux * ARROW_SIZE + uy * ARROW_SIZE * 0.4,
    bez.end.y - uy * ARROW_SIZE - ux * ARROW_SIZE * 0.4,
  );
  g.lineTo(
    bez.end.x - ux * ARROW_SIZE - uy * ARROW_SIZE * 0.4,
    bez.end.y - uy * ARROW_SIZE + ux * ARROW_SIZE * 0.4,
  );
  g.closePath();
  g.fill({ color });
}

function hitTestLine(
  x: number,
  y: number,
  connections: Connection[],
  boxes: BoxInfo[],
): number {
  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i]!;
    const bez = getBezierParams(boxes[conn.source]!, boxes[conn.target]!);
    if (!bez) continue;

    for (let t = 0; t <= 1; t += 0.05) {
      const mt = 1 - t;
      const px = mt * mt * bez.start.x + 2 * mt * t * bez.cpX + t * t * bez.end.x;
      const py = mt * mt * bez.start.y + 2 * mt * t * bez.cpY + t * t * bez.end.y;
      if ((x - px) ** 2 + (y - py) ** 2 < LINE_HIT_THRESHOLD ** 2) return i;
    }
  }
  return -1;
}

function animateRemoval(
  app: Application,
  boxes: BoxInfo[],
  conn: Connection,
) {
  const layer = new Graphics();
  app.stage.addChild(layer);
  drawConnection(layer, boxes[conn.source]!, boxes[conn.target]!);
  layer.alpha = 0.8;

  const fade = () => {
    layer.alpha -= FADE_SPEED;
    if (layer.alpha <= 0) {
      app.ticker.remove(fade);
      app.stage.removeChild(layer);
      layer.destroy();
    }
  };
  app.ticker.add(fade);
}

/** Computes where a ray from the box center toward (toX, toY) exits the box boundary. */
function boxEdge(
  box: BoxInfo,
  toX: number,
  toY: number,
): { x: number; y: number } {
  const dx = toX - box.cx;
  const dy = toY - box.cy;
  if (dx === 0 && dy === 0) return { x: box.cx, y: box.cy };

  const halfW = box.w / 2;
  const halfH = box.h / 2;
  const scale =
    Math.abs(dx) / halfW > Math.abs(dy) / halfH
      ? halfW / Math.abs(dx)
      : halfH / Math.abs(dy);

  return { x: box.cx + dx * scale, y: box.cy + dy * scale };
}

function hitTest(x: number, y: number, boxes: BoxInfo[]): BoxInfo | null {
  for (const box of boxes) {
    const left = box.cx - box.w / 2;
    const right = box.cx + box.w / 2;
    const top = box.cy - box.h / 2;
    const bottom = box.cy + box.h / 2;
    if (x >= left && x <= right && y >= top && y <= bottom) {
      return box;
    }
  }
  return null;
}
