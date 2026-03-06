# Swing.ai Mobile — App Overview

## What the app does

Swing.ai is a **golf swing analysis and practice** mobile app (React Native / Expo). It:

1. **Records and analyzes swings** — User records a video of their swing; the app extracts keyframes, runs on-device MediaPipe pose detection, uploads artifacts, and an edge function runs LLM-based analysis to produce issue/mechanic scores and recommendations.
2. **Builds a personalized curriculum** — From that analysis, the backend builds a daily plan: an active lesson and quick drills tied to diagnosed swing errors (via `swing_error`, `lesson.primary_error_id`, `drill_error`).
3. **Guides practice** — Users work through “Today’s Practice” (lesson + drills) and can do “Quick Drills” for targeted practice. Lessons and drills can use **live verification** (DrillCoachScreen: camera + on-device pose) or trust-based “Mark Complete.”
4. **Tracks progress** — Completions go through `submit-review-result` (review_completion, XP, smart review scheduling). Profile shows Swing DNA (tempo, power, speed, balance, rotation, plane), XP, achievements, and session history.
5. **Smart Review** — Spaced repetition for drills/lessons/cues. Review tab shows due items; completing them reschedules via SM-2–style logic.

## Tech stack

- **Runtime:** React Native 0.81, Expo SDK 54, React 19
- **Navigation:** React Navigation 7 (native stack); bottom tabs for Home, Review, Challenge, Profile; green FAB for Capture
- **Data:** Supabase (Postgres, Auth, Storage, Edge Functions); TanStack Query for caching
- **Pose:** MediaPipe Tasks Vision on iOS via custom Expo module (`pose-extractor`), still-image mode only (no live stream in MVP)
- **UI:** Custom components; Phosphor icons; design tokens in `@/styles/tokens` (colors, spacing, typography)

## High-level features

| Feature | Description |
|--------|-------------|
| **Capture → Analysis** | Record swing video → tag phases or auto keyframes → pose on keyframes → upload → `swing-analysis` edge → `swing_analysis` + `build_curriculum_queue` |
| **Daily plan** | `getDailyPlan` edge reads `user_curriculum_queue`; returns active lesson + drills (from curriculum + drill_error). Home shows “Today’s Practice” and “Quick Drills.” |
| **Lessons** | DailyLessonScreen: video, mechanics, practice drill card. Checkpoint drills (with verification_type) open DrillCoachScreen; completion gates “Mark Complete.” |
| **Drills** | DrillDetailsScreen shows drill from DB; if `verification_type !== 'none'` → “Start Drill” → DrillCoachScreen (camera, rep/hold/timer verification). Else manual rep counter + “Mark Complete.” |
| **Drill Coach** | Full-screen camera, on-device pose polling (~2–3 FPS), rep FSM or hold/timer verification, telemetry to `drill_coach_session`, then submitReview. |
| **Review** | Smart Review tab: due items from getSmartReviewPlan. Completing calls submit-review-result (upsert_review_completion, award_xp, update user_review_item). |
| **Profile** | Swing DNA chart (6 dimensions, color bands), XP, achievements, sessions; auth (sign out). |
| **Challenges** | Leaderboard (weekly_xp_leaderboard), tier/rank. |

## Important conventions

- **Auth:** `useAuth()` from `@/lib/AuthContext`; edge calls use user JWT.
- **Supabase types:** `@/lib/supabaseTypes` mirrors DB (Tables, Views). Regenerate or keep in sync when schema changes.
- **Aliases:** `@/` = `apps/mobile/src/` (babel-plugin-module-resolver).
- **Edge functions:** Invoked via `edgeFunctions` in `@/api/edge.ts` (auth, retry, error shape). Function names: `swing-analysis`, `daily-plan`, `submit-review-result`, `get-smart-review-plan`, etc.
