import { Application } from "pixi.js";
import { createGrid } from "./grid";
import { Connection, setupConnections } from "./connections";

const app = new Application();

await app.init({
  background: "#1a1a2e",
  resizeTo: window,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);

const boxes = createGrid(app);
const manager = setupConnections(app, boxes);

// --- Reset button + undo toast ---
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const undoToast = document.getElementById("undo-toast") as HTMLDivElement;

let undoBackup: Connection[] | null = null;
let undoTimer: ReturnType<typeof setTimeout> | null = null;

function updateResetVisibility() {
  resetBtn.style.display = manager.connections.length > 0 ? "" : "none";
}

// Poll visibility cheaply via animation frame (connections change from pointer events)
function tick() {
  updateResetVisibility();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

resetBtn.addEventListener("click", () => {
  const removed = manager.resetAll();
  if (removed.length === 0) return;

  // Show undo toast
  undoBackup = removed;
  undoToast.style.display = "";
  resetBtn.style.display = "none";

  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    undoBackup = null;
    undoToast.style.display = "none";
    undoTimer = null;
  }, 3000);
});

undoToast.addEventListener("click", () => {
  if (!undoBackup) return;
  manager.connections.push(...undoBackup);
  manager.redraw();
  undoBackup = null;
  undoToast.style.display = "none";
  if (undoTimer) {
    clearTimeout(undoTimer);
    undoTimer = null;
  }
});
