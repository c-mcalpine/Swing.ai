import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { CaptureScreen } from '@/screens/CaptureScreen';
import { AnalysisScreen } from '@/screens/AnalysisScreen';
import { AnalysisHistoryScreen } from '@/screens/AnalysisHistoryScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { ChallengeLeaderboardScreen } from '@/screens/ChallengeLeaderboardScreen';
import { PersonalizedPlanScreen } from '@/screens/PersonalizedPlanScreen';
import { DailyLessonScreen } from '@/screens/DailyLessonScreen';
import { QuickDrillsScreen } from '@/screens/QuickDrillsScreen';
import { DrillDetailsScreen } from '@/screens/DrillDetailsScreen';
import { InitialSwingSetupScreen } from '@/screens/InitialSwingSetupScreen';
import { SwingRecordingScreen } from '@/screens/SwingRecordingScreen';
import { SwingDiagnosticViewScreen } from '@/screens/SwingDiagnosticViewScreen';

/**
 * App Stack - Main navigation for authenticated users
 */

export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  Capture: undefined;
  Analysis: { captureId?: number }; // Accept capture_id parameter
  AnalysisHistory: undefined;
  Review: undefined;
  ChallengeLeaderboard: undefined;
  PersonalizedPlan: undefined;
  DailyLesson: { lessonId?: number };
  QuickDrills: undefined;
  DrillDetails: { drillId: number };
  InitialSwingSetup: undefined;
  SwingRecording: { club?: string }; // Optional club parameter
  SwingDiagnosticView: { diagnosticId?: number };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#102216', // Dark green background
        },
        headerTintColor: '#13ec5b', // Bright green for back button
        headerTitleStyle: {
          fontWeight: '700',
          color: '#ffffff',
        },
        animation: 'slide_from_right', // Default animation for detail screens
      }}
    >
      {/* Bottom Nav Screens - No animation */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          headerShown: false,
          animation: 'none', // No animation for bottom nav
        }}
      />
      <Stack.Screen 
        name="Review" 
        component={ReviewScreen}
        options={{ 
          headerShown: false,
          animation: 'none', // No animation for bottom nav
        }}
      />
      <Stack.Screen 
        name="ChallengeLeaderboard" 
        component={ChallengeLeaderboardScreen}
        options={{ 
          headerShown: false,
          animation: 'none', // No animation for bottom nav
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          headerShown: false,
          animation: 'none', // No animation for bottom nav
        }}
      />
      
      {/* Detail Screens - Slide animation */}
      <Stack.Screen 
        name="Capture" 
        component={CaptureScreen}
        options={{ 
          title: 'Record Swing',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Analysis" 
        component={AnalysisScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="AnalysisHistory" 
        component={AnalysisHistoryScreen}
        options={{ 
          title: 'Swing History',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="PersonalizedPlan" 
        component={PersonalizedPlanScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="DailyLesson" 
        component={DailyLessonScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="QuickDrills" 
        component={QuickDrillsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="DrillDetails" 
        component={DrillDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="InitialSwingSetup" 
        component={InitialSwingSetupScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="SwingRecording" 
        component={SwingRecordingScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="SwingDiagnosticView" 
        component={SwingDiagnosticViewScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
