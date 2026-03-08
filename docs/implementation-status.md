# AiTool Implementation Status

Last updated: 2026-03-08

## Current Direction

AiTool is being refocused from a broad AI tool catalog into an AI-native workspace for creation, learning, and developer execution.

## Current Progress

### Done
- Added a visible system-planning section to the homepage.
- Added `/roadmap` as a dedicated page for roadmap visibility and iteration status.
- Centralized roadmap state in `src/lib/sitePlan.ts` so the homepage and roadmap stay aligned.
- Added `/workspace` as the first daily-entry page with Today, Quick Capture, Recents, Pinned Shortcuts, and a Japanese Today placeholder.
- Added a direct Workspace entry to the top navigation.
- Added `/workspace/home-builder` so users can choose life, learning, work, or hybrid homepage templates.
- Added `POST /api/homepage/generate` to turn template answers into a generated homepage plan and React code.
- Added per-user local application of generated home configs so Workspace can switch into a personalized homepage immediately.
- Redirected successful sign-in to `/workspace` by default while preserving explicit `next` routes.
- Added `/requirements` as a first internal requirements board with seeded status columns, sample items, and entry points from navigation and Workspace.
- Added `/requirements/content` as the first requirements document space by reusing the existing directory/content architecture.
- Added `requirements_content` database migration so requirement docs can persist through the shared content APIs.
- Added first-use bootstrap for `/requirements/content` so default status directories and starter templates are created automatically.
- Replaced the static `/requirements` seed board with a real board driven by requirements directories and documents.
- Extracted lightweight metadata (`type`, `priority`, `related route`) from requirement document bodies and surfaced it on the real requirements board.
- Extracted richer preview fields like `scene` and `expected value` from requirement documents to make the real board more decision-friendly.
- Extracted validation-facing preview fields like `validation result` and `user impact` from requirement documents to make Doing / Validating cards easier to judge at a glance.
- Extracted execution-facing preview fields like `open risks` and `next step` from requirement documents so active cards now show remaining uncertainty and immediate follow-up.
- Made `/requirements` card density status-aware so each lifecycle column now emphasizes a smaller, more relevant preview subset, with the editor showing the same focus rule.
- Added a lightweight lifecycle move action inside `/requirements/content`, so a requirement can shift to another status directory without manual directory switching.
- Added a board-level quick move action on `/requirements` cards, so items can advance to the next lifecycle state without opening the document first.
- Extended `/requirements` card moves so each card can now jump to any available lifecycle state, while still defaulting to the next recommended state.
- Added lightweight handoff context capture to `/requirements/content` moves, so state changes now write move reason and validation follow-up back into the document body.
- Reused the same lightweight handoff capture on `/requirements` board cards, so quick moves now also write move reason and validation follow-up into the document body.
- Surfaced the latest `Handoff Log` excerpt on `/requirements` cards, so Doing / Validating columns can now show the most recent transition context without opening the document.
- Parsed the latest handoff into structured `time / direction / validate next` preview signals, so Doing / Validating cards no longer rely only on a raw handoff excerpt.
- Rendered those structured handoff signals as a compact rail on `/requirements` cards, so Doing / Validating no longer spend several full preview blocks on handoff metadata.
- Kept the next-stage focus on Workspace and Requirements instead of adding more standalone modules.

### In Progress
- Turning the learning area into a repeatable daily flow instead of a standalone notes page.
- Tightening the personalized homepage flow so it can later persist beyond the current browser.
- Defining the requirement lifecycle fields and transitions for Inbox / Shaping / Ready / Doing / Validating / Archived.
- Standardizing how requirement documents expose lightweight metadata without introducing a separate requirements data model too early.
- Making handoff freshness visible on the board so validating work that has gone stale is easier to spot.

### Next
- Add a freshness cue derived from handoff time on `/requirements` cards, especially for Validating.
- Continue collapsing old toolbox-style navigation into the workspace/product skeleton.

## Update Rule

After each meaningful implementation step:
1. mark completed work,
2. move one item into in-progress,
3. define the next smallest shippable step.
