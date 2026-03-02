## Codebase Patterns
- Project uses Vite + vanilla TypeScript (no framework)
- PIXI.js v8 for canvas rendering — use `new Application()` then `await app.init(...)` pattern
- Source code lives in `src/`
- npm is the package manager (no bun/pnpm)
- TypeScript strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- Run `npx tsc --noEmit` for typecheck, `npx vite build` for build
- Canvas is full-viewport with `resizeTo: window`, background `#1a1a2e`
- Box labels live in `src/config.ts` as a `BOX_LABELS` string array (0-based index, box 1 = index 0)
- Grid rendering lives in `src/grid.ts`, exports `createGrid(app)` → returns `BoxInfo[]`
- `BoxInfo` has `index`, `container`, `cx`, `cy`, `w`, `h` — needed for line drawing in future stories
- Connection logic lives in `src/connections.ts`, exports `setupConnections(app, boxes)` → returns `ConnectionManager`
- `ConnectionManager` has `connections: Connection[]` (mutable array) and `redraw()` to re-render all lines
- `Connection` interface: `{ source: number; target: number }` (0-based box indices)
- Lines use quadratic bezier curves with perpendicular offset, arrowheads at target box edge
- `touch-action: none` on canvas element prevents browser gestures from interfering with drag
- Tap vs drag detection: compare pointer movement distance against `TAP_THRESHOLD` (10px) in `endDrag`
- `selectedBoxIndex` state in `setupConnections` tracks tap-tap selection; `highlightLayer` renders the visual highlight

---

## 2026-03-02 - US-001
- Set up Vite + TypeScript project scaffold
- Installed PIXI.js v8 and created full-viewport responsive canvas
- Canvas uses `resizeTo: window`, `autoDensity: true`, and `devicePixelRatio` for crisp mobile rendering
- Added `index.html` with viewport meta (no scaling), CSS reset for full-screen canvas
- Files changed: `package.json`, `tsconfig.json`, `index.html`, `src/main.ts`, `.gitignore`
- **Learnings for future iterations:**
  - Vite `create` won't scaffold into a non-empty directory — set up manually instead
  - PIXI.js v8 uses async init pattern: `const app = new Application(); await app.init({...})`
  - `autoDensity: true` + `resolution: devicePixelRatio` ensures sharp rendering on high-DPI phone screens
  - The viewport meta tag needs `maximum-scale=1.0, user-scalable=no` to prevent pinch-zoom on mobile
---

## 2026-03-02 - US-002
- Rendered 11 boxes in a 3-3-3-2 grid layout (Tier 4 at top, Tier 1 at bottom)
- Created `src/config.ts` with `BOX_LABELS` array — easy to swap labels
- Created `src/grid.ts` with `createGrid()` that positions boxes responsively
- Boxes have rounded corners, borders, centered text labels, and adapt to screen size
- Updated `src/main.ts` to import and call `createGrid(app)`
- Files changed: `src/config.ts` (new), `src/grid.ts` (new), `src/main.ts`
- **Learnings for future iterations:**
  - PIXI.js v8 `Graphics` API: use `bg.roundRect(...)` then `bg.fill(...)` then `bg.stroke(...)` — chained shape → fill → stroke
  - Box numbering is 0-based internally (array index) but 1-based in user-facing context — `BOX_LABELS[0]` = box 1
  - The grid ROWS constant maps visual rows (top-to-bottom) to box indices — bottom row has 2 boxes, rest have 3
  - `BoxInfo` interface is exported for future stories (line drawing will need `cx`, `cy` for connection endpoints)
  - Text `wordWrapWidth` should be box width minus padding to keep text readable
---

## 2026-03-02 - US-003
- Implemented drag-to-connect interaction between boxes
- Created `src/connections.ts` with full pointer event handling (pointerdown on boxes, pointermove/pointerup on stage)
- Preview line (green, semi-transparent) follows finger during drag, disappears if drag ends outside a box
- Committed connections rendered as bezier curves (quadratic, with perpendicular offset) with arrowheads
- Lines start/end at box edges using ray-box intersection calculation
- Added `touch-action: none` to canvas CSS in `index.html` for reliable mobile touch handling
- Files changed: `src/connections.ts` (new), `src/main.ts`, `index.html`
- **Learnings for future iterations:**
  - PIXI v8 pointer events: set `eventMode = 'static'` and `hitArea` on containers for interaction
  - Use `app.stage.hitArea = app.screen` to capture stage-level pointer events
  - `pointercancel` event should be handled on mobile (browser can steal touch for gestures)
  - For bezier arrowheads: tangent at t=1 of quadratic bezier P0,CP,P2 is direction `P2 - CP`
  - Box edge intersection: compare `|dx|/halfW` vs `|dy|/halfH` to determine which edge is hit
  - `FederatedPointerEvent.global` gives coordinates in stage space (matches CSS coords with autoDensity)
