import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUnitDetailQuery } from '@/hooks/useCurriculum';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';
import type { Database } from '@/lib/supabaseTypes';

type CurriculumUnitItemResolved =
  Database['public']['Views']['curriculum_unit_item_resolved']['Row'];

type UnitDetailScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'UnitDetail'
>;
type UnitDetailScreenRouteProp = RouteProp<AppStackParamList, 'UnitDetail'>;

const ITEM_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  lesson: { label: 'LESSON', icon: '📖', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.1)' },
  drill: { label: 'DRILL', icon: '⛳', color: colors.primary, bgColor: 'rgba(19,236,91,0.1)' },
  cue: { label: 'CUE', icon: '💬', color: '#f97316', bgColor: 'rgba(249,115,22,0.1)' },
};

const MECHANIC_ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  primary: { label: 'Primary', color: colors.primary, bg: 'rgba(19,236,91,0.12)' },
  secondary: { label: 'Secondary', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  support: { label: 'Support', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Intermediate',
  5: 'Advanced',
};

function ItemRow({
  item,
  index,
  onPress,
}: {
  item: CurriculumUnitItemResolved;
  index: number;
  onPress: () => void;
}) {
  const config = ITEM_TYPE_CONFIG[item.item_type] ?? ITEM_TYPE_CONFIG.lesson;

  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.itemOrderCol}>
        <Text style={styles.itemOrderText}>{index + 1}</Text>
      </View>

      <View style={[styles.itemTypeBadge, { backgroundColor: config.bgColor }]}>
        <Text style={styles.itemTypeIcon}>{config.icon}</Text>
      </View>

      <View style={styles.itemInfo}>
        <View style={styles.itemInfoHeader}>
          <Text style={[styles.itemTypeLabel, { color: config.color }]}>{config.label}</Text>
          {item.is_bonus && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusBadgeText}>BONUS</Text>
            </View>
          )}
          {item.is_required && !item.is_bonus && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>REQUIRED</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.content_title ?? '—'}
        </Text>
      </View>

      <Text style={styles.itemChevron}>›</Text>
    </TouchableOpacity>
  );
}

export function UnitDetailScreen() {
  const navigation = useNavigation<UnitDetailScreenNavigationProp>();
  const route = useRoute<UnitDetailScreenRouteProp>();
  const { unitId } = route.params;

  const { data: unit, isLoading, error } = useUnitDetailQuery(unitId);

  const handleItemPress = (item: CurriculumUnitItemResolved) => {
    switch (item.item_type) {
      case 'lesson':
        if (item.resolved_lesson_id != null) {
          navigation.navigate('DailyLesson', { lessonId: item.resolved_lesson_id });
        }
        break;
      case 'drill':
        if (item.resolved_drill_id != null) {
          navigation.navigate('DrillDetails', { drillId: item.resolved_drill_id });
        }
        break;
      case 'cue':
        if (item.resolved_cue_id != null) {
          navigation.navigate('CueDetail', { cueId: item.resolved_cue_id });
        }
        break;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isLoading ? 'Loading…' : unit?.title ?? 'Unit'}
          </Text>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error || !unit ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load unit.</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Unit Header */}
          <View style={styles.unitHeader}>
            <View style={styles.unitMeta}>
              <View
                style={[
                  styles.trackBadge,
                  unit.unit_type === 'foundation'
                    ? styles.trackBadgeFoundation
                    : styles.trackBadgeCorrective,
                ]}
              >
                <Text
                  style={[
                    styles.trackBadgeText,
                    unit.unit_type === 'foundation'
                      ? styles.trackBadgeTextFoundation
                      : styles.trackBadgeTextCorrective,
                  ]}
                >
                  {unit.unit_type === 'foundation' ? 'FOUNDATION' : 'CORRECTIVE'}
                </Text>
              </View>

              {unit.difficulty != null && (
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>
                    {DIFFICULTY_LABELS[unit.difficulty] ?? `Level ${unit.difficulty}`}
                  </Text>
                </View>
              )}

              {unit.estimated_minutes != null && (
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>⏱ {unit.estimated_minutes} min</Text>
                </View>
              )}
            </View>

            <Text style={styles.unitTitle}>{unit.title}</Text>

            {unit.description ? (
              <Text style={styles.unitDescription}>{unit.description}</Text>
            ) : null}
          </View>

          {/* Mechanics Section */}
          {unit.mechanics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MECHANICS TAUGHT</Text>
              <View style={styles.mechanicsGrid}>
                {unit.mechanics.map((m) => {
                  const roleConfig =
                    MECHANIC_ROLE_CONFIG[m.role] ?? MECHANIC_ROLE_CONFIG.support;
                  return (
                    <View
                      key={m.mechanic_id}
                      style={[styles.mechanicChip, { backgroundColor: roleConfig.bg }]}
                    >
                      <Text style={[styles.mechanicName, { color: roleConfig.color }]}>
                        {m.swing_mechanic?.name ?? `Mechanic ${m.mechanic_id}`}
                      </Text>
                      <Text style={styles.mechanicRole}>{roleConfig.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>UNIT CONTENT</Text>
              <Text style={styles.sectionCount}>{unit.items.length} items</Text>
            </View>

            {unit.items.length === 0 ? (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>No content yet.</Text>
              </View>
            ) : (
              <View style={styles.itemList}>
                {unit.items.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onPress={() => handleItemPress(item)}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    backgroundColor: 'rgba(17, 24, 19, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    paddingHorizontal: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },

  // Unit header block
  unitHeader: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  unitMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  trackBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  trackBadgeFoundation: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderColor: 'rgba(96,165,250,0.3)',
  },
  trackBadgeCorrective: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderColor: 'rgba(249,115,22,0.3)',
  },
  trackBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  trackBadgeTextFoundation: {
    color: '#60a5fa',
  },
  trackBadgeTextCorrective: {
    color: '#f97316',
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  unitDescription: {
    fontSize: 15,
    color: '#9db9a6',
    lineHeight: 22,
  },

  // Section
  section: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Mechanics grid
  mechanicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mechanicChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 2,
  },
  mechanicName: {
    fontSize: 13,
    fontWeight: '700',
  },
  mechanicRole: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Items list
  itemList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c3024',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemOrderCol: {
    width: 24,
    alignItems: 'center',
  },
  itemOrderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  itemTypeBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTypeIcon: {
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  requiredBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  requiredBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  bonusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(234,179,8,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.25)',
  },
  bonusBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#eab308',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    lineHeight: 20,
  },
  itemChevron: {
    fontSize: 22,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyItemsText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
