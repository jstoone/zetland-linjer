/**
 * Color theme — all visual colors in one place.
 * All values are CSS-compatible strings.
 */
export const THEME = {
  /** Page background — warm cream */
  bg: "#FFF5E6",

  /** Box styling */
  boxFill: "#FFFFFF",
  boxBorder: "#F0E4D4",
  boxGlow: "#FDDDD4",

  /** Text */
  text: "#1A1A1A",

  /** Connections — user-drawn lines */
  line: "#FF4713",
  preview: "#2D3180",
  selected: "#2D3180",

  /** Aggregate results overlay */
  aggregate: "#2D3180",
  userHighlight: "#FF4713",

  /** UI accents (buttons, toasts) */
  accent: "#FF4713",
  accentActive: "#E03A0A",
  surface: "#2D3180",
  surfaceActive: "#3B40A0",
  error: "#E04560",
} as const;

/** Visual layout: rows from top (Tier 4) to bottom (Tier 1). Values are box indices (0-based). */
export const ROWS: number[][] = [
  [9, 10, 11], // Tier 4 (top) — boxes 10, 11, 12
  [6, 7, 8],   // Tier 3       — boxes 7, 8, 9
  [3, 4, 5],   // Tier 2       — boxes 4, 5, 6
  [0, 1, 2],   // Tier 1 (bot) — boxes 1, 2, 3
];

/**
 * Box labels — ordered by box number (1-based index).
 * Numbering goes bottom-left → top-right:
 *   Bottom row (Tier 1): 1–3
 *   Row 2 (Tier 2):      4–6
 *   Row 3 (Tier 3):      7–9
 *   Top row (Tier 4):    10–12
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

export interface ArrowPersonality {
  segments: number;
  warpAmp: number;
  warpFreq: number;
  style: "drift" | "snake" | "loop" | "zigzag";
}

export const PERSONALITIES: ArrowPersonality[] = [
  { segments: 8,  warpAmp: 0.08, warpFreq: 2.5, style: "drift"  },
  { segments: 10, warpAmp: 0.12, warpFreq: 3.5, style: "snake"  },
  { segments: 12, warpAmp: 0.14, warpFreq: 2.0, style: "loop"   },
  { segments: 6,  warpAmp: 0.06, warpFreq: 4.0, style: "zigzag" },
  { segments: 9,  warpAmp: 0.10, warpFreq: 3.0, style: "drift"  },
];
