import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/LoginScreen';

/**
 * Auth Stack - Screens for unauthenticated users
 */

export type AuthStackParamList = {
  Login: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hide header for auth screens
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
