# Roadmap and Conventions

## Implemented

- Auth (Supabase), onboarding, main app stack with bottom nav (Home, Review, Challenge, Profile) + green FAB for Capture.
- Capture → SwingRecording → SwingPhaseReview → processCapture (keyframes, pose, upload) → swing-analysis edge → build_curriculum_queue → Analysis screen.
- Daily plan: getDailyPlan reads user_curriculum_queue; Home shows active lesson + drills (and Quick Drills from diagnosed errors).
- Lessons: DailyLessonScreen with mechanics, practice drill cards; checkpoint drills open DrillCoach; progress gates “Mark Complete.”
- Drills: DrillDetailsScreen (DB-driven); verification_type !== 'none' → DrillCoachScreen; else manual rep + “Mark Complete.”
- Drill Coach: live camera, pose polling (~2–3 FPS), rep/hold/timer verification, drill_coach_session, submitReview on Finish.
- Review: Smart Review tab, getSmartReviewPlan, submitReviewResult (upsert_review_completion, XP, SM-2).
- Profile: Swing DNA chart (6 dimensions, color bands), XP, achievements, sessions.
- Challenges: Weekly leaderboard, tiers.
- Backend: issue_scores / mechanic_scores use only DB slugs; recommended_lesson_ids / recommended_drill_ids validated; build_curriculum_queue uses issue_scores + lesson.primary_error_id; daily-plan builds drills from drill_error.

---

## Conventions for edits

- **Navigation:** Use AppStackParamList and the route names from 02-screens-and-navigation.md; use `navigate` for tabs/detail, `push` for Capture so back works.
- **Data:** Prefer TanStack Query hooks from useQueries for tab screens (cache-first); useDrill, useSwingTaxonomy, useSwingCapture where appropriate.
- **Edge:** All edge calls via `edgeFunctions` in `@/api/edge.ts`; handle EdgeFunctionError and surface message to user.
- **DB:** Match supabaseTypes and actual schema; RPCs (e.g. upsert_review_completion, build_curriculum_queue) must exist in Supabase and match the signatures the app/edge use.
- **Components:** Use existing components from `@/components`; icons from phosphor-react-native (e.g. GolfIcon, TimerIcon) where specified; design tokens from `@/styles/tokens`.
- **Drill verification:** verification_type in DB: 'none' | 'reps' | 'hold' | 'timer'. Only 'reps' needs full verification_config.fsm + signals; 'timer' needs verification_config.timer.min_duration_ms. Default new drills to 'timer' if you want live camera for all.

---

## Possible future work

- **Rep-mode configs per drill:** Author verification_config (signals + fsm) for key drills so rep counting works instead of timer-only.
- **Camera alignment / tracking health:** Require “full body in frame” and pause verification when tracking is lost for > N seconds.
- **Skeleton overlay:** Lightweight green/red overlay on DrillCoach camera (e.g. Skia).
- **Native live-stream pose:** PoseExtractorModule with runningMode .liveStream for higher FPS (requires camera frame bridge).
- **Lesson checkpoints persisted:** Store which lesson steps are completed (e.g. in user_lesson_progress or a step_completion table) so progress survives navigation.
- **Offline / retry:** Better handling of network failures during processCapture or submitReview.