---

## 2026-03-02 - US-004
- Added tap-tap fallback for creating connections (tap one box, then tap another)
- Distinguishes taps from drags by measuring pointer movement distance (< 10px = tap)
- Selected box gets a green highlight overlay (rounded rect with fill alpha 0.15 and stroke alpha 0.8)
- Tapping the same box twice deselects it; tapping empty space also deselects
- Both drag and tap-tap work simultaneously — drag takes precedence when movement exceeds threshold
- Added `highlightLayer` Graphics between boxes and linesLayer for proper z-ordering
- Files changed: `src/connections.ts`
- **Learnings for future iterations:**
  - Tap vs drag: track `dragStartX`/`dragStartY` on pointerdown, compare distance on pointerup
  - `highlightLayer` is inserted before `linesLayer` in stage children order so highlights appear behind lines
  - The green highlight uses the same color as the preview line (`SELECTED_COLOR = 0x53c28b`) for visual consistency
  - `BOX_RADIUS` (10) from grid.ts must be matched by `HIGHLIGHT_RADIUS` in connections.ts for the highlight overlay to align with box corners
- `getBezierParams(source, target)` returns `{ start, end, cpX, cpY }` — reuse for any bezier curve operation (drawing, hit testing, animation)
- For fade-out animations: create temp `Graphics` layer, decrement `layer.alpha` via `app.ticker`, `destroy()` when alpha ≤ 0
- HTML overlay elements (fixed-position buttons/toasts) work well for UI controls on top of the PIXI canvas
- `ConnectionManager` returned from `setupConnections()` has `connections`, `redraw()`, and `resetAll()`
---

## 2026-03-02 - US-005
- Implemented connection removal via three methods: toggle (same connection again), tap on line, and both drag/tap-tap paths
- Extracted `getBezierParams` helper from `drawConnection` for reuse in hit testing and removal animation
- Added `hitTestLine` that samples 20 points along each bezier curve and checks distance to tap point (threshold: 20px)
- Added `animateRemoval` that draws the removed line on a temporary Graphics layer and fades it out over ~300ms using `app.ticker`
- Added `toggle` closure inside `setupConnections` that checks for existing connection before adding/removing
- Refactored `drawConnection` to accept an optional `color` parameter for future use (e.g., heatmap/aggregate styling)
- Files changed: `src/connections.ts`
- **Learnings for future iterations:**
  - `getBezierParams` returns the start/end edge points and control point — reuse for any bezier-related feature (hit testing, styling, labels)
  - PIXI v8 `Ticker.add(fn)` / `Ticker.remove(fn)` works with plain function references; no special signature required
  - For fade animations: create a temporary `Graphics`, set `layer.alpha`, decrement in ticker, then `destroy()` when done
  - Line hit testing via bezier sampling: 20 samples (t += 0.05) with a 20px threshold works well for touch targets on mobile
  - Squared distance comparison `(dx**2 + dy**2 < threshold**2)` avoids unnecessary `Math.sqrt` calls in hot loops
---

## 2026-03-02 - US-006
- Added "Nulstil" (Reset) button fixed at bottom-center of screen, only visible when connections exist
- Added 3-second "Fortryd" (Undo) toast that appears after reset — tapping it restores all removed connections
- Extended `ConnectionManager` with `resetAll()` method that clears connections array, deselects, and redraws
- Button and toast are HTML elements overlaid on the canvas (not PIXI objects) for better touch handling and styling
- Files changed: `src/connections.ts`, `src/main.ts`, `index.html`
- **Learnings for future iterations:**
  - HTML overlay buttons work well for UI controls on top of PIXI canvas — easier to style and more accessible than PIXI-based UI
  - `resetAll()` returns the removed connections array so callers can implement undo
  - Using `requestAnimationFrame` to poll `connections.length` for button visibility is simple and avoids needing custom events
  - Fixed-position buttons with `bottom: 24px` + `left: 50%; transform: translateX(-50%)` center well on mobile
  - The `#undo-toast` sits at `bottom: 80px` to stay above the reset button without overlap
---
