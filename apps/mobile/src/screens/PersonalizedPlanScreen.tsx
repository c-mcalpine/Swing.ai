import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomNav } from '@/components/BottomNav';
import { useCurriculumQuery } from '@/hooks/useCurriculum';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';
import type { TrackWithUnits } from '@/hooks/useCurriculum';
import type { Database } from '@/lib/supabaseTypes';

type CurriculumUnit = Database['public']['Tables']['curriculum_unit']['Row'];
type PersonalizedPlanScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'PersonalizedPlan'
>;

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Intermediate',
  5: 'Advanced',
};

function UnitCard({
  unit,
  onPress,
}: {
  unit: CurriculumUnit;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.unitCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.unitCardLeft}>
        <View style={styles.unitCardHeader}>
          {unit.difficulty != null && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {DIFFICULTY_LABELS[unit.difficulty] ?? `Level ${unit.difficulty}`}
              </Text>
            </View>
          )}
          {unit.estimated_minutes != null && (
            <Text style={styles.unitTime}>⏱ {unit.estimated_minutes} min</Text>
          )}
        </View>
        <Text style={styles.unitTitle}>{unit.title}</Text>
        {unit.description ? (
          <Text style={styles.unitDescription} numberOfLines={2}>
            {unit.description}
          </Text>
        ) : null}
      </View>
      <Text style={styles.unitChevron}>›</Text>
    </TouchableOpacity>
  );
}

function TrackSection({
  track,
  onUnitPress,
}: {
  track: TrackWithUnits;
  onUnitPress: (unitId: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isFoundation = track.slug === 'foundation';

  return (
    <View style={styles.trackSection}>
      <TouchableOpacity
        style={styles.trackHeader}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.8}
      >
        <View style={styles.trackHeaderLeft}>
          <View
            style={[
              styles.trackIcon,
              isFoundation ? styles.trackIconFoundation : styles.trackIconCorrective,
            ]}
          >
            <Text style={styles.trackIconText}>{isFoundation ? '🏗' : '🔧'}</Text>
          </View>
          <View>
            <Text style={styles.trackName}>{track.name}</Text>
            <Text style={styles.trackUnitCount}>{track.units.length} units</Text>
          </View>
        </View>
        <Text style={styles.collapseIcon}>{collapsed ? '›' : '⌄'}</Text>
      </TouchableOpacity>

      {track.description ? (
        <Text style={styles.trackDescription}>{track.description}</Text>
      ) : null}

      {!collapsed && (
        <View style={styles.unitList}>
          {track.units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onPress={() => onUnitPress(unit.id)}
            />
          ))}
          {track.units.length === 0 && (
            <Text style={styles.emptyTrackText}>No units yet.</Text>
          )}
        </View>
      )}
    </View>
  );
}

export function PersonalizedPlanScreen() {
  const navigation = useNavigation<PersonalizedPlanScreenNavigationProp>();
  const { data: tracks, isLoading, error, refetch } = useCurriculumQuery();

  const handleUnitPress = (unitId: number) => {
    navigation.navigate('UnitDetail', { unitId });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Your Curriculum</Text>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading curriculum…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn't load curriculum</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.subtitle}>
            Build your game from the ground up. Work through foundation units to develop
            a solid swing, or target corrective units to fix specific issues.
          </Text>

          {(tracks ?? []).map((track) => (
            <TrackSection
              key={track.id}
              track={track}
              onUnitPress={handleUnitPress}
            />
          ))}

          {(tracks ?? []).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No curriculum yet</Text>
              <Text style={styles.emptyStateText}>
                Complete a swing analysis to unlock your personalized curriculum.
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111813',
  },
  safeAreaTop: {
    backgroundColor: 'rgba(17, 24, 19, 0.95)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  errorTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 9999,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: '#9db9a6',
    lineHeight: 21,
  },

  // Track Section
  trackSection: {
    gap: spacing.md,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  trackIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackIconFoundation: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
  },
  trackIconCorrective: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.2)',
  },
  trackIconText: {
    fontSize: 22,
  },
  trackName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.2,
  },
  trackUnitCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  collapseIcon: {
    fontSize: 22,
    color: colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
  trackDescription: {
    fontSize: 13,
    color: '#9db9a6',
    lineHeight: 19,
    paddingLeft: 64,
    marginTop: -spacing.sm,
  },

  // Unit list
  unitList: {
    gap: spacing.sm,
    paddingLeft: 4,
  },

  // Unit Card
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c271f',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: spacing.sm,
  },
  unitCardLeft: {
    flex: 1,
    gap: 6,
  },
  unitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  difficultyBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unitTime: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 21,
  },
  unitDescription: {
    fontSize: 13,
    color: '#9db9a6',
    lineHeight: 18,
  },
  unitChevron: {
    fontSize: 22,
    color: colors.textSecondary,
  },

  emptyTrackText: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
});
