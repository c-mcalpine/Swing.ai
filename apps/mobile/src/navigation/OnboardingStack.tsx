import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

/**
 * Onboarding Stack - Screens for new users who haven't completed onboarding
 */

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hide header for onboarding
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
