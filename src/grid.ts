import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { BOX_LABELS, BOX_YEARS, THEME } from "./config";

/** Visual layout: rows from top (Tier 4) to bottom (Tier 1). Values are box indices (0-based). */
const ROWS: number[][] = [
  [9, 10, 11], // Tier 4 (top) — boxes 10, 11, 12
  [6, 7, 8],   // Tier 3       — boxes 7, 8, 9
  [3, 4, 5],   // Tier 2       — boxes 4, 5, 6
  [0, 1, 2],   // Tier 1 (bot) — boxes 1, 2, 3
];

const PADDING_X = 12;
const PADDING_TOP = 24;
const GAP_X = 10;
const GAP_Y = 24;
const BOX_RADIUS = 10;
const BOX_BORDER = 1.5;
const GLOW_SPREAD = 6;
const GLOW_ALPHA = 0.18;

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
 * Creates the 12-box grid and adds it to the app stage.
 * Returns an array of BoxInfo (length 12) indexed by box number (0-based).
 */
export function createGrid(app: Application): BoxInfo[] {
  const boxes: BoxInfo[] = new Array(BOX_LABELS.length);

  const screenW = app.screen.width;
  const screenH = app.screen.height;

  // Calculate box dimensions
  const maxCols = 3;
  const boxW = Math.floor(
    (screenW - PADDING_X * 2 - GAP_X * (maxCols - 1)) / maxCols
  );
  const totalRows = ROWS.length;
  const boxH = Math.floor(
    (screenH - PADDING_TOP * 2 - GAP_Y * (totalRows - 1)) / totalRows
  );

  // Cap box height so it doesn't get absurdly tall on large screens
  const clampedH = Math.min(boxH, boxW * 0.85);

  const labelStyle = new TextStyle({
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 13,
    fill: THEME.text,
    align: "center",
    wordWrap: true,
    wordWrapWidth: boxW - 12,
    lineHeight: 16,
  });

  const yearStyle = new TextStyle({
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 11,
    fontStyle: "italic",
    fill: THEME.text,
    align: "center",
  });

  // Total grid height for centering vertically
  const gridH = totalRows * clampedH + (totalRows - 1) * GAP_Y;
  const offsetY = Math.max(PADDING_TOP, (screenH - gridH) / 2);

  for (let row = 0; row < ROWS.length; row++) {
    const cols = ROWS[row]!;
    const rowWidth = cols.length * boxW + (cols.length - 1) * GAP_X;
    const rowOffsetX = (screenW - rowWidth) / 2;

    for (let col = 0; col < cols.length; col++) {
      const boxIndex = cols[col]!;
      const label = BOX_LABELS[boxIndex]!;
      const year = BOX_YEARS[boxIndex] ?? "";

      const x = rowOffsetX + col * (boxW + GAP_X);
      const y = offsetY + row * (clampedH + GAP_Y);

      const container = new Container();
      container.position.set(x, y);

      // Subtle glow behind box
      const glow = new Graphics();
      glow.roundRect(
        -GLOW_SPREAD,
        -GLOW_SPREAD,
        boxW + GLOW_SPREAD * 2,
        clampedH + GLOW_SPREAD * 2,
        BOX_RADIUS + GLOW_SPREAD,
      );
      glow.fill({ color: THEME.boxGlow, alpha: GLOW_ALPHA });
      container.addChild(glow);

      // Background
      const bg = new Graphics();
      bg.roundRect(0, 0, boxW, clampedH, BOX_RADIUS);
      bg.fill(THEME.boxFill);
      bg.stroke({ width: BOX_BORDER, color: THEME.boxBorder });
      container.addChild(bg);

      // Label text — positioned slightly above center to leave room for year
      const text = new Text({ text: label, style: labelStyle });
      text.anchor.set(0.5);
      text.position.set(boxW / 2, clampedH / 2 - 8);
      container.addChild(text);

      // Year text — positioned below the label
      if (year) {
        const yearText = new Text({ text: year, style: yearStyle });
        yearText.anchor.set(0.5);
        yearText.position.set(boxW / 2, clampedH / 2 + text.height / 2 + 4);
        container.addChild(yearText);
      }

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
