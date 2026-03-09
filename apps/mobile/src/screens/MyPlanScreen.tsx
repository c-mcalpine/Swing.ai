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
import { useAuth } from '@/lib/AuthContext';
import {
  useMyPlanQuery,
  type PlanUnit,
  type LessonGroup,
  type PlanItemWithProgress,
} from '@/hooks/useCurriculum';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';
import type { Database } from '@/lib/supabaseTypes';

type MyPlanScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'MyPlan'>;
type UserCurriculumUnitStatus = Database['public']['Tables']['user_curriculum_unit']['Row']['status'];

// ─── Unit status config ────────────────────────────────────────────────────

const UNIT_STATUS_CONFIG: Record<
  UserCurriculumUnitStatus,
  { label: string; color: string; bg: string }
> = {
  active: { label: 'In Progress', color: '#13ec5b', bg: 'rgba(19,236,91,0.12)' },
  queued: { label: 'Up Next', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  completed: { label: 'Completed', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  skipped: { label: 'Skipped', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

const ITEM_TYPE_ICON: Record<string, string> = {
  lesson: '📖',
  drill: '⛳',
  cue: '💬',
};

// ─── Child item row (drill or cue nested under a lesson) ──────────────────

function ChildItemRow({
  entry,
  onPress,
}: {
  entry: PlanItemWithProgress;
  onPress: () => void;
}) {
  const isCompleted = entry.progress?.status === 'completed';
  return (
    <TouchableOpacity
      style={[styles.childRow, isCompleted && styles.childRowDone]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.childConnector}>
        <View style={styles.childConnectorLine} />
        <View style={[styles.childDot, isCompleted && styles.childDotDone]} />
      </View>
      <Text style={styles.childTypeIcon}>
        {ITEM_TYPE_ICON[entry.item.item_type] ?? '•'}
      </Text>
      <Text
        style={[styles.childTitle, isCompleted && styles.childTitleDone]}
        numberOfLines={2}
      >
        {entry.item.content_title ?? '—'}
      </Text>
      {isCompleted && <Text style={styles.childCheck}>✓</Text>}
    </TouchableOpacity>
  );
}

// ─── Lesson card (main card with expandable children) ────────────────────

function LessonCard({
  group,
  unitStatus,
  onLessonPress,
  onChildPress,
}: {
  group: LessonGroup;
  unitStatus: UserCurriculumUnitStatus;
  onLessonPress: () => void;
  onChildPress: (entry: PlanItemWithProgress) => void;
}) {
  const [expanded, setExpanded] = useState(unitStatus === 'active');
  const isCompleted = group.lessonProgress?.status === 'completed';
  const isInProgress = group.lessonProgress?.status === 'in_progress';
  const hasChildren = group.children.length > 0;

  return (
    <View style={styles.lessonCard}>
      {/* Lesson header row */}
      <TouchableOpacity
        style={[
          styles.lessonHeader,
          isCompleted && styles.lessonHeaderDone,
          isInProgress && styles.lessonHeaderActive,
        ]}
        onPress={onLessonPress}
        activeOpacity={0.8}
      >
        <View style={styles.lessonStatusDot}>
          {isCompleted ? (
            <Text style={styles.lessonCheckIcon}>✓</Text>
          ) : (
            <View
              style={[
                styles.lessonDot,
                isInProgress && styles.lessonDotActive,
              ]}
            />
          )}
        </View>

        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTypeLabel}>LESSON</Text>
          <Text
            style={[styles.lessonTitle, isCompleted && styles.lessonTitleDone]}
            numberOfLines={2}
          >
            {group.lesson.content_title ?? '—'}
          </Text>
        </View>

        <View style={styles.lessonRight}>
          {hasChildren && (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => setExpanded((e) => !e)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.expandIcon}>{expanded ? '⌃' : '⌄'}</Text>
            </TouchableOpacity>
          )}
          {!hasChildren && (
            <Text style={styles.lessonChevron}>›</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Nested drills/cues */}
      {expanded && hasChildren && (
        <View style={styles.childrenContainer}>
          {group.children.map((entry) => (
            <ChildItemRow
              key={entry.item.id}
              entry={entry}
              onPress={() => onChildPress(entry)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Unit section ─────────────────────────────────────────────────────────

function UnitSection({
  planUnit,
  index,
  isLast,
  onLessonPress,
  onChildPress,
}: {
  planUnit: PlanUnit;
  index: number;
  isLast: boolean;
  onLessonPress: (lessonId: number) => void;
  onChildPress: (entry: PlanItemWithProgress) => void;
}) {
  const { unit, userUnit, lessonGroups, introItems } = planUnit;
  const statusConfig = UNIT_STATUS_CONFIG[userUnit.status] ?? UNIT_STATUS_CONFIG.queued;
  const isFoundation = unit.unit_type === 'foundation';
  const completedLessons = lessonGroups.filter(
    (g) => g.lessonProgress?.status === 'completed',
  ).length;

  return (
    <View style={styles.unitSection}>
      {/* Timeline connector */}
      <View style={styles.timelineCol}>
        <View
          style={[
            styles.timelineNode,
            userUnit.status === 'active' && styles.timelineNodeActive,
            userUnit.status === 'completed' && styles.timelineNodeDone,
          ]}
        >
          <Text style={styles.timelineNodeText}>{index + 1}</Text>
        </View>
        {!isLast && <View style={styles.timelineSpine} />}
      </View>

      {/* Unit content */}
      <View style={styles.unitContent}>
        {/* Unit header card */}
        <View
          style={[
            styles.unitHeaderCard,
            userUnit.status === 'active' && styles.unitHeaderCardActive,
          ]}
        >
          <View style={styles.unitHeaderTop}>
            <View
              style={[
                styles.unitTypeBadge,
                isFoundation ? styles.unitTypeBadgeFoundation : styles.unitTypeBadgeCorrective,
              ]}
            >
              <Text
                style={[
                  styles.unitTypeBadgeText,
                  isFoundation
                    ? styles.unitTypeBadgeTextFoundation
                    : styles.unitTypeBadgeTextCorrective,
                ]}
              >
                {isFoundation ? 'FOUNDATION' : 'CORRECTIVE'}
              </Text>
            </View>

            <View style={[styles.unitStatusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.unitStatusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.unitTitle}>{unit.title}</Text>

          {unit.description ? (
            <Text style={styles.unitDescription} numberOfLines={2}>
              {unit.description}
            </Text>
          ) : null}

          {lessonGroups.length > 0 && (
            <View style={styles.unitProgress}>
              <View style={styles.unitProgressBar}>
                <View
                  style={[
                    styles.unitProgressFill,
                    {
                      width: `${Math.round(
                        (completedLessons / lessonGroups.length) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.unitProgressText}>
                {completedLessons}/{lessonGroups.length} lessons
              </Text>
            </View>
          )}
        </View>

        {/* Intro items (drills/cues before first lesson) */}
        {introItems.length > 0 && (
          <View style={styles.introItems}>
            {introItems.map((entry) => (
              <ChildItemRow
                key={entry.item.id}
                entry={entry}
                onPress={() => onChildPress(entry)}
              />
            ))}
          </View>
        )}

        {/* Lesson groups */}
        <View style={styles.lessonList}>
          {lessonGroups.map((group) => (
            <LessonCard
              key={group.lesson.id}
              group={group}
              unitStatus={userUnit.status}
              onLessonPress={() => {
                if (group.lesson.resolved_lesson_id != null) {
                  onLessonPress(group.lesson.resolved_lesson_id);
                }
              }}
              onChildPress={onChildPress}
            />
          ))}
          {lessonGroups.length === 0 && introItems.length === 0 && (
            <Text style={styles.emptyUnitText}>No content yet.</Text>
          )}
        </View>

        <View style={{ height: spacing.lg }} />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────

export function MyPlanScreen() {
  const navigation = useNavigation<MyPlanScreenNavigationProp>();
  const { userId } = useAuth();
  const { data: planUnits, isLoading, error, refetch } = useMyPlanQuery(userId ?? null);

  const totalUnits = planUnits?.length ?? 0;
  const completedUnits =
    planUnits?.filter((p) => p.userUnit.status === 'completed').length ?? 0;
  const overallPct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  const handleLessonPress = (lessonId: number) => {
    navigation.navigate('DailyLesson', { lessonId });
  };

  const handleChildPress = (entry: PlanItemWithProgress) => {
    const { item } = entry;
    switch (item.item_type) {
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
      case 'lesson':
        if (item.resolved_lesson_id != null) {
          navigation.navigate('DailyLesson', { lessonId: item.resolved_lesson_id });
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Plan</Text>
            <Text style={styles.headerSubtitle}>Built from your swing diagnosis</Text>
          </View>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your plan…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn't load plan</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : !planUnits || planUnits.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>⛳</Text>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptyBody}>
            Record a swing so we can build your personalized training roadmap.
          </Text>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => navigation.navigate('Capture')}
          >
            <Text style={styles.captureBtnText}>Record a Swing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Overall progress */}
          {totalUnits > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressPct}>{overallPct}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${overallPct}%` }]} />
              </View>
              <Text style={styles.progressSub}>
                {completedUnits} of {totalUnits} units completed
              </Text>
            </View>
          )}

          {/* Roadmap */}
          <View style={styles.roadmap}>
            {planUnits.map((planUnit, index) => (
              <UnitSection
                key={planUnit.unit.id}
                planUnit={planUnit}
                index={index}
                isLast={index === planUnits.length - 1}
                onLessonPress={handleLessonPress}
                onChildPress={handleChildPress}
              />
            ))}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const SPINE_COLOR = 'rgba(19,236,91,0.2)';
const TIMELINE_WIDTH = 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1912',
  },
  safeArea: {
    backgroundColor: 'rgba(13,25,18,0.97)',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9db9a6',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
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
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  emptyBody: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  captureBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  captureBtnText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },

  // Overall progress
  progressSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(19,236,91,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  progressSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Roadmap
  scroll: {
    flex: 1,
  },
  roadmap: {
    paddingTop: spacing.lg,
  },

  // Unit section layout (timeline col + content)
  unitSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },

  // Timeline column
  timelineCol: {
    width: TIMELINE_WIDTH,
    alignItems: 'center',
    paddingTop: 2,
  },
  timelineNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c3024',
    borderWidth: 2,
    borderColor: SPINE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(19,236,91,0.12)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineNodeDone: {
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96,165,250,0.1)',
  },
  timelineNodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  timelineSpine: {
    flex: 1,
    width: 2,
    backgroundColor: SPINE_COLOR,
    marginTop: 4,
    marginBottom: -4,
  },

  // Unit content
  unitContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: 0,
  },

  // Unit header card
  unitHeaderCard: {
    backgroundColor: '#131f17',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
    marginBottom: spacing.sm,
  },
  unitHeaderCardActive: {
    borderColor: 'rgba(19,236,91,0.25)',
    backgroundColor: '#162019',
  },
  unitHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  unitTypeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  unitTypeBadgeFoundation: {
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderColor: 'rgba(96,165,250,0.25)',
  },
  unitTypeBadgeCorrective: {
    backgroundColor: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.25)',
  },
  unitTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  unitTypeBadgeTextFoundation: {
    color: '#60a5fa',
  },
  unitTypeBadgeTextCorrective: {
    color: '#f97316',
  },
  unitStatusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  unitStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
  unitProgress: {
    gap: 4,
    marginTop: 4,
  },
  unitProgressBar: {
    height: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(19,236,91,0.12)',
    overflow: 'hidden',
  },
  unitProgressFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: colors.primary,
  },
  unitProgressText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Intro items
  introItems: {
    marginBottom: spacing.xs,
  },

  // Lesson list
  lessonList: {
    gap: spacing.xs,
  },

  // Lesson card
  lessonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a2a1e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  lessonHeaderDone: {
    opacity: 0.65,
  },
  lessonHeaderActive: {
    borderBottomWidth: 0,
  },
  lessonStatusDot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lessonDotActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(19,236,91,0.3)',
  },
  lessonCheckIcon: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '700',
  },
  lessonInfo: {
    flex: 1,
    gap: 2,
  },
  lessonTypeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#60a5fa',
    letterSpacing: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    lineHeight: 19,
  },
  lessonTitleDone: {
    color: colors.textSecondary,
  },
  lessonRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  lessonChevron: {
    fontSize: 20,
    color: colors.textSecondary,
  },

  // Children container
  childrenContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingBottom: spacing.xs,
  },

  // Child item row
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: spacing.md,
    paddingLeft: 12,
    gap: spacing.sm,
  },
  childRowDone: {
    opacity: 0.5,
  },
  childConnector: {
    width: 20,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  childConnectorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    left: 9,
  },
  childDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 1,
  },
  childDotDone: {
    backgroundColor: '#60a5fa',
  },
  childTypeIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  childTitle: {
    flex: 1,
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
  },
  childTitleDone: {
    color: colors.textSecondary,
  },
  childCheck: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '700',
    marginLeft: spacing.xs,
  },

  emptyUnitText: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
});
