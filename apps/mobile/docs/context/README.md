# Context for AI Coding Tools (Codex, Claude Code, etc.)

This folder contains structured documentation so AI assistants can make accurate, consistent edits to the Swing.ai mobile app without re-learning the codebase each time.

## How to use

When starting a new session with Codex, Claude Code, or similar tools:

1. **Paste or reference** the relevant files before asking for edits:
   - `00-primer.md` — **Start here:** one-page summary (flows, paths, navigation, data, DB) for quick context
   - `01-app-overview.md` — What the app is, tech stack, and main features
   - `02-screens-and-navigation.md` — Every screen, route params, and purpose
   - `03-components.md` — Reusable UI components and their props
   - `04-hooks-api-features.md` — Data hooks, API layer, and feature modules
   - `05-workflows.md` — User and data flows (capture, analysis, daily plan, drills/lessons)
   - `06-roadmap.md` — What’s implemented vs planned

2. **Be specific** about which area you’re editing (e.g. “DrillDetailsScreen”, “submit-review-result”, “drill coach”).

3. **Cross-reference** `database-records/database_design.sql` and `supabase/migrations/` for schema and RPCs when changing backend contracts.

## File index

| File | Use when editing |
|------|-------------------|
| `00-primer.md` | Quick context for a new session (paste first) |
| `01-app-overview.md` | New features, architecture, or “what does this app do?” |
| `02-screens-and-navigation.md` | Any screen, navigation, or new route |
| `03-components.md` | UI components, styling, or shared elements |
| `04-hooks-api-features.md` | Data fetching, edge functions, Supabase, swing capture, drill coach |
| `05-workflows.md` | Capture→analysis, daily plan, curriculum, drill/lesson completion |
| `06-roadmap.md` | Prioritization, known gaps, future work |

## Paths

- App code: `apps/mobile/src/`
- Supabase edge functions: `supabase/functions/`
- DB schema / design: `database-records/database_design.sql`
- Migrations: `supabase/migrations/`
- Existing flow docs: `apps/mobile/docs/` (e.g. `DAILY_PLAN_TRIGGER.md`, `CAPTURE_TO_HOME_FLOW.md`)
