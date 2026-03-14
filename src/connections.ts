import { BoxInfo } from "./grid";
import { THEME, PERSONALITIES, ArrowPersonality } from "./config";

export interface Connection {
  source: number;
  target: number;
}

const TAP_THRESHOLD = 10;

interface Arrow {
  id: number;
  source: number;
  target: number;
  seed: number;
  personality: ArrowPersonality;
  path: SVGPathElement;
  hit: SVGPathElement;
  pulsePhase: number;
}

export interface ConnectionManager {
  connections: Connection[];
  redraw: () => void;
  resetAll: () => Connection[];
  startAnimation: () => void;
  stopAnimation: () => void;
  /** Register external arrows (results) to participate in the animation loop */
  registerResultArrows: (arrows: ResultArrow[]) => void;
  clearResultArrows: () => void;
}

export interface ResultArrow {
  seed: number;
  personality: ArrowPersonality;
  path: SVGPathElement;
  pulsePhase: number;
  sourceEl: HTMLDivElement;
  targetEl: HTMLDivElement;
  basePulse: boolean;
  revealAt?: number;
  revealDuration?: number;
  targetOpacity?: number;
  countLabel?: SVGTextElement;
  countBg?: SVGRectElement;
}

// ── SVG helpers ──────────────────────────────────────────────────────────────

const scene = () => document.getElementById("scene")!;
const defsEl = () => document.getElementById("marker-defs")!;
const connectionsLayer = () => document.getElementById("connections-layer")!;
const previewPath = () => document.getElementById("preview") as unknown as SVGPathElement;

function sceneCenter(el: HTMLElement): { x: number; y: number } {
  const sr = scene().getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return {
    x: er.left - sr.left + er.width / 2,
    y: er.top - sr.top + er.height / 2,
  };
}

function clientToScene(cx: number, cy: number): { x: number; y: number } {
  const sr = scene().getBoundingClientRect();
  return { x: cx - sr.left, y: cy - sr.top };
}

function smoothNoise(x: number, seed: number): number {
  return (
    Math.sin(x * 1.3 + seed * 7.1) * 0.5 +
    Math.sin(x * 2.7 + seed * 3.3) * 0.3 +
    Math.sin(x * 5.1 + seed * 1.7) * 0.15 +
    Math.sin(x * 9.3 + seed * 5.9) * 0.05
  );
}

