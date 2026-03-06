# Swing.ai Mobile — Context Primer (paste this first)

**App:** Golf swing analysis + personalized practice (React Native / Expo, Supabase).

**Key flows:**
- **Capture:** FAB → Capture → SwingRecording → SwingPhaseReview → processCapture (pose on keyframes, upload) → swing-analysis edge → build_curriculum_queue → Analysis. Then “Start first lesson” or “Next Swing.”
- **Daily plan:** getDailyPlan reads user_curriculum_queue; Home shows active_lesson + drills (from curriculum + drill_error). Lesson/drill taps → DailyLesson or DrillDetails.
- **Drills:** If drill.verification_type !== 'none' → “Start Drill” → DrillCoachScreen (camera, pose verification, Finish → drill_coach_session + submitReview). Else manual reps + “Mark Complete.”
- **Lessons:** DailyLessonScreen; steps with verification drills are checkpoints (→ DrillCoach); progress gates “Mark Complete.” submitReview for lesson/drill uses submit-review-result edge (upsert_review_completion, XP).

**Paths:** Code `apps/mobile/src/`; screens in `screens/`, components in `components/`, hooks in `hooks/`, API in `api/`, features in `features/swingCapture/` and `features/drillCoach/`. Supabase: `supabase/functions/`, `database-records/database_design.sql`, `supabase/migrations/`.

**Navigation:** AppStackParamList in `navigation/AppStack.tsx`. Bottom tabs: Home, Review, Challenge, Profile. Capture = push from FAB. DrillCoach params: drillId, fromSmartReview?, reviewItem?.

**Data:** TanStack Query (useDailyPlanQuery, useSmartReviewPlanQuery, etc.) in useQueries.ts; useDrill(drillId); useSwingTaxonomy(); useSwingCapture(); useSubmitReviewResult(). Edge: edgeFunctions in api/edge.ts (analyzeSwing, getDailyPlan, getSmartReviewPlan, submitReviewResult).

**DB:** issue_scores / mechanic_scores use only swing_error / swing_mechanic slugs. build_curriculum_queue uses issue_scores + lesson.primary_error_id. review_completion via upsert_review_completion(p_user_id, p_item_type, p_item_id, p_issue_slug, p_score, p_duration_min, p_client_event_id, p_completion_fingerprint).

For full detail, see other files in this folder: 01-app-overview, 02-screens-and-navigation, 03-components, 04-hooks-api-features, 05-workflows, 06-roadmap.
