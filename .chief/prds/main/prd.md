# PRD: Linjer — Interactive Causality Drawing App

## Introduction

**Linjer** is a mobile-first interactive web app used during a live Zetland event at Øster Gasværk (Copenhagen). Journalist Jakob Moll gives a talk about "the narrative fallacy" — the human tendency to construct causal stories from random events (inspired by Nassim Nicholas Taleb's work).

The audience (~800 people) opens the app on their phones and sees a grid of 11 boxes containing historical events and phenomena arranged in tiers. They draw lines between boxes to show perceived causal connections ("What led to what?"). After submitting, they can view aggregate results showing which connections the rest of the audience drew.

The punchline of the talk: everyone confidently draws different causal chains, revealing how we construct narratives after the fact. The app is the mirror that shows this bias in action.

This is a short-lived project — it will be taken down the day after the event.

## Goals

- Provide a playful, intuitive mobile experience where audience members draw causal connections between historical events
- Handle up to ~500 concurrent submissions without issues
- Show aggregate results so users can see "did others think like me?"
- Keep the design simple and inviting — the app should spark a feeling of "legesynd" (the urge to play/tinker)
- Box labels must be easy to change up until the last 30 minutes before the event
- Use canvas-based rendering (PIXI.js or similar) for smooth, visually appealing line drawing that routes around boxes

## User Stories

### US-001: Set up project with PIXI.js canvas
**Priority:** 1
**Description:** As a developer, I need a working PIXI.js canvas app scaffold so that all subsequent visual work has a foundation.

**Acceptance Criteria:**
- [ ] Project initialized with PIXI.js (or equivalent canvas library)
- [ ] Full-viewport canvas renders on mobile and desktop browsers
- [ ] Canvas is responsive — fills the screen and adapts to orientation
- [ ] A basic colored background renders to confirm PIXI is working
- [ ] The app can be served locally for development

### US-002: Render the box grid layout
**Priority:** 2
**Description:** As a user, I want to see a grid of labeled boxes on my phone screen so I can understand the exercise at a glance.

**Acceptance Criteria:**
- [ ] 11 boxes rendered in a 3-3-3-2 layout (3 boxes in top three rows, 2 boxes centered in the bottom row)
- [ ] Top row represents "current world order" (Tier 4), bottom row represents "deep structural forces" (Tier 1)
- [ ] Each box displays a short text label (the historical event/phenomenon name)
- [ ] Text fits inside the box and is readable on a phone screen (min ~375px viewport width)
- [ ] Box labels are defined in a single ordered config array where the array index corresponds to the box number (1-based, bottom-left to top-right: positions 1–2 = bottom row, 3–5, 6–8, 9–11 = top row). Moll can easily swap labels out
- [ ] Boxes are visually distinct with rounded corners, clear borders, and adequate spacing between them
- [ ] The layout is centered and looks good on typical phone screens (375px–430px width)

### US-003: Draw lines between boxes by dragging
**Priority:** 3
**Description:** As a user, I want to drag from one box to another to draw a causal connection, because it feels natural and playful on a touchscreen.

**Acceptance Criteria:**
- [ ] Touch-dragging from one box to another creates a visible line/arrow between them
- [ ] While dragging, a preview line follows the user's finger from the source box to the current touch position
- [ ] If the drag ends on a valid target box, the line is committed and stays visible
- [ ] If the drag ends outside any box, the preview line disappears (no connection made)
- [ ] Lines are drawn as curves or routed paths that avoid overlapping other boxes where possible
- [ ] Connections are unrestricted — users can connect any box to any other box regardless of tier
- [ ] Each connection is visually styled (e.g., a colored line with an arrowhead or dot indicating direction)
- [ ] Drawing feels smooth at 60fps on a modern phone

### US-004: Draw lines between boxes by tap-tap (fallback)
**Priority:** 4
**Description:** As a user, if I find dragging awkward, I want to tap two boxes in sequence to create a connection.

**Acceptance Criteria:**
- [ ] Tapping a box selects it (visual highlight, e.g., a glow or color change)
- [ ] Tapping a second box creates a line from the first to the second
- [ ] After a connection is made, selection is cleared (ready for the next connection)
- [ ] Tapping the same box twice deselects it (cancels the selection)
- [ ] Both drag and tap-tap work simultaneously without conflicting

### US-005: Remove individual connections
**Priority:** 5
**Description:** As a user, I want to remove a connection I made so I can change my mind without resetting everything.

**Acceptance Criteria:**
- [ ] Drawing the same connection again (same source and target) removes/toggles it off
- [ ] Alternatively, tapping on an existing line removes it
- [ ] The line disappears immediately with a brief visual feedback (e.g., fade out)

### US-006: Reset all connections
**Priority:** 6
**Description:** As a user, I want a reset button to clear all my lines and start over, so I can rethink my answer.

**Acceptance Criteria:**
- [ ] A clearly visible "Reset" / "Nulstil" button is present on screen
- [ ] Pressing it clears all drawn connections
- [ ] A brief confirmation or undo option is shown to prevent accidental resets (can be as simple as a 3-second "Undo" toast)

### US-007: Submit connections to Supabase
**Priority:** 7
**Description:** As a user, I want to submit my drawn connections so they are saved and included in the aggregate results.

**Acceptance Criteria:**
- [ ] A "Submit" / "Send" button is visible once at least one connection has been drawn
- [ ] Pressing submit sends the user's connections to the Supabase `connections` table via the JS SDK
- [ ] Each connection is inserted as its own row with the user's `session_id`, `source_box`, and `target_box`
- [ ] The `session_id` is a unique anonymous ID generated client-side (e.g. `crypto.randomUUID()`) and stored in localStorage
- [ ] The submit button is disabled/hidden after successful submission to prevent duplicate submissions
- [ ] If submission fails (network error), an error message is shown and the user can retry
- [ ] The Supabase table allows anonymous inserts (no auth required)
- [ ] Once submitted, the user cannot modify or resubmit — localStorage tracks the "submitted" state

### US-008: Persist submission in localStorage
**Priority:** 8
**Description:** As a user, I want my submission to survive a page reload so I don't lose my data.

**Acceptance Criteria:**
- [ ] After successful submission, the user's connections and anonymous ID are saved to localStorage
- [ ] On page load, if localStorage contains a previous submission, the app restores that state (shows the submitted connections, hides the submit button, shows the "Show Results" button)
- [ ] The user's own connections are re-rendered on the canvas from localStorage

### US-009: Set up Supabase table for connections
**Priority:** 9
**Description:** As a developer, I need a Supabase table to store audience connections (one row per connection drawn).

**Acceptance Criteria:**
- [ ] A `connections` table exists with columns: `id` (uuid, primary key, default `gen_random_uuid()`), `session_id` (text, not null), `source_box` (smallint, not null), `target_box` (smallint, not null), `created_at` (timestamptz, default `now()`)
- [ ] Box numbers use 1-based indexing, counted from the bottom-left of the grid, left-to-right, bottom-to-top (bottom row: 1–2, next row: 3–5, next: 6–8, top row: 9–11)
- [ ] No unique constraints — trust the client/localStorage to prevent duplicates
- [ ] RLS is enabled with a policy that permits anonymous inserts (no auth required)
- [ ] RLS policy permits anonymous selects (no auth required) for reading aggregate results
- [ ] The Supabase project URL is `https://msjzqyhdfohxrhdovjxq.supabase.co`

### US-010: Show aggregate results with heatmap overlay
**Priority:** 10
**Description:** As a user, after submitting I want to see what connections others drew, so I can compare my thinking with the crowd.

**Acceptance Criteria:**
- [ ] After submitting, a "Show Results" / "Se resultater" button appears
- [ ] Pressing the button fetches aggregate connection counts from Supabase (e.g. `SELECT source_box, target_box, COUNT(*) FROM connections GROUP BY source_box, target_box`)
- [ ] The query returns one row per unique connection with its count — no client-side aggregation needed
- [ ] Aggregate connections are rendered as lines with visual weight (thicker = more people drew it) or with a count label
- [ ] The user's own connections are highlighted in a distinct color so they stand out against the aggregate
- [ ] The user can press the button again to refresh/update the results (results trickle in as more people submit)

### US-011: Visual polish and color theming
**Priority:** 11
**Description:** As a user, I want the app to look clean, modern, and inviting so I feel encouraged to participate.

**Acceptance Criteria:**
- [ ] The app has a cohesive color palette that can be easily changed (colors defined as constants/config)
- [ ] Boxes have a clean, modern look (subtle shadows or borders, readable text)
- [ ] Lines are smooth (bezier curves or similar, not jagged straight lines)
- [ ] The overall aesthetic is minimal and playful — not corporate or cluttered
- [ ] No sound effects
- [ ] The app works in both light and dark environments (theater lighting may be dim)

### US-012: Simple instructional header
**Priority:** 12
**Description:** As a user, I need a brief instruction so I understand what to do without Moll having to explain the UI.

**Acceptance Criteria:**
- [ ] A short instructional text is shown at the top or as an overlay on first load, e.g.: "Tegn linjer mellem begivenhederne. Hvad har ført til hvad?" ("Draw lines between the events. What led to what?")
- [ ] The instruction is in Danish
- [ ] It does not obstruct the grid — either a small persistent header or a dismissible overlay
- [ ] The instruction is concise (one sentence)

## Functional Requirements

- FR-1: The app renders a PIXI.js (or similar) canvas that fills the viewport on mobile devices
- FR-2: 11 boxes are displayed in a 3-3-3-2 grid layout. The top three rows have 3 boxes each; the bottom row has 2 boxes centered
- FR-3: Box labels are defined in a single configuration object, making them trivial to change
- FR-4: Users can draw connections by dragging from one box to another (primary interaction)
- FR-5: Users can draw connections by tapping two boxes in sequence (fallback interaction)
- FR-6: While dragging, a preview line follows the finger from the source box to the touch position
- FR-7: Committed lines are rendered as smooth curves (bezier or routed paths) that avoid crossing through other boxes where feasible
- FR-8: Drawing the same connection twice toggles it off (removes it)
- FR-9: A "Nulstil" (Reset) button clears all connections
- FR-10: A "Send" (Submit) button inserts each connection as a separate row in the Supabase `connections` table with `session_id`, `source_box` (smallint), and `target_box` (smallint)
- FR-11: Each user gets a unique session ID (generated client-side, e.g. `crypto.randomUUID()`) stored in localStorage
- FR-12: After submission, the session ID and submitted state are persisted to localStorage. The user cannot resubmit
- FR-13: On reload, if a submission exists in localStorage, the app restores the submitted state
- FR-14: After submission, a "Se resultater" (Show Results) button appears
- FR-15: Pressing "Se resultater" fetches aggregate connection counts from Supabase (`GROUP BY source_box, target_box`) and renders a heatmap (line thickness proportional to count)
- FR-16: The user's own connections are highlighted in a distinct color on top of the aggregate
- FR-17: The user can press "Se resultater" multiple times to refresh the data
- FR-18: The color palette is defined in a single config/constants file for easy theming

## Non-Goals

- No user authentication or login — fully anonymous
- No admin panel or "results ready" toggle — results are available immediately after submission
- No real-time/WebSocket updates — users manually refresh results
- No sound effects
- No enforced direction rules — users are free to connect any box to any other
- No analytics dashboard or export — Moll will read results directly or Jakob queries Supabase
- No accessibility compliance beyond basic usability (short-lived event app)
- No internationalization — Danish only
- No offline support beyond localStorage persistence of own submission

## Design Considerations

- **Mobile-first:** The primary viewport is a phone screen (375px–430px width). Desktop is secondary but should still work
- **Layout:** The 3-3-3-2 grid should have the widest rows at top and the 2-box row at the bottom, subtly suggesting "start from the bottom" without enforcing it
- **Lines:** Smooth bezier curves. When a line spans multiple tiers (e.g., bottom to top), it should route around intermediate boxes rather than cutting straight through them. This is a key reason for using a canvas library
- **Colors:** Easily changeable. Define a theme object with: background color, box fill, box border, box text, line color, highlight color (for own lines in results), heatmap gradient
- **Feel:** "Legesynd" — the app should make you want to play with it. Subtle animations on connection (e.g., the line draws itself in) would enhance this
- **Typography:** Clean sans-serif. Box labels must be readable at small sizes

## Technical Considerations

- **Rendering:** PIXI.js (or a similar canvas/WebGL library) for performant, smooth rendering of boxes, lines, and interactions. This enables proper line routing around boxes and 60fps touch interaction
- **Storage:** Supabase (`https://msjzqyhdfohxrhdovjxq.supabase.co`) with anonymous access. RLS policies permit anonymous inserts and selects. The project is short-lived and will be decommissioned the day after the event
- **Data model:** Normalized — one row per connection in a `connections` table. Columns: `id` (uuid), `session_id` (text), `source_box` (smallint), `target_box` (smallint), `created_at` (timestamptz). No constraints beyond NOT NULL. Aggregation is a simple `GROUP BY source_box, target_box` with `COUNT(*)`
- **Box numbering:** 1-based integers, counted from the bottom-left, left-to-right, bottom-to-top:
  ```
  Row 4 (top):     9    10    11
  Row 3:           6     7     8
  Row 2:           3     4     5
  Row 1 (bottom):  1     2
  ```
- **Concurrency:** Up to ~500 concurrent users. Supabase free/pro tier handles this comfortably for simple inserts and selects
- **Line routing:** When drawing a line from box A to box B, if the straight path intersects other boxes, the line should curve or route around them. A simple approach: use a quadratic/cubic bezier with control points offset to avoid known box positions
- **Hosting:** Static site — can be hosted anywhere (Vercel, Netlify, a simple server). Accessed via redirect from `zetland.dk/linjer`
- **No build step preferred** but acceptable if PIXI.js integration benefits from one. A simple Vite setup would be the lightest option

## Available Tooling

- **Supabase MCP server:** A Supabase MCP tool is available in the development environment. Use it to create tables, apply migrations, execute SQL, set up RLS policies, deploy edge functions, check logs, and run security/performance advisors — all without needing the Supabase dashboard. The `connections` table, RLS policies, and any other database setup should be done through this tool.

## Success Metrics

- At least 300 of ~500 potential submissions are received during the event (60%+ participation)
- Users can draw their first connection within 5 seconds of the page loading (intuitive UX)
- The app handles 500 concurrent result fetches without noticeable delay
- Moll can read aggregate results from his own phone/iPad during the talk
- Zero crashes or blank screens during the live event

## Open Questions

- **Box labels:** Moll will provide final labels. Placeholder labels from the ChatGPT brainstorm will be used during development. Tentative set (11 boxes):
  - Tier 1 (bottom, 2 boxes): Globalisering, Teknologisk acceleration
  - Tier 2 (3 boxes): Murens fald, Finanskrisen, Sociale mediers gennembrud
  - Tier 3 (3 boxes): Migrationskrisen, Trumps valgsejr 2016, Brexit
  - Tier 4 (top, 3 boxes): Krigen i Ukraine, Global polarisering, AI-revolutionen
  - Note: Taleb's "Tilfældighed / Black Swan" joker box was discussed but not confirmed
- **Line routing complexity:** How sophisticated should the box-avoidance algorithm be? Simple bezier offsets vs. proper pathfinding? Start simple, iterate if needed.
- **Result visualization details:** Should line counts/numbers be displayed on the heatmap, or is thickness alone sufficient?
- **Hosting domain:** Will `zetland.dk/linjer` redirect to the actual host, or will a subdomain like `linjer.zetland.dk` be set up?
