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
 *   Bottom row (Tier 1): 1–3
 *   Row 2 (Tier 2):      4–6
 *   Row 3 (Tier 3):      7–9
 *   Top row (Tier 4):    10–12
 *
 * Swap labels here to change what appears in the boxes.
 */
export const BOX_LABELS: string[] = [
  "11. september-angrebet",                  // 1  (Tier 1)
  "Økonomisk globalisering tager fart",      // 2  (Tier 1)
  "Internettet bliver allestedsnærværende",  // 3  (Tier 1)
  "Fejlslagne krige i Irak, Afghanistan mv.",// 4  (Tier 2)
  "Finanskrisen",                            // 5  (Tier 2)
  "Sociale medier bliver massemedier",       // 6  (Tier 2)
  "Trump bliver præsident",                  // 7  (Tier 3)
  "Brexit",                                  // 8  (Tier 3)
  "Migrationskrisen",                        // 9  (Tier 3)
  "EU og Natos magt svækkes",               // 10 (Tier 4)
  "Fuldskala-invasion af Ukraine",           // 11 (Tier 4)
  "Populisme på fremmarch globalt",          // 12 (Tier 4)
];

/** Year(s) for each box — same order as BOX_LABELS. */
export const BOX_YEARS: string[] = [
  "2001",         // 1
  "1995–2000",    // 2
  "2000–2005",    // 3
  "2003–2011",    // 4
  "2007–2009",    // 5
  "2009–2012",    // 6
  "2016",         // 7
  "2016",         // 8
  "2015–2016",    // 9
  "2016–2021",    // 10
  "2022–2026",    // 11
  "2016–2019",    // 12
];
