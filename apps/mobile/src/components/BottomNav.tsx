import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStackParamList } from '@/navigation/AppStack';
import { colors } from '@/styles/tokens';

import {
  HouseIcon,
  BookOpenIcon,
  PlusIcon,
  TrophyIcon,
  UserIcon,
} from 'phosphor-react-native';

type NavItem = {
  id: 'home' | 'review' | 'capture' | 'challenge' | 'profile';
  label: string;
  screen: keyof AppStackParamList;
  isPrimary?: boolean;
  Icon: React.ComponentType<{ size?: number; color?: string; weight?: any}>;
};

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', screen: 'Home', Icon: HouseIcon },
  { id: 'review', label: 'Review', screen: 'Review', Icon: BookOpenIcon },
  { id: 'capture', label: 'Record', screen: 'Capture', isPrimary: true, Icon: PlusIcon },
  { id: 'challenge', label: 'Challenge', screen: 'ChallengeLeaderboard', Icon: TrophyIcon },
  { id: 'profile', label: 'Profile', screen: 'Profile', Icon: UserIcon },
];

interface BottomNavProps {
  activePage?: string;
}

export function BottomNav({ activePage }: BottomNavProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const currentPage = useMemo(() => {
    if (activePage) return activePage;

    const routeName = route.name.toLowerCase();
    if (routeName === 'home') return 'home';
    if (routeName === 'review') return 'review';
    if (routeName === 'capture') return 'capture';
    if (routeName === 'challengeleaderboard') return 'challenge';
    if (routeName === 'profile') return 'profile';
    return null;
  }, [activePage, route.name]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.innerContainer}>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const color = isActive ? colors.primary : colors.textSecondary;

          if (item.isPrimary) {
            return (
              <View key={item.id} style={styles.fabWrapper}>
                <TouchableOpacity
                  style={styles.fab}
                  onPress={() => navigation.navigate({ name: item.screen as any, params: undefined })}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  activeOpacity={0.85}
                >
                  <item.Icon size={26} color={colors.black} weight="bold" />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navButton}
              onPress={() => navigation.navigate({ name: item.screen as any, params: undefined })}
              accessibilityLabel={item.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              activeOpacity={0.75}
            >
              <item.Icon size={24} color={color} weight={isActive ? 'bold' : 'regular'} />
              {/* active-label-only (cleaner + less visual noise) */}
              {isActive ? <Text style={[styles.label, styles.labelActive]}>{item.label}</Text> : <View style={{ height: 12 }} />}
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
    backgroundColor: 'rgba(13, 25, 18, 0.92)', // closer to backgroundDark
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 50,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 72,
    paddingHorizontal: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },

  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -34,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',

    // ring that matches your UI (looks more premium than a thick border)
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',

    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    opacity: 0.95,
  },
  labelActive: {
    color: colors.primary,
  },
});
