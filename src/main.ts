import { createGrid } from "./grid";
import { Connection, setupConnections } from "./connections";
import { isSubmitted, getStoredConnections, submitConnections } from "./submit";
import { createResultsRenderer } from "./results";
import { supabase } from "./supabase";

const boxes = createGrid();
const manager = setupConnections(boxes);
const results = createResultsRenderer(boxes, manager);

manager.startAnimation();

// --- UI elements ---
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const undoToast = document.getElementById("undo-toast") as HTMLDivElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const resultsBtn = document.getElementById("results-btn") as HTMLButtonElement;
const submitError = document.getElementById("submit-error") as HTMLDivElement;

let submitted = isSubmitted();
let submitting = false;

// Restore connections from localStorage if previously submitted
if (submitted) {
  const stored = getStoredConnections();
  manager.connections.push(...stored);
  manager.redraw();
  resultsBtn.style.display = "block";
}
let undoBackup: Connection[] | null = null;
let undoTimer: ReturnType<typeof setTimeout> | null = null;

function updateButtonVisibility() {
  if (submitted || submitting) {
    resetBtn.style.display = "none";
    submitBtn.style.display = submitting ? "block" : "none";
    return;
  }
  const hasConnections = manager.connections.length > 0;
  resetBtn.style.display = hasConnections ? "block" : "none";
  submitBtn.style.display = hasConnections ? "block" : "none";
}

// Poll visibility via animation frame
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
  undoToast.style.display = "block";
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

  submitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Sender...";
  submitError.style.display = "none";

  try {
    await submitConnections(manager.connections);
    submitted = true;
    submitBtn.style.display = "none";
    resetBtn.style.display = "none";
    resultsBtn.style.display = "block";
  } catch {
    submitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Send";
    submitError.textContent = "Noget gik galt — prøv igen";
    submitError.style.display = "block";
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
    // Check if results are enabled
    const { data } = await supabase
      .from("settings")
      .select("results_active")
      .single();

    if (!data?.results_active) {
      resultsBtn.textContent = "Se resultater";
      submitError.textContent = "Vi regner på det, læg du bare telefonen væk";
      submitError.style.display = "block";
      setTimeout(() => {
        submitError.style.display = "none";
      }, 4000);
      return;
    }

    await results.showResults(manager.connections);
    resultsBtn.textContent = "Opdater resultater";
  } catch {
    resultsBtn.textContent = "Se resultater";
    submitError.textContent = "Kunne ikke hente resultater";
    submitError.style.display = "block";
    setTimeout(() => {
      submitError.style.display = "none";
    }, 4000);
  } finally {
    resultsBtn.disabled = false;
  }
});