function buildPath(
  s: { x: number; y: number },
  e: { x: number; y: number },
  seed: number,
  personality: ArrowPersonality,
  t: number,
): string {
  const { segments, warpAmp, warpFreq, style } = personality;

  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = -dy / len;
  const py = dx / len;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const bx = s.x + dx * f;
    const by = s.y + dy * f;

    const warp =
      smoothNoise(f * warpFreq + t * 0.0004 + seed, seed) *
      warpAmp *
      len *
      0.18;

    let extra = 0;
    if (style === "loop" && f > 0.3 && f < 0.7) {
      extra =
        Math.sin(((f - 0.3) / 0.4) * Math.PI) * warpAmp * len * 0.22;
    } else if (style === "zigzag") {
      extra = (i % 2 === 0 ? 1 : -1) * warpAmp * len * 0.08;
    } else if (style === "snake") {
      extra = Math.sin(f * Math.PI * 3 + seed) * warpAmp * len * 0.12;
    }

    pts.push({
      x: bx + px * (warp + extra),
      y: by + py * (warp + extra),
    });
  }

  // Catmull-Rom → cubic bezier
  const first = pts[0]!;
  let d = `M${first.x.toFixed(2)},${first.y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

function ensureMarker(color: string): string {
  const id = "mk-" + color.replace("#", "");
  if (!document.getElementById(id)) {
    const NS = "http://www.w3.org/2000/svg";
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
    defsEl().appendChild(m);
  }
  return id;
}

function createSvgPath(): SVGPathElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "path");
}

// ── Main setup ───────────────────────────────────────────────────────────────

export function setupConnections(boxes: BoxInfo[]): ConnectionManager {
  const connections: Connection[] = [];
  const arrows: Arrow[] = [];
  let resultArrows: ResultArrow[] = [];
  let nextId = 0;
  let animFrameId = 0;
  let dragging = false;
  let dragSourceBox: BoxInfo | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let selectedBoxIndex: number | null = null;
  let hoveredBoxIndex: number | null = null;

  const lineColor = THEME.line;
  const markerId = ensureMarker(lineColor);

  function addArrow(source: number, target: number): Arrow {
    const seed = Math.random() * 100;
    const personality =
      PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]!;
    const id = ++nextId;

    const layer = connectionsLayer();

    const hit = createSvgPath();
    hit.setAttribute("fill", "none");
    hit.setAttribute("stroke", "transparent");
    hit.setAttribute("stroke-width", "18");
    hit.classList.add("hittable");
    hit.style.cursor = "pointer";

    const path = createSvgPath();
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", lineColor);
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("marker-end", `url(#${markerId})`);
    path.style.filter = `drop-shadow(0 0 4px ${lineColor}88)`;
    path.classList.add("hittable");
    path.style.cursor = "pointer";

    const handleClick = (e: Event) => {
      e.stopPropagation();
      removeArrow(id);
    };
    hit.addEventListener("click", handleClick);
    path.addEventListener("click", handleClick);

    layer.appendChild(hit);
    layer.appendChild(path);

    const arrow: Arrow = {
      id,
      source,
      target,
      seed,
      personality,
      path,
      hit,
      pulsePhase: Math.random() * Math.PI * 2,
    };
    arrows.push(arrow);
    return arrow;
  }

  function removeArrow(id: number) {
    const idx = arrows.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const arrow = arrows[idx]!;

    // Fade out
    arrow.path.style.transition = "opacity 0.3s ease";
    arrow.hit.style.transition = "opacity 0.3s ease";
    arrow.path.style.opacity = "0";
    arrow.hit.style.opacity = "0";

    setTimeout(() => {
      arrow.path.remove();
      arrow.hit.remove();
    }, 300);

    arrows.splice(idx, 1);

    // Also remove from connections
    const connIdx = connections.findIndex(
      (c) => c.source === arrow.source && c.target === arrow.target,
    );
    if (connIdx >= 0) connections.splice(connIdx, 1);

    updateSelection(null);
  }

  function toggle(source: number, target: number) {
    const connIdx = connections.findIndex(
      (c) => c.source === source && c.target === target,
    );
    if (connIdx >= 0) {
      // Remove
      const conn = connections[connIdx]!;
      const arrowIdx = arrows.findIndex(
        (a) => a.source === conn.source && a.target === conn.target,
      );
      if (arrowIdx >= 0) {
        const arrow = arrows[arrowIdx]!;
        arrow.path.style.transition = "opacity 0.3s ease";
        arrow.hit.style.transition = "opacity 0.3s ease";
        arrow.path.style.opacity = "0";
        arrow.hit.style.opacity = "0";
        setTimeout(() => {
          arrow.path.remove();
          arrow.hit.remove();
        }, 300);
        arrows.splice(arrowIdx, 1);
      }
      connections.splice(connIdx, 1);
    } else {
      connections.push({ source, target });
      addArrow(source, target);
    }
  }

  function updateSelection(index: number | null) {
    selectedBoxIndex = index;
    for (const box of boxes) {
      box.element.classList.toggle(
        "is-selected",
        index === box.index,
      );
    }
  }

  function getBoxAt(cx: number, cy: number): BoxInfo | null {
    const els = document.elementsFromPoint(cx, cy);
    for (const el of els) {
      if (el instanceof HTMLElement && el.classList.contains("box")) {
        const idx = el.dataset.boxIndex;
        if (idx !== undefined) return boxes[Number(idx)] ?? null;
      }
    }
    return null;
  }

  function bop(el: HTMLElement) {
    el.classList.remove("is-bop");
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add("is-bop");
  }

  // ── Pointer events ──

  const sceneEl = scene();

  sceneEl.addEventListener("pointerdown", (e: PointerEvent) => {
    const box = getBoxAt(e.clientX, e.clientY);
    if (!box) return;

    dragging = true;
    dragSourceBox = box;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    box.element.classList.add("is-source");
    bop(box.element);

    previewPath().setAttribute("stroke", THEME.preview);
    previewPath().style.filter = `drop-shadow(0 0 5px ${THEME.preview}99)`;
  });

  sceneEl.addEventListener("pointermove", (e: PointerEvent) => {
    if (!dragging || !dragSourceBox) return;

    const previewSrc = sceneCenter(dragSourceBox.element);
    const previewCur = clientToScene(e.clientX, e.clientY);

    const fakeArrow = {
      seed: 42,
      personality: {
        segments: 10,
        warpAmp: 0.1,
        warpFreq: 3.0,
        style: "snake" as const,
      },
    };
    const d = buildPath(
      previewSrc,
      previewCur,
      fakeArrow.seed,
      fakeArrow.personality,
      performance.now(),
    );
    previewPath().setAttribute("d", d);

    // Highlight target
    document
      .querySelectorAll(".box.is-target-valid")
      .forEach((b) => b.classList.remove("is-target-valid"));
    const target = getBoxAt(e.clientX, e.clientY);
    const targetIdx = target && target.index !== dragSourceBox.index ? target.index : null;
    if (targetIdx !== null) {
      target!.element.classList.add("is-target-valid");
    }
    if (targetIdx !== hoveredBoxIndex) {
      if (targetIdx !== null) bop(boxes[targetIdx]!.element);
      hoveredBoxIndex = targetIdx;
    }
  });

  const endDrag = (e: PointerEvent) => {
    if (!dragging || !dragSourceBox) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < TAP_THRESHOLD) {
      // Tap
      const tappedBox = getBoxAt(e.clientX, e.clientY);
      if (tappedBox) {
        if (selectedBoxIndex === null) {
          updateSelection(tappedBox.index);
        } else if (selectedBoxIndex === tappedBox.index) {
          updateSelection(null);
        } else {
          toggle(selectedBoxIndex, tappedBox.index);
          bop(tappedBox.element);
          updateSelection(null);
        }
      } else {
        updateSelection(null);
      }
    } else {
      // Drag
      const target = getBoxAt(e.clientX, e.clientY);
      if (target && target.index !== dragSourceBox.index) {
        toggle(dragSourceBox.index, target.index);
        bop(target.element);
      }
    }

    // Clean up
    dragSourceBox.element.classList.remove("is-source");
    document
      .querySelectorAll(".box.is-target-valid")
      .forEach((b) => b.classList.remove("is-target-valid"));
    dragging = false;
    dragSourceBox = null;
    hoveredBoxIndex = null;
    previewPath().setAttribute("d", "");
  };

  sceneEl.addEventListener("pointerup", endDrag);
  sceneEl.addEventListener("pointercancel", () => {
    if (dragSourceBox) {
      dragSourceBox.element.classList.remove("is-source");
    }
    document
      .querySelectorAll(".box.is-target-valid")
      .forEach((b) => b.classList.remove("is-target-valid"));
    dragging = false;
    dragSourceBox = null;
    hoveredBoxIndex = null;
    previewPath().setAttribute("d", "");
  });

  // ── Animation loop ──

  function animate(t: number) {
    // Animate user arrows
    for (const arrow of arrows) {
      const s = sceneCenter(boxes[arrow.source]!.element);
      const e = sceneCenter(boxes[arrow.target]!.element);
      const d = buildPath(s, e, arrow.seed, arrow.personality, t);
      arrow.path.setAttribute("d", d);
      arrow.hit.setAttribute("d", d);

      // Pulse
      const pulse =
        0.75 + 0.25 * Math.sin(t * 0.0015 + arrow.pulsePhase);
      arrow.path.setAttribute(
        "stroke-width",
        (1.5 + pulse * 1.0).toFixed(2),
      );
      arrow.path.style.opacity = (0.65 + pulse * 0.35).toFixed(2);
    }

    // Animate result arrows
    for (const ra of resultArrows) {
      // Compute reveal alpha (0→1 fade-in)
      let revealAlpha = 1;
      if (ra.revealAt !== undefined) {
        const elapsed = t - ra.revealAt;
        const duration = ra.revealDuration ?? 400;
        if (elapsed < 0) {
          revealAlpha = 0;
        } else if (elapsed < duration) {
          revealAlpha = elapsed / duration;
        }
      }

      const s = sceneCenter(ra.sourceEl);
      const e = sceneCenter(ra.targetEl);
      const d = buildPath(s, e, ra.seed, ra.personality, t);
      ra.path.setAttribute("d", d);

      const maxOpacity = ra.targetOpacity ?? 0.7;
      if (ra.basePulse) {
        const pulse =
          0.75 + 0.25 * Math.sin(t * 0.0015 + ra.pulsePhase);
        ra.path.style.opacity = ((0.5 + pulse * 0.2) * revealAlpha).toFixed(2);
      } else {
        ra.path.style.opacity = (maxOpacity * revealAlpha).toFixed(2);
      }

      // Reposition count label at midpoint
      if (ra.countLabel && ra.countBg) {
        const mx = (s.x + e.x) / 2;
        const my = (s.y + e.y) / 2;
        const bw = 28;
        const bh = 20;
        ra.countLabel.setAttribute("x", String(mx));
        ra.countLabel.setAttribute("y", String(my));
        ra.countBg.setAttribute("x", String(mx - bw / 2));
        ra.countBg.setAttribute("y", String(my - bh / 2));
        ra.countLabel.style.opacity = revealAlpha.toFixed(2);
        ra.countBg.style.opacity = (revealAlpha * 0.85).toFixed(2);
      }
    }

    animFrameId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    animFrameId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    cancelAnimationFrame(animFrameId);
  }

  // ── Public API ──

  function redraw() {
    // Clear all SVG arrows and rebuild from connections
    for (const arrow of arrows) {
      arrow.path.remove();
      arrow.hit.remove();
    }
    arrows.length = 0;
    for (const conn of connections) {
      addArrow(conn.source, conn.target);
    }
  }

  function resetAll(): Connection[] {
    const removed = connections.splice(0, connections.length);
    for (const arrow of arrows) {
      arrow.path.remove();
      arrow.hit.remove();
    }
    arrows.length = 0;
    updateSelection(null);
    return removed;
  }

  return {
    connections,
    redraw,
    resetAll,
    startAnimation,
    stopAnimation,
    registerResultArrows(ra: ResultArrow[]) {
      resultArrows = ra;
    },
    clearResultArrows() {
      resultArrows = [];
    },
  };
}
