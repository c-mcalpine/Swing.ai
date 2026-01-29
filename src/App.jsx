import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/App.css'

// Import screens
import HomeScreen from './screens/HomeScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import SmartReviewScreen from './screens/SmartReviewScreen'
import InitialSwingSetupScreen from './screens/InitialSwingSetupScreen'
import SwingRecordingScreen from './screens/SwingRecordingScreen'
import SwingAnalysisScreen from './screens/SwingAnalysisScreen'
import PersonalizedPlanScreen from './screens/PersonalizedPlanScreen'
import DailyLessonScreen from './screens/DailyLessonScreen'
import DrillDetailsScreen from './screens/DrillDetailsScreen'
import QuickDrillsScreen from './screens/QuickDrillsScreen'
import ChallengeLeaderboardScreen from './screens/ChallengeLeaderboardScreen'
import ProfileScreen from './screens/ProfileScreen'
import SwingDiagnosticViewScreen from './screens/SwingDiagnosticViewScreen'
import SwingCaptureScreen from './features/swing/capture/SwingCaptureScreen'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Home Screen */}
          <Route path="/" element={<HomeScreen />} />
          
          {/* Onboarding Flow */}
          <Route path="/onboarding" element={<OnboardingScreen />} />
          
          {/* Setup Flow */}
          <Route path="/setup/swing" element={<InitialSwingSetupScreen />} />
          <Route path="/review" element={<SmartReviewScreen />} />
          <Route path="/record" element={<SwingRecordingScreen />} />
          <Route path="/analysis" element={<SwingAnalysisScreen />} />
          <Route path="/leaderboard" element={<ChallengeLeaderboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/plan" element={<PersonalizedPlanScreen />} />
          <Route path="/lesson/:id" element={<DailyLessonScreen />} />
          <Route path="/lesson" element={<DailyLessonScreen />} />
          <Route path="/drill/:id" element={<DrillDetailsScreen />} />
          <Route path="/drill" element={<DrillDetailsScreen />} />
          <Route path="/drills" element={<QuickDrillsScreen />} />
          <Route path="/diagnostic/:id" element={<SwingDiagnosticViewScreen />} />
          <Route path="/capture" element={<SwingCaptureScreen />} />
          <Route path="/swing-analysis/:captureId" element={<SwingDiagnosticViewScreen />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

