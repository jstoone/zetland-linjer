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
