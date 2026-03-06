# Screens and Navigation

## Stack and param types

- **Defined in:** `src/navigation/AppStack.tsx`
- **Type:** `AppStackParamList` (use for `useNavigation`, `useRoute`, `RouteProp`)

Bottom tabs (no header, animation: none): **Home**, **Review**, **ChallengeLeaderboard**, **Profile**.  
All other screens use `slide_from_right` (or `slide_from_bottom` for DrillCoach).

Capture is opened via the **green FAB** in BottomNav using `navigation.push('Capture')` so the back button works correctly.

---

## Screen reference

| Screen | Route name | Params | Purpose |
|--------|------------|--------|---------|
| Home | `Home` | — | Today’s Practice (daily plan), Quick Drills, entry to lesson/drill/capture |
| Profile | `Profile` | — | Swing DNA chart, XP, achievements, sessions, settings, sign out |
| Capture | `Capture` | — | Entry: “Quick Capture” → SwingRecording, or “Start Setup” → InitialSwingSetup |
| Analysis | `Analysis` | `{ captureId?: number }` | Post-analysis: score ring, good/focus areas, metrics, coach tip; CTA to first lesson or next swing |
| AnalysisHistory | `AnalysisHistory` | — | List of past swing analyses |
| Review | `Review` | — | Smart Review: due items (drills/lessons/cues), hero card, list |
| ChallengeLeaderboard | `ChallengeLeaderboard` | — | Weekly XP leaderboard, tiers |
| PersonalizedPlan | `PersonalizedPlan` | — | Plan / curriculum view |
| DailyLesson | `DailyLesson` | `lessonId?`, `fromSmartReview?`, `reviewItem?` | Single lesson: video, mechanics, practice drill(s), progress, Mark Complete |
| QuickDrills | `QuickDrills` | — | List of quick drills (from daily plan / diagnosed errors) |
| DrillDetails | `DrillDetails` | `drillId`, `fromSmartReview?`, `reviewItem?` | Drill info, steps, “Start Drill” (→ DrillCoach) or manual “Mark Complete” |
| InitialSwingSetup | `InitialSwingSetup` | — | Club/position setup before first capture |
| SwingRecording | `SwingRecording` | `club?` | Record swing video (expo-camera), then → SwingPhaseReview |
| SwingPhaseReview | `SwingPhaseReview` | `videoUri`, `club?` | Tag 8 phases, then “Analyze” → processCapture → Analysis |
| SwingDiagnosticView | `SwingDiagnosticView` | `diagnosticId?` | View a past diagnostic/analysis |
| **DrillCoach** | `DrillCoach` | `drillId`, `fromSmartReview?`, `reviewItem?` | Live camera, pose verification (reps/hold/timer), Finish → submitReview + drill_coach_session |

---

## Common navigation patterns

- **Home → lesson:** `navigation.navigate('DailyLesson', { lessonId })`
- **Home → drill:** `navigation.navigate('DrillDetails', { drillId })`
- **Home → capture:** Green FAB → `navigation.push('Capture')` (back button goes to previous tab)
- **DrillDetails → DrillCoach:** `navigation.navigate('DrillCoach', { drillId, fromSmartReview, reviewItem })`
- **DailyLesson → DrillCoach (checkpoint):** `navigation.navigate('DrillCoach', { drillId })`; on return, step marked complete
- **Analysis → first lesson:** `navigation.navigate('DailyLesson', { lessonId: active_lesson.id })`
- **Submit completion (drill/lesson):** `submitReview(...)` then `navigation.goBack()` or `navigate('Home')` / `navigate('Review')`

---

## Screen files (path)

All under `src/screens/`:

- `HomeScreen.tsx`, `ProfileScreen.tsx`, `CaptureScreen.tsx`, `AnalysisScreen.tsx`, `AnalysisHistoryScreen.tsx`
- `ReviewScreen.tsx`, `ChallengeLeaderboardScreen.tsx`, `PersonalizedPlanScreen.tsx`
- `DailyLessonScreen.tsx`, `QuickDrillsScreen.tsx`, `DrillDetailsScreen.tsx`, `DrillCoachScreen.tsx`
- `InitialSwingSetupScreen.tsx`, `SwingRecordingScreen.tsx`, `SwingPhaseReviewScreen.tsx`, `SwingDiagnosticViewScreen.tsx`
- `LoginScreen.tsx`, `OnboardingScreen.tsx` (auth/onboarding flows)
