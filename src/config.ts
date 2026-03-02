/**
 * Color theme — all visual colors in one place.
 * Change these to re-skin the entire app.
 */
export const THEME = {
  /** Canvas / page background */
  bg: 0x1a1a2e,
  bgCss: "#1a1a2e",

  /** Box styling */
  boxFill: 0x16213e,
  boxBorder: 0x0f3460,
  boxGlow: 0x0f3460,

  /** Text */
  text: "#e2e2e2",
  textWhite: "#fff",

  /** Connections — user-drawn lines */
  line: 0xe94560,
  preview: 0x53c28b,
  selected: 0x53c28b,

  /** Aggregate results overlay */
  aggregate: 0x8899bb,
  userHighlight: 0xe94560,

  /** UI accents (buttons, toasts) */
  accent: "rgba(83, 194, 139, 0.9)",
  accentActive: "rgba(63, 164, 109, 0.95)",
  surface: "rgba(22, 33, 62, 0.85)",
  surfaceActive: "rgba(15, 52, 96, 0.95)",
  error: "rgba(233, 69, 96, 0.9)",
} as const;

/**
 * Box labels — ordered by box number (1-based index).
 * Numbering goes bottom-left → top-right:
 *   Bottom row (Tier 1): 1–2
 *   Row 2 (Tier 2):      3–5
 *   Row 3 (Tier 3):      6–8
 *   Top row (Tier 4):    9–11
 *
 * Swap labels here to change what appears in the boxes.
 */
export const BOX_LABELS: string[] = [
  "Geografi &\nressourcer",       // 1  (Tier 1)
  "Menneskets\nnatur",            // 2  (Tier 1)
  "Kolonialisme",                 // 3  (Tier 2)
  "Industriel\nrevolution",       // 4  (Tier 2)
  "Nationalisme",                 // 5  (Tier 2)
  "Verdenskrigene",               // 6  (Tier 3)
  "Den kolde krig",               // 7  (Tier 3)
  "Globalisering",                // 8  (Tier 3)
  "Klimaforandringer",            // 9  (Tier 4)
  "Populisme",                    // 10 (Tier 4)
  "AI-revolution",                // 11 (Tier 4)
];
