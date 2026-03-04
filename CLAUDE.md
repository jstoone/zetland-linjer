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
- **PIXI.js v8** for canvas rendering — async init pattern: `new Application()` then `await app.init(...)`
- **Supabase** for anonymous data storage (connections table)
- **npm** as package manager

## Project structure

```
src/
  config.ts       # BOX_LABELS, BOX_YEARS, THEME colors — edit here to change content/palette
  grid.ts         # 12-box grid layout (3x3x3x3), renders boxes + year text
  connections.ts  # Drag + tap-tap line drawing, bezier curves, arrowheads, removal
  submit.ts       # Supabase submission, localStorage persistence, session ID
  supabase.ts     # Supabase client singleton
  results.ts      # Aggregate results heatmap overlay
  main.ts         # App entry — wires everything together
index.html        # HTML shell with buttons, instruction header, CSS
```

## Key conventions

- **Box numbering**: 0-based internally, 1-based in Supabase. Bottom-left = 0/1, top-right = 11/12. Grid is 3-3-3-3 (4 rows of 3).
- **All colors** live in `THEME` object in `config.ts`. CSS vars in `index.html` are kept in sync manually.
- **UI buttons** are HTML elements fixed-positioned over the PIXI canvas (not PIXI objects).
- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`.
- When using `as const` on theme objects, add explicit `: number` type annotations to function params that accept color values.
- `touch-action: none` on canvas prevents browser gestures from interfering with drag.

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
