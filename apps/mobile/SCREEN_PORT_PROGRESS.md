# Screen Porting Progress

## Phase 7A: Read-Only Screens (Priority 1)

### ✅ COMPLETED
- [x] **BottomNav Component** - React Native version with proper navigation
- [x] **SwingAnalysisScreen (REAL DATA)** - Uses capture_id param, loads from DB, displays:
  - issue_scores with severity bars
  - mechanic_scores with performance indicators
  - overall_confidence score
  - coach notes from raw_json
  - recommended drills
  - NO HARDCODED DATA - everything from database

### 🔄 IN PROGRESS / NEXT STEPS

1. **AnalysisHistoryScreen** (Read-Only)
   - List user's past swing analyses
   - Use `getUserSwingAnalyses()` API function
   - Navigate to AnalysisScreen with capture_id
   - Sort by date, show thumbnails

## Phase 7B: Onboarding & Core Screens

### TODO: Onboarding Persistence
- [X] Update OnboardingScreen for RN
- [X] Create profile write API (`createProfile`, `updateOnboardingData`)
- [X] Store: handedness, handicap, goals
- [X] Set `onboarding_completed_at` timestamp
- [X] Gate AppStack: redirect to Onboarding if `onboarding_completed_at` is null

### TODO: Main Screens (Priority 2)
- [X] **HomeScreen** - Dashboard with XP, streak, daily lesson, quick drills
- [X] **ProfileScreen** - User profile, stats, achievements, radar chart
- [X] **SmartReviewScreen** - Spaced repetition plan, up next, timeline
- [X] **ChallengeLeaderboardScreen** - Leaderboards, events, podium

### TODO: Supporting Screens (Priority 3)
- [X] PersonalizedPlanScreen
- [X] DailyLessonScreen
- [X] QuickDrillsScreen
- [X] DrillDetailsScreen
- [X] InitialSwingSetupScreen
- [X] SwingDiagnosticScreen
- [X] SwingRecordingScreen (Phase 8+: Camera)

## Phase 7C: Supporting Components

### TODO: Reusable Components
- [X] **Button** - Primary/secondary variants, sizes, icons
- [X] **Card** - HeroCard, HorizontalCard variants
- [X] **ProgressIndicator** - Step indicators for onboarding
- [X] **Material Icons** - React Native icon solution

## Key Principles for Porting

### 1. Data Flow (CRITICAL)
```typescript
// ❌ OLD (Web - hardcoded)
const analysisData = {
  score: 88,
  rating: 'Excellent',
  // ... hardcoded values
}

// ✅ NEW (Mobile - real data)
const { data, loading, error } = useSwingAnalysisData(captureId);
// Then render data.analysis.issue_scores, data.analysis.confidence, etc.
```

### 2. UI Translation
```typescript
// Web (React)
<div className="card">
  <button onClick={handleClick}>Click</button>
</div>

// Mobile (React Native)
<View style={styles.card}>
  <TouchableOpacity onPress={handleClick}>
    <Text>Click</Text>
  </TouchableOpacity>
</View>
```

### 3. Navigation
```typescript
// Web
navigate('/analysis')

// Mobile
navigation.navigate('Analysis', { captureId: 123 })
```

### 4. Styling
```typescript
// Web - CSS files
import '../styles/screens/HomeScreen.css'

// Mobile - StyleSheet.create()
import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }
});
```

## API Hooks Created

### Swing Analysis
- [x] `useSwingAnalysisData(captureId)` - Fetch single analysis
- [x] `getSwingAnalysisByCaptureId()` - API function
- [x] `getUserSwingAnalyses()` - API function for history

### Profile (from Phase 6)
- [x] `getCurrentUserProfile()` - Get current user's profile
- [x] `updateProfile()` - Update profile

### Edge Functions (from Phase 6)
- [x] `useSwingAnalysis()` - Request AI analysis
- [x] `useSmartReview()` - Get practice plan, submit results

## TODO: Create Additional API Functions

### Profile Operations
```typescript
// Need to create:
export async function createProfile(data: {
  username: string;
  handedness: 'left' | 'right';
  handicap: number;
  goals?: string[];
}) { /* ... */ }

export async function completeOnboarding() {
  // Set onboarding_completed_at = NOW()
}
```

### Leaderboard & Challenges
```typescript
// Port from web app hooks:
- useWeeklyLeaderboard()
- useMyWeeklyRank()
- useChallengesWithProgress()
```

### Lessons & Drills
```typescript
// Port from web app hooks:
- useDailyLesson()
- useQuickDrills()
- useLessonProgress()
- useDrillAssignment()
```

## Screen Complexity Ratings

### Simple (1-2 hours each)
- CaptureScreen (placeholder only - full impl in Phase 8+)
- ReviewScreen (uses useSmartReview hook)

### Medium (3-4 hours each)
- HomeScreen (multiple data sources, gamification UI)
- ProfileScreen (radar chart, achievements, sessions)
- AnalysisHistoryScreen (list view with navigation)

### Complex (5-6 hours each)
- SmartReviewScreen (timeline, cards, real-time plan)
- ChallengeLeaderboardScreen (podium, rankings, segmented control)
- OnboardingScreen (4 sub-screens, profile persistence, gating logic)

## Total Remaining Effort
- 13 screens total
- 1 completed (AnalysisScreen)
- **12 screens remaining**
- Estimated: 40-50 hours of systematic porting work

## Recommended Approach

1. ✅ **Phase 7A** - Read-only screens (AnalysisScreen DONE)
2. **Next:** Port AnalysisHistoryScreen (2 hours)
3. **Next:** Onboarding persistence + gating (4 hours)
4. **Next:** HomeScreen (4 hours)
5. **Next:** ProfileScreen (4 hours)
6. **Next:** SmartReviewScreen (5 hours)
7. **Next:** ChallengeLeaderboardScreen (5 hours)
8. **Then:** Remaining 6 screens (15-20 hours)

## Notes
- All screens use the same BottomNav component
- Material Icons need to be handled (use react-native-vector-icons or similar)
- Images use remote URLs - works in RN
- Preserve 1:1 UI/UX from web version
- Focus on data accuracy over visual perfection initially
