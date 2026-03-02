import { Application } from "pixi.js";
import { THEME } from "./config";
import { createGrid } from "./grid";
import { Connection, setupConnections } from "./connections";
import { isSubmitted, getStoredConnections, submitConnections } from "./submit";
import { createResultsRenderer } from "./results";

const app = new Application();

await app.init({
  background: THEME.bgCss,
  resizeTo: window,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);

const boxes = createGrid(app);
const manager = setupConnections(app, boxes);
const results = createResultsRenderer(app, boxes);

// --- UI elements ---
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const undoToast = document.getElementById("undo-toast") as HTMLDivElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const resultsBtn = document.getElementById("results-btn") as HTMLButtonElement;
const submitError = document.getElementById("submit-error") as HTMLDivElement;

let submitted = isSubmitted();

// Restore connections from localStorage if previously submitted
if (submitted) {
  const stored = getStoredConnections();
  manager.connections.push(...stored);
  manager.redraw();
  resultsBtn.style.display = "";
}
let undoBackup: Connection[] | null = null;
let undoTimer: ReturnType<typeof setTimeout> | null = null;

function updateButtonVisibility() {
  if (submitted) {
    resetBtn.style.display = "none";
    submitBtn.style.display = "none";
    return;
  }
  const hasConnections = manager.connections.length > 0;
  resetBtn.style.display = hasConnections ? "" : "none";
  submitBtn.style.display = hasConnections ? "" : "none";
}

// Poll visibility cheaply via animation frame (connections change from pointer events)
function tick() {
  updateButtonVisibility();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- Reset button + undo toast ---
resetBtn.addEventListener("click", () => {
  const removed = manager.resetAll();
  if (removed.length === 0) return;

  undoBackup = removed;
  undoToast.style.display = "";
  resetBtn.style.display = "none";
  submitBtn.style.display = "none";

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

// --- Submit button ---
submitBtn.addEventListener("click", async () => {
  if (submitted || manager.connections.length === 0) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Sender...";
  submitError.style.display = "none";

  try {
    await submitConnections(manager.connections);
    submitted = true;
    submitBtn.style.display = "none";
    resetBtn.style.display = "none";
    resultsBtn.style.display = "";
  } catch {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send";
    submitError.textContent = "Noget gik galt — prøv igen";
    submitError.style.display = "";
    setTimeout(() => {
      submitError.style.display = "none";
    }, 4000);
  }
});

// --- Results button ---
resultsBtn.addEventListener("click", async () => {
  resultsBtn.disabled = true;
  resultsBtn.textContent = "Henter...";

  try {
    await results.showResults(manager.connections);
    resultsBtn.textContent = "Opdater resultater";
  } catch {
    resultsBtn.textContent = "Se resultater";
    submitError.textContent = "Kunne ikke hente resultater";
    submitError.style.display = "";
    setTimeout(() => {
      submitError.style.display = "none";
    }, 4000);
  } finally {
    resultsBtn.disabled = false;
  }
});
