import { BOX_LABELS, BOX_YEARS, ROWS } from "./config";

export interface BoxInfo {
  /** 0-based index into BOX_LABELS */
  index: number;
  /** The DOM element for this box */
  element: HTMLDivElement;
}

/**
 * Creates the 12-box grid inside the #grid container.
 * Returns an array of BoxInfo (length 12) indexed by box number (0-based).
 */
export function createGrid(): BoxInfo[] {
  const grid = document.getElementById("grid")!;
  const boxes: BoxInfo[] = new Array(BOX_LABELS.length);

  // Rows are top-to-bottom in ROWS (Tier 4 first), matching CSS grid order
  for (const row of ROWS) {
    for (const boxIndex of row) {
      const label = BOX_LABELS[boxIndex]!;
      const year = BOX_YEARS[boxIndex] ?? "";

      const el = document.createElement("div");
      el.className = "box";
      el.dataset.boxIndex = String(boxIndex);

      const labelEl = document.createElement("span");
      labelEl.className = "box-label";
      labelEl.textContent = label;
      el.appendChild(labelEl);

      if (year) {
        const yearEl = document.createElement("span");
        yearEl.className = "box-year";
        yearEl.textContent = year;
        el.appendChild(yearEl);
      }

      grid.appendChild(el);
      boxes[boxIndex] = { index: boxIndex, element: el };
    }
  }

  return boxes;
}
