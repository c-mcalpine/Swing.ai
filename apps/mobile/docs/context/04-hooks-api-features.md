# Hooks, API, and Feature Modules

## Hooks (`src/hooks/`)

### Data (TanStack Query) — `useQueries.ts`

- **useProfileQuery(userId)** — Profile for current user
- **useDailyPlanQuery()** — Today’s Practice (active lesson + items); calls `getDailyPlan`
- **useSmartReviewPlanQuery()** — Review tab due items; calls `getSmartReviewPlan`
- **useLeaderboardQuery(limit)** — Weekly XP leaderboard
- **useMyRankQuery(userId)** — Current user’s rank
- **useChallengesQuery(userId)** — Challenges with progress
- **useSessionsQuery(userId, limit)** — Recent sessions
- **useUserAchievementsQuery(userId)** — User achievements
- **useAllAchievementsQuery()** — All achievements
- **usePrefetchAppQueries()** — Prefetch tab data on app mount

### Auth & session

- **useSession()** — Auth state (user, loading); `src/hooks/useSession.ts`
- **useAuth()** — From `@/lib/AuthContext` (userId, signOut, etc.)

### Taxonomy & content

- **useSwingTaxonomy()** — Lessons, drills, mechanics, errors, phases, lesson steps (single fetch); `useTaxonomy.ts`
- **useDrill(drillId)** — Single drill by id (includes verification_type, verification_config); `useDrill.ts`
- **useDailyPlan(options?)** — Wrapper around getDailyPlan with options; `useDailyPlan.ts`
- **useDailyLesson(userId)** — Lesson progress / daily lesson; `useLessonProgress.ts`
- **useQuickDrills()** — Quick drills list; `useDrillAssignment.ts`

### Swing capture & analysis

- **useSwingCapture()** — `processCapture(videoUri, durationMs?, config?)`, state, progress, captureId, reset; `useSwingCapture.ts`. Uses CaptureCoordinator (keyframes → pose → DB → analyzeSwing).
- **useSwingAnalysis()** — Trigger analysis (calls edge); `useSwingAnalysis.ts`
- **useSwingAnalysisData(captureId)** — Poll capture status and load swing_analysis + capture for Analysis screen; `useSwingAnalysisData.ts`

### Review & completion

- **useSmartReviewPlan(...)** — Fetch review plan; `useSmartReview.ts`
- **useSubmitReviewResult()** — `submit({ item_type, item_id, score, issue_slug?, duration_min?, source? })`; calls submit-review-result edge; `useSmartReview.ts`
- **useSmartReview()** — Combined plan + submit usage; `useSmartReview.ts`

### Profile & social

- **useUserProfile(userId)** — Profile; `useProfile.ts`
- **useStreak(userId)** — Streak; `useProfile.ts`
- **useWeeklyLeaderboard(limit)** — Leaderboard; `useLeaderboard.ts`
- **useMyWeeklyRank(userId)** — My rank; `useLeaderboard.ts`
- **useTierLeaderboard(limit)** — Tier leaderboard; `useTierLeaderboard.ts`
- **useChallengesWithProgress(...)** — Challenges; `useChallenges.ts`
- **useRecentSessions(...)** — Sessions; `useSessions.ts`
- **useUserAchievements(userId)** / **useAllAchievements()** — Achievements; `useAchievements.ts`

---

## API layer (`src/api/`)

- **edge.ts** — `callEdgeFunction()`, `edgeFunctions`: analyzeSwing, getDailyPlan, getSmartReviewPlan, submitReviewResult. Uses Supabase auth and returns typed responses.
- **profile.ts** — getUserProfile, updateProfile (Supabase profiles table).
- **profilePhoto.ts** — uploadProfilePhoto (storage).
- **swingAnalysis.ts** — Client-side swing analysis API helpers if any.
- **taxonomy.ts** — Taxonomy fetching helpers if any.

---

## Feature modules

### `src/features/swingCapture/`

Swing recording → keyframes → pose → DB → edge analysis.

- **captureCoordinator.ts** — Orchestrates: keyframe extraction, pose detection (PoseExtractor), phase tagging, overlay render, insertCapture, uploadArtifacts, insert frames, call analyzeSwing.
- **pose/PoseExtractor.ts** — NativeIOSPoseExtractor: initialize(), detectPose(imageUri), dispose. Uses `pose-extractor` Expo module (MediaPipe, image mode).
- **pose/poseAnalysis.ts** — calculatePoseMetrics(keyframes), tagSwingPhases(keyframes), POSE_LANDMARKS (MediaPipe indices).
- **types/pose.ts** — PoseLandmark, KeyframeData, SwingPhase, PoseMetrics, PoseSummaryV1, etc.
- **keyframes/extractKeyframes.ts** — extractKeyframes(videoUri, timestamps), generateSwingOptimizedTimestamps.
- **keyframes/swingWindow.ts** — detectSwingWindow, selectBestFrameMarks.
- **database/insertCapture.ts** — Insert swing_capture + swing_frame rows.
- **upload/uploadArtifacts.ts** — Upload frames/overlays to storage.
- **overlay/renderOverlay.ts** — Render pose overlay on keyframe image.

### `src/features/drillCoach/`

On-device live verification for drills/lessons (camera + pose, no LLM).

- **signals.ts** — extractSignals(landmarks, definitions), signalsInBands(), computeSignalQuality(), landmarkConfidence(). Uses verification_config.signals (angle, distance, y_position, x_position).
- **repCounterFSM.ts** — RepCounterFSM: states idle→ready→rep_active→rep_done; tick(signals, confidence) returns snapshot (repsAttempted, repsValid, avgQuality).
- **holdVerifier.ts** — HoldVerifier: tick(signals, confidence, nowMs); holdMs, isComplete, quality.
- **usePosePolling.ts** — Poll camera with takePictureAsync → detectPoseFromImage; returns landmarks, confidence, fps. Interval ~400 ms.
- **useDrillCoach.ts** — Combines usePosePolling + FSM or HoldVerifier from drill.verification_type; state (reps, holdMs, trackingHealth, isComplete, etc.), saveSession() (insert drill_coach_session), used by DrillCoachScreen.

---

## Supabase

- **Client:** `src/lib/supabase.ts`
- **Types:** `src/lib/supabaseTypes.ts` (Database type: public.Tables, Views). Keep in sync with DB.
- **Storage paths:** `src/lib/supabase/storagePaths.ts`

Key tables: profiles, swing_capture, swing_frame, swing_analysis, user_curriculum_queue, review_completion, user_review_item, drill, lesson, lesson_step, drill_error, swing_error, swing_mechanic, drill_coach_session, swing_dna_observation, etc.
