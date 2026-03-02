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
