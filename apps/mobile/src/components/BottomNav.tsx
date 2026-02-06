import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/AppStack';
import { colors, spacing } from '@/styles/tokens';

type NavItem = {
  id: string;
  label: string;
  icon: string;
  screen: keyof AppStackParamList;
};

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠', screen: 'Home' },
  { id: 'review', label: 'Review', icon: '📚', screen: 'Review' },
  { id: 'capture', label: 'Record', icon: '+', screen: 'Capture' },
  { id: 'challenge', label: 'Challenge', icon: '🏆', screen: 'ChallengeLeaderboard' },
  { id: 'profile', label: 'Profile', icon: '👤', screen: 'Profile' },
];

interface BottomNavProps {
  activePage?: string;
}

export function BottomNav({ activePage }: BottomNavProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();

  // Determine active page from route if not explicitly provided
  const getCurrentPage = () => {
    if (activePage) return activePage;
    
    const routeName = route.name.toLowerCase();
    if (routeName === 'home') return 'home';
    if (routeName === 'review') return 'review';
    if (routeName === 'capture') return 'capture';
    if (routeName === 'challengeleaderboard') return 'challenge';
    if (routeName === 'profile') return 'profile';
    return null;
  };

  const currentPage = getCurrentPage();

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {navItems.map((item) => {
          if (item.id === 'capture') {
            // Render floating action button
            return (
              <View key={item.id} style={styles.fabWrapper}>
                <TouchableOpacity
                  style={styles.fab}
                  onPress={() => {
                    // @ts-ignore - navigate to Capture screen
                    navigation.navigate(item.screen);
                  }}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.fabIcon}>{item.icon}</Text>
                </TouchableOpacity>
              </View>
            );
          }

          const isActive = currentPage === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navButton}
              onPress={() => {
                // @ts-ignore - navigate to bottom nav screen (animation: 'none' set in AppStack)
                navigation.navigate(item.screen);
              }}
              accessibilityLabel={item.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              activeOpacity={0.7}
            >
              <Text style={[styles.icon, isActive && styles.iconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(21, 31, 24, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 50,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 72,
    paddingHorizontal: 8,
  },
  navButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4,
    paddingVertical: 8,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32, // Lift FAB above nav bar
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.background,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  icon: {
    fontSize: 26,
    color: '#6b7280',
  },
  iconActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
