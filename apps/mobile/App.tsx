import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AuthStack } from '@/navigation/AuthStack';
import { AppStack } from '@/navigation/AppStack';
import { OnboardingStack } from '@/navigation/OnboardingStack';
import { hasCompletedOnboarding } from '@/api/profile';
import { colors } from '@/styles/tokens';

/**
 * Navigation root - switches between auth, onboarding, and app stacks
 */
function Navigation() {
  const { session, loading: authLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [recheckTrigger, setRecheckTrigger] = useState(0);

  // Expose a function to trigger re-check (for after onboarding completion)
  useEffect(() => {
    // Add to window so it can be called from anywhere
    (global as any).refetchOnboardingStatus = () => {
      console.log('[Navigation] Re-checking onboarding status...');
      setRecheckTrigger(prev => prev + 1);
    };
  }, []);

  // Check onboarding status when user is authenticated
  useEffect(() => {
    if (session && !authLoading) {
      setCheckingOnboarding(true);
      hasCompletedOnboarding()
        .then((completed) => {
          console.log('[Navigation] Onboarding complete:', completed);
          setOnboardingComplete(completed);
        })
        .catch((error) => {
          console.error('[Navigation] Error checking onboarding:', error);
          setOnboardingComplete(false); // Default to not complete on error
        })
        .finally(() => {
          setCheckingOnboarding(false);
        });
    } else {
      setOnboardingComplete(null);
    }
  }, [session, authLoading, recheckTrigger]);

  // Show loading spinner while checking auth or onboarding state
  if (authLoading || (session && checkingOnboarding)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine which stack to show
  let stack;
  if (!session) {
    // Not authenticated -> show auth stack (login)
    stack = <AuthStack />;
  } else if (onboardingComplete === false) {
    // Authenticated but not onboarded -> show onboarding
    stack = <OnboardingStack />;
  } else {
    // Authenticated and onboarded -> show main app
    stack = <AppStack />;
  }

  return (
    <NavigationContainer>
      {stack}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

/**
 * Root app component
 * Wraps app with AuthProvider and NavigationContainer
 */
export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
