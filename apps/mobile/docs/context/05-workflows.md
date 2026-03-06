# Workflows

## 1. Capture → Analysis → Curriculum

1. User taps green FAB → **Capture** (push).
2. **CaptureScreen:** Quick Capture → **SwingRecording** (club optional).
3. **SwingRecordingScreen:** Record video (expo-camera) → **SwingPhaseReview** with videoUri, club.
4. **SwingPhaseReviewScreen:** User tags 8 phases (or uses auto) → “Analyze” → `processCapture(videoUri, durationMs, { club, manualPhaseMarks })`.
5. **useSwingCapture / CaptureCoordinator:** Extract keyframes → pose on each (MediaPipe) → build PoseSummaryV1 → insert swing_capture, upload frames, insert swing_frame → call **analyzeSwing(captureId)**.
6. **swing-analysis edge:** Load capture + frames, call OpenAI vision with pose_summary, persist issue_scores / mechanic_scores (slugs from swing_error / swing_mechanic only), validate recommended_lesson_ids / recommended_drill_ids → insert swing_analysis → call **build_curriculum_queue(capture_id)** → apply_swing_issue_update, apply_swing_dna_update.
7. **build_curriculum_queue (DB):** Read issue_scores from swing_analysis; for each slug find swing_error and lessons with primary_error_id = that error; insert user_curriculum_queue, set one lesson active; insert user_lesson_progress if needed.
8. App navigates to **Analysis** with captureId; **useSwingAnalysisData** polls until status analyzed, then shows results. CTA: “Start your first lesson” → DailyLesson(lessonId) or “Next Swing” → Capture.

Ref: `docs/DAILY_PLAN_TRIGGER.md`, `docs/CAPTURE_TO_HOME_FLOW.md`.

---

## 2. Daily plan (Home)

1. **useDailyPlanQuery()** or **useDailyPlan()** calls **getDailyPlan** edge (no DB writes).
2. Edge reads **user_curriculum_queue** (active lesson + queued items), returns active_lesson + items (lesson, drills from curriculum + drill_error for diagnosed issues, cues).
3. Home shows “Today’s Practice” (active lesson card, drill cards) and “Quick Drills” (drills tied to diagnosed errors).
4. Tapping lesson → **DailyLesson**; tapping drill → **DrillDetails**.

---

## 3. Drill flow

- **DrillDetailsScreen:** Loads drill via **useDrill(drillId)**. If **verification_type !== 'none'**: single “Start Drill” → **DrillCoach**. Else: manual rep counter + “Mark Complete”.
- **DrillCoachScreen:** Camera, **useDrillCoach** (pose polling + FSM or hold or timer). User does reps/hold/time → “Finish” enabled when goal met → **saveSession()** (insert drill_coach_session) → **submitReview({ item_type: 'drill', item_id, score, duration_min, source })** → alert → goBack.
- **submit-review-result edge:** upsert_review_completion (8 params including p_completion_fingerprint), award_xp, update user_review_item if source = review.

---

## 4. Lesson flow

- **DailyLessonScreen:** Lesson + steps from **useSwingTaxonomy**; steps with drill_id and verification_type set are “checkpoints.” Progress = completed checkpoints / total; “Mark Complete” enabled when all checkpoints done (or none).
- Checkpoint drill: “START DRILL” → **DrillCoach**; on return, step marked complete (completedDrillIds). Non-checkpoint drill: “VIEW STEPS” → **DrillDetails**.
- “Mark Complete” → **submitReview({ item_type: 'lesson', item_id, score, duration_min, source })** → same edge as above → navigate Home or Review.

---

## 5. Smart Review (Review tab)

- **useSmartReviewPlanQuery()** → **getSmartReviewPlan** edge → returns items due (user_review_item.due_at).
- Tapping item → **DrillDetails** or **DailyLesson** with fromSmartReview + reviewItem.
- Completion → **submitReviewResult** with source: 'review' → edge updates schedule (SM-2), awards XP, returns next_schedule.

---

## 6. Swing DNA (Profile)

- **swing_dna_observation** table stores per-user history; **apply_swing_dna_update** (or similar) called from swing-analysis edge with raw DNA from mechanic_scores + pose_summary.
- Profile reads latest or aggregated DNA; chart shows 6 dimensions (tempo, power, speed, balance, rotation, plane), color bands (<30 red, <55 orange, <75 yellow, <90 light green, ≥90 dark green). Overall score = average of the six.

---

## 7. Back button (Capture)

- Capture is opened with **push** from BottomNav FAB so the stack has a previous screen. Capture’s **headerLeft** calls **navigation.goBack()** so the back button returns to the prior tab/screen.
