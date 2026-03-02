import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { BOX_LABELS } from "./config";

/** Visual layout: rows from top (Tier 4) to bottom (Tier 1). Values are box indices (0-based). */
const ROWS: number[][] = [
  [8, 9, 10], // Tier 4 (top) — boxes 9, 10, 11
  [5, 6, 7],  // Tier 3       — boxes 6, 7, 8
  [2, 3, 4],  // Tier 2       — boxes 3, 4, 5
  [0, 1],     // Tier 1 (bot) — boxes 1, 2
];

const PADDING_X = 16;
const PADDING_TOP = 24;
const GAP = 12;
const BOX_RADIUS = 10;
const BOX_BORDER = 1.5;
const BOX_COLOR = 0x16213e;
const BOX_BORDER_COLOR = 0x0f3460;
const TEXT_COLOR = "#e2e2e2";

export interface BoxInfo {
  /** 0-based index into BOX_LABELS */
  index: number;
  /** The PIXI container holding this box */
  container: Container;
  /** Center x in world coords */
  cx: number;
  /** Center y in world coords */
  cy: number;
  /** Box width */
  w: number;
  /** Box height */
  h: number;
}

/**
 * Creates the 11-box grid and adds it to the app stage.
 * Returns an array of BoxInfo (length 11) indexed by box number (0-based).
 */
export function createGrid(app: Application): BoxInfo[] {
  const boxes: BoxInfo[] = new Array(BOX_LABELS.length);

  const screenW = app.screen.width;
  const screenH = app.screen.height;

  // Calculate box dimensions
  const maxCols = 3;
  const boxW = Math.floor(
    (screenW - PADDING_X * 2 - GAP * (maxCols - 1)) / maxCols
  );
  const totalRows = ROWS.length;
  const boxH = Math.floor(
    (screenH - PADDING_TOP * 2 - GAP * (totalRows - 1)) / totalRows
  );

  // Cap box height so it doesn't get absurdly tall on large screens
  const clampedH = Math.min(boxH, boxW * 0.75);

  const textStyle = new TextStyle({
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 14,
    fill: TEXT_COLOR,
    align: "center",
    wordWrap: true,
    wordWrapWidth: boxW - 16,
    lineHeight: 18,
  });

  // Total grid height for centering vertically
  const gridH = totalRows * clampedH + (totalRows - 1) * GAP;
  const offsetY = Math.max(PADDING_TOP, (screenH - gridH) / 2);

  for (let row = 0; row < ROWS.length; row++) {
    const cols = ROWS[row]!;
    const rowWidth = cols.length * boxW + (cols.length - 1) * GAP;
    const rowOffsetX = (screenW - rowWidth) / 2;

    for (let col = 0; col < cols.length; col++) {
      const boxIndex = cols[col]!;
      const label = BOX_LABELS[boxIndex]!;

      const x = rowOffsetX + col * (boxW + GAP);
      const y = offsetY + row * (clampedH + GAP);

      const container = new Container();
      container.position.set(x, y);

      // Background
      const bg = new Graphics();
      bg.roundRect(0, 0, boxW, clampedH, BOX_RADIUS);
      bg.fill(BOX_COLOR);
      bg.stroke({ width: BOX_BORDER, color: BOX_BORDER_COLOR });
      container.addChild(bg);

      // Label
      const text = new Text({ text: label, style: textStyle });
      text.anchor.set(0.5);
      text.position.set(boxW / 2, clampedH / 2);
      container.addChild(text);

      app.stage.addChild(container);

      boxes[boxIndex] = {
        index: boxIndex,
        container,
        cx: x + boxW / 2,
        cy: y + clampedH / 2,
        w: boxW,
        h: clampedH,
      };
    }
  }

  return boxes;
}
