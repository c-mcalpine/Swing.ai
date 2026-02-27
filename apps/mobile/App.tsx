import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AuthStack } from '@/navigation/AuthStack';
import { AppStack } from '@/navigation/AppStack';
import { OnboardingStack } from '@/navigation/OnboardingStack';
import { hasCompletedOnboarding } from '@/api/profile';
import { queryClient } from '@/lib/queryClient';
import { colors } from '@/styles/tokens';

/**
 * Navigation root - switches between auth, onboarding, and app stacks
 */
function Navigation() {
  const { session, loading: authLoading, userId } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [recheckTrigger, setRecheckTrigger] = useState(0);

  // Expose a function to trigger re-check (for after onboarding completion)
  useEffect(() => {
    (global as any).refetchOnboardingStatus = () => {
      console.log('[Navigation] Re-checking onboarding status...');
      setRecheckTrigger(prev => prev + 1);
    };
  }, []);

  // Check onboarding status when user is authenticated. Depend on userId (stable) not session
  // so token refresh / session object changes don't re-run and flash the loading screen.
  useEffect(() => {
    if (userId && !authLoading) {
      setCheckingOnboarding(true);
      hasCompletedOnboarding()
        .then((completed) => {
          console.log('[Navigation] Onboarding complete:', completed);
          setOnboardingComplete(completed);
        })
        .catch((error) => {
          console.error('[Navigation] Error checking onboarding:', error);
          setOnboardingComplete(false);
        })
        .finally(() => {
          setCheckingOnboarding(false);
        });
    } else {
      setOnboardingComplete(null);
    }
  }, [userId, authLoading, recheckTrigger]);

  // Show loading spinner while checking auth or onboarding state
  if (authLoading || (userId && checkingOnboarding)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine which stack to show
  let stack;
  if (!session || !userId) {
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </QueryClientProvider>
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
