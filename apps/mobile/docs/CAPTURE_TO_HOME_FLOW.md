# Flow: Swing Capture → Diagnosis → Curriculum → Home

This doc verifies the chain from recording a video to seeing a lesson and drills on the Home screen.

## 1. Record & upload

- **SwingRecordingScreen** → user records video → navigates to **SwingPhaseReviewScreen** with `videoUri`, `club`.
- User tags 8 phases and taps **Analyze** → **useSwingCapture.processCapture()** runs.
- **CaptureCoordinator.processSwingCapture()**:
  - Inserts `swing_capture`, uploads frames, inserts `swing_frame` rows.
  - Calls **edgeFunctions.analyzeSwing(captureId)** and **awaits** it (analysis runs to completion).
  - On success: **queryClient.invalidateQueries({ queryKey: ['dailyPlan'] })**.
  - Returns `captureId`.

So by the time the user leaves the phase review screen, analysis has finished and the daily plan cache is invalidated.

## 2. Swing-analysis edge function (runs during analyzeSwing)

1. Loads **swing_error** and **swing_mechanic** slugs from DB; builds prompt so the model uses **only** those slugs.
2. Runs AI; parses `issue_scores`, `mechanic_scores`; filters to allowed slugs only.
3. Validates **recommended_lesson_ids** / **recommended_drill_ids** against lessons (by `primary_error_id`) and drills (by **drill_error**); drops invalid IDs.
4. Inserts **swing_analysis** (with `issue_scores` keys = `swing_error.slug`).
5. Calls **apply_swing_issue_update** (user_issue_state).
6. Updates **swing_capture** status to `analyzed`.
7. Calls **build_curriculum_queue(capture_id)**.
8. Calls **apply_swing_dna_update** (profile DNA).

So after a successful analysis, the curriculum queue and profile DNA are updated.

## 3. build_curriculum_queue (DB function)

- Reads **issue_scores** from **swing_analysis** for this `capture_id`.
- For each **issue_slug** in that JSONB:
  - Finds **swing_error** with that `slug` and **lesson** with `primary_error_id = swing_error.id`.
  - Inserts/updates **user_curriculum_queue** (user_id, lesson_id, issue_slug, queue_rank, status).
- Sets one lesson to **status = 'active'** (first queued if none active).
- Ensures **user_lesson_progress** for the active lesson.

**Important:** A queue row is only created when there is a **lesson** whose **primary_error_id** matches that issue. If no lesson targets that slug, that slug does not add a row.

## 4. Navigate to Analysis

- **SwingPhaseReviewScreen** `useEffect`: when `state === 'success'` and `captureId` is set, **navigation.replace('Analysis', { captureId })**.
- User lands on **AnalysisScreen**; curriculum is already built.
- **AnalysisScreen** mounts with `captureId` → **invalidates** and **refetches** `['dailyPlan']`, so the client has the latest plan (including `active_lesson`).
- Bottom CTA: if **dailyPlan.active_lesson** exists → “Start your first lesson” → **DailyLesson**; else “Next Swing” → **Capture**.

## 5. Daily-plan edge function (getDailyPlan)

- Called by **useDailyPlanQuery** (e.g. Home, Analysis after refetch).
- Selects from **user_curriculum_queue** where `user_id` and **status = 'active'**; takes first row → **active_lesson** (lesson id, title, summary, issue_slug).
- **Quick Drills:** selects from **user_curriculum_queue** where status in (`active`, `queued`), up to 8 issue_slugs; for each, gets drills via **drill_error** (error_id = swing_error.id for that slug); dedupes and returns up to **max_drills** (5).

So the plan always reflects the current queue and linked drills.

## 6. Home screen

- **useDailyPlanQuery()** → `dailyPlan` with `active_lesson` and `items` (lesson + drills).
- **Today’s Practice:** `dailyLesson` from `dailyPlan.active_lesson`; **Start** → **DailyLesson** with `lessonId`.
- **Quick Drills:** from `dailyPlan.items` where `type === 'drill'`; tap → **DrillDetails** with `drillId`.

When the user opens Home after at least one analyzed swing, the query is either already refetched (e.g. after Analysis) or refetches because it was invalidated, so they see the lesson and drills.

---

## Should it work?

**Yes**, provided:

1. **Analysis runs to completion** (no failure in swing-analysis edge or DB).
2. **At least one diagnosed issue has a lesson**  
   - **issue_scores** keys must match **swing_error.slug** (we enforce this in the edge function).  
   - There must be at least one **lesson** row with **primary_error_id** pointing to that **swing_error** (e.g. sample_data: `fix-the-slice` → `over-the-top`).
3. **Seed data**  
   - **swing_error** and **swing_mechanic** populated (for prompts and slug filtering).  
   - At least one **lesson** with **primary_error_id** set (so the queue gets a row).  
   - **drill_error** rows linking drills to those errors (so Quick Drills has entries).
4. **RLS / auth**  
   - getDailyPlan and swing-analysis use the user’s JWT; **user_curriculum_queue** and related reads must be allowed for that user.

If the queue stays empty, the most likely cause is **no lesson with primary_error_id** for any of the issue_slugs the analysis returns. Check **lesson.primary_error_id** and **swing_error** in the DB and ensure sample_data (or your seed) has been applied.
