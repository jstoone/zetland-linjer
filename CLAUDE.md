# Linjer

Interactive mobile-first web app for a live Zetland event. Audience members draw causal connections between historical events on a canvas grid, then see aggregate results revealing how everyone drew different causal chains.

## Quick reference

```bash
npm run dev          # Start dev server
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run build        # Typecheck + Vite production build
```

## Tech stack

- **Vite + vanilla TypeScript** (no framework)
- **HTML/CSS/SVG** for all rendering — CSS Grid for box layout, SVG overlay for connection arrows
- **Supabase** for anonymous data storage (connections table)
- **npm** as package manager

## Project structure

```
src/
  config.ts       # THEME colors (CSS strings), BOX_LABELS, BOX_YEARS, ROWS, ArrowPersonality, PERSONALITIES
  grid.ts         # 12-box CSS Grid layout — creates div elements, returns BoxInfo[]
  connections.ts  # SVG living arrows — drag/tap-tap, Catmull-Rom paths, RAF animation, removal
  submit.ts       # Supabase submission, localStorage persistence, session ID
  supabase.ts     # Supabase client singleton
  results.ts      # Aggregate results as animated SVG paths
  main.ts         # App entry — wires everything together (no async init)
index.html        # Scene container, CSS Grid, SVG arrow-layer, buttons, all CSS
```

## Key conventions

- **Box numbering**: 0-based internally, 1-based in Supabase. Bottom-left = 0/1, top-right = 11/12. Grid is 3-3-3-3 (4 rows of 3).
- **All colors** live in `THEME` object in `config.ts` as CSS strings. CSS vars in `index.html` are kept in sync manually.
- **Rendering**: `.scene` is a fixed full-viewport container. `.grid` is a CSS Grid (3x4). SVG `.arrow-layer` overlays the grid for connection lines.
- **Arrow animation**: Each arrow has a random `ArrowPersonality` (drift/snake/loop/zigzag) and uses `smoothNoise()` + Catmull-Rom→cubic Bezier paths, animated via a single `requestAnimationFrame` loop.
- **Hit testing**: Thick transparent SVG paths with `pointer-events: stroke` (no manual bezier sampling).
- **Box centers**: Computed dynamically via `getBoundingClientRect()` relative to `.scene` — no stored cx/cy.
- **UI buttons** are HTML elements fixed-positioned over the scene.
- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`.
- `touch-action: none` on `.scene` prevents browser gestures from interfering with drag.

## Supabase

- Project URL: `https://msjzqyhdfohxrhdovjxq.supabase.co`
- `connections` table: `id` (uuid), `session_id` (text), `source_box` (smallint, 1-based), `target_box` (smallint, 1-based), `created_at`
- RLS allows anonymous inserts and selects
- RPC function `get_aggregate_connections()` returns grouped counts

## Context & learnings

The `.chief/prds/main/` directory has essential context:

- `prd.md` — Full product requirements, user stories, acceptance criteria, and design/technical decisions
- `progress.md` — Codebase patterns, conventions, and per-story learnings (what worked, what to watch out for)

Read these before starting unfamiliar work — they capture hard-won knowledge from each implementation round.

## localStorage keys

- `linjer_session_id` — anonymous UUID
- `linjer_submitted` — "true" after submission
- `linjer_connections` — JSON array of submitted connections (0-based indices)
