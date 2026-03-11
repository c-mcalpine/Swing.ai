import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useCueDetail } from '@/hooks/useCueDetail';
import { buildCuePresentation } from '@/lib/cuePresentation';
import { useSubmitReviewResult } from '@/hooks/useSmartReview';
import { useAuth } from '@/lib/AuthContext';
import { XP_BASE } from '@/lib/xpConstants';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type CueDetailNav = NativeStackNavigationProp<AppStackParamList, 'CueDetail'>;
type CueDetailRoute = RouteProp<AppStackParamList, 'CueDetail'>;

const CUE_TYPE_LABELS: Record<string, string> = {
  feel: 'Feel',
  visual: 'Visual',
  thought: 'Thought',
  checkpoint: 'Checkpoint',
  verbal: 'Verbal',
};

type PracticeState = 'ready' | 'practicing' | 'completing';

// ─────────────────────────────────────────────
// Small presentational components
// ─────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function BulletRow({ text, icon = '·' }: { text: string; icon?: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletIcon}>{icon}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function NumberedStep({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.numberedStep}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export function CueDetailScreen() {
  const navigation = useNavigation<CueDetailNav>();
  const route = useRoute<CueDetailRoute>();
  const { cueId, fromSmartReview, reviewItem } = route.params;

  const scrollRef = useRef<ScrollView | null>(null);
  const tryItNowRef = useRef<View | null>(null);
  const tryItNowY = useRef<number>(0);

  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { submit: submitReview } = useSubmitReviewResult();

  const { data: detail, isLoading, error } = useCueDetail(cueId);
  const [practiceState, setPracticeState] = useState<PracticeState>('ready');
  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  const handlePracticeCta = async () => {
    if (practiceState === 'ready') {
      setPracticeState('practicing');
      scrollRef.current?.scrollTo({ y: tryItNowY.current, animated: true });
      return;
    }

    if (practiceState === 'practicing') {
      setPracticeState('completing');
      try {
        const result = await submitReview({
          item_type: 'cue',
          item_id: cueId,
          score: 1,
          duration_min: 1,
          source: fromSmartReview ? 'review' : 'daily',
        });

        // Refresh plan data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['myPlan', userId] }),
          queryClient.invalidateQueries({ queryKey: ['dailyPlan'] }),
        ]);

        if (result?.xp_awarded) setEarnedXp(result.xp_awarded);
        const xpMsg = result?.xp_awarded ? `\n+${result.xp_awarded} XP` : '';
        Alert.alert('Cue Practiced!', `Nice work.${xpMsg}`, [
          {
            text: 'Continue',
            onPress: () => {
              if (fromSmartReview) {
                navigation.navigate('Review');
              } else {
                navigation.goBack();
              }
            },
          },
        ]);
      } catch (err: any) {
        Alert.alert('Error', err?.message ?? 'Could not save. Try again.');
        setPracticeState('practicing');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerLabel}>COACHING CUE</Text>
          <View style={styles.closeBtn} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error || !detail ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load cue.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Content
          detail={detail}
          practiceState={practiceState}
          earnedXp={earnedXp}
          scrollRef={scrollRef}
          tryItNowRef={tryItNowRef}
          tryItNowY={tryItNowY}
          onPracticeCta={handlePracticeCta}
          onDrillPress={(drillId) =>
            navigation.navigate('DrillDetails', { drillId, fromSmartReview: false })
          }
          onUnitPress={(unitId) => navigation.navigate('UnitDetail', { unitId })}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Content (extracted so logic stays clean)
// ─────────────────────────────────────────────

function Content({
  detail,
  practiceState,
  earnedXp,
  scrollRef,
  tryItNowRef,
  tryItNowY,
  onPracticeCta,
  onDrillPress,
  onUnitPress,
}: {
  detail: NonNullable<ReturnType<typeof useCueDetail>['data']>;
  practiceState: PracticeState;
  earnedXp: number | null;
  scrollRef: React.RefObject<ScrollView | null>;
  tryItNowRef: React.RefObject<View | null>;
  tryItNowY: React.MutableRefObject<number>;
  onPracticeCta: () => void;
  onDrillPress: (drillId: number) => void;
  onUnitPress: (unitId: number) => void;
}) {
  const { cue, phase, relatedDrills, curriculumContext } = detail;
  const presentation = React.useMemo(() => buildCuePresentation(detail), [detail]);

  const ctaLabel =
    practiceState === 'ready'
      ? 'Practice This Cue'
      : practiceState === 'completing'
      ? ''
      : 'I Practiced This';

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Cue Card */}
        <View style={styles.heroCard}>
          {cue.cue_type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {CUE_TYPE_LABELS[cue.cue_type] ?? cue.cue_type}
              </Text>
            </View>
          )}
          <Text style={styles.quoteIcon}>"</Text>
          <Text style={styles.cueText}>{cue.text}</Text>
          <Text style={styles.quoteIconClose}>"</Text>
          {phase && (
            <Text style={styles.phaseSub}>{phase.name} Phase</Text>
          )}
        </View>

        {/* 2. What This Helps */}
        <View style={styles.section}>
          <SectionLabel text="WHAT THIS HELPS" />
          <Text style={styles.bodyText}>{presentation.whatThisHelps}</Text>
        </View>

        {/* 3. Use This When */}
        <View style={styles.section}>
          <SectionLabel text="USE THIS WHEN" />
          <View style={styles.bulletList}>
            {presentation.useThisWhen.map((item, i) => (
              <BulletRow key={i} text={item} icon="→" />
            ))}
          </View>
        </View>

        {/* 4. Try It Now */}
        <View
          ref={tryItNowRef}
          onLayout={(e) => {
            tryItNowY.current = e.nativeEvent.layout.y;
          }}
          style={[styles.section, styles.tryItSection]}
        >
          <SectionLabel text="TRY IT NOW" />
          <View style={styles.stepsContainer}>
            {presentation.tryItNow.map((step, i) => (
              <NumberedStep key={i} n={i + 1} text={step} />
            ))}
          </View>
        </View>

        {/* 5. Good Reps Feel Like */}
        <View style={styles.section}>
          <SectionLabel text="GOOD REPS FEEL LIKE" />
          <View style={styles.bulletList}>
            {presentation.goodRepSigns.map((item, i) => (
              <BulletRow key={i} text={item} icon="✓" />
            ))}
          </View>
        </View>

        {/* 6. Overdo Warning */}
        {presentation.overdoWarning && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠</Text>
            <Text style={styles.warningText}>{presentation.overdoWarning}</Text>
          </View>
        )}

        {/* 7. Related Drills */}
        {relatedDrills.length > 0 && (
          <View style={styles.section}>
            <SectionLabel text="RELATED DRILLS" />
            {relatedDrills.map((drill) => (
              <TouchableOpacity
                key={drill.id}
                style={styles.drillCard}
                onPress={() => onDrillPress(drill.id)}
                activeOpacity={0.8}
              >
                <View style={styles.drillCardBody}>
                  <Text style={styles.drillName}>{drill.name}</Text>
                  {drill.objective && (
                    <Text style={styles.drillObjective} numberOfLines={2}>
                      {drill.objective}
                    </Text>
                  )}
                </View>
                <Text style={styles.drillArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 8. Part of Your Plan */}
        {curriculumContext && (
          <View style={styles.section}>
            <SectionLabel text="PART OF YOUR PLAN" />
            <TouchableOpacity
              style={styles.unitCard}
              onPress={() => onUnitPress(curriculumContext.unitId)}
              activeOpacity={0.8}
            >
              <View style={styles.unitCardBody}>
                <Text style={styles.unitLabel}>UNIT</Text>
                <Text style={styles.unitName}>{curriculumContext.unitName}</Text>
                {/* Show up to 2 sibling item titles for context */}
                {curriculumContext.siblingItems
                  .filter((s) => s.resolved_cue_id !== cue.id)
                  .slice(0, 2)
                  .map((s) => (
                    <Text key={s.id} style={styles.siblingTitle} numberOfLines={1}>
                      · {s.content_title}
                    </Text>
                  ))}
              </View>
              <Text style={styles.drillArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 9. Bonus XP Available */}
        <View style={styles.section}>
          <SectionLabel text="XP AVAILABLE" />
          <View style={styles.xpBlock}>
            {/* Cue XP row */}
            <View style={styles.xpRow}>
              <View style={styles.xpRowLeft}>
                <Text style={styles.xpRowIcon}>⚡</Text>
                <Text style={styles.xpRowLabel}>Practice this cue</Text>
              </View>
              {earnedXp != null ? (
                <View style={styles.xpEarnedBadge}>
                  <Text style={styles.xpEarnedBadgeText}>+{earnedXp} XP earned!</Text>
                </View>
              ) : (
                <Text style={styles.xpRowAmount}>+{XP_BASE.cue} XP</Text>
              )}
            </View>

            {/* Related drills XP rows */}
            {relatedDrills.slice(0, 3).map((drill) => (
              <TouchableOpacity
                key={drill.id}
                style={styles.xpRow}
                onPress={() => onDrillPress(drill.id)}
                activeOpacity={0.8}
              >
                <View style={styles.xpRowLeft}>
                  <Text style={styles.xpRowIcon}>🏌️</Text>
                  <Text style={styles.xpRowLabel} numberOfLines={1}>{drill.name}</Text>
                </View>
                <View style={styles.xpRowRight}>
                  <Text style={styles.xpRowAmount}>+{XP_BASE.drill} XP</Text>
                  <Text style={styles.xpRowArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Lesson XP row if curriculum context has a lesson sibling */}
            {curriculumContext?.siblingItems
              .filter((s) => s.item_type === 'lesson')
              .slice(0, 1)
              .map((s) => (
                <View key={s.id} style={styles.xpRow}>
                  <View style={styles.xpRowLeft}>
                    <Text style={styles.xpRowIcon}>📖</Text>
                    <Text style={styles.xpRowLabel} numberOfLines={1}>
                      {s.content_title ?? 'Related Lesson'}
                    </Text>
                  </View>
                  <Text style={styles.xpRowAmount}>+{XP_BASE.lesson} XP</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Bottom spacer so CTA doesn't cover content */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky bottom CTA */}
      <SafeAreaView style={styles.ctaContainer}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            practiceState === 'practicing' && styles.ctaBtnActive,
            practiceState === 'completing' && styles.ctaBtnDisabled,
          ]}
          onPress={onPracticeCta}
          disabled={practiceState === 'completing'}
          activeOpacity={0.85}
        >
          {practiceState === 'completing' ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

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
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  retryBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  // Hero card
  heroCard: {
    backgroundColor: '#1c3024',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.15)',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.3)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  typeBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  quoteIcon: {
    fontSize: 40,
    color: colors.primary,
    opacity: 0.4,
    lineHeight: 40,
    alignSelf: 'flex-start',
  },
  quoteIconClose: {
    fontSize: 40,
    color: colors.primary,
    opacity: 0.4,
    lineHeight: 40,
    alignSelf: 'flex-end',
  },
  cueText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 32,
  },
  phaseSub: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  // Generic section
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
  },

  // Bullet list
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletIcon: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
    width: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },

  // Try It Now section (slightly elevated background)
  tryItSection: {
    backgroundColor: 'rgba(19, 236, 91, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.1)',
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  stepsContainer: {
    gap: 10,
  },
  numberedStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.background,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
  },

  // Warning card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    padding: spacing.md,
  },
  warningIcon: {
    fontSize: 16,
    color: '#fbbf24',
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#fde68a',
    lineHeight: 19,
  },

  // Drill cards
  drillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    gap: 12,
  },
  drillCardBody: {
    flex: 1,
    gap: 3,
  },
  drillName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  drillObjective: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  drillArrow: {
    fontSize: 18,
    color: colors.primary,
  },

  // Unit card
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 236, 91, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.12)',
    padding: spacing.md,
    gap: 12,
  },
  unitCardBody: {
    flex: 1,
    gap: 4,
  },
  unitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  unitName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  siblingTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Bottom CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ctaBtn: {
    height: 54,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaBtnActive: {
    backgroundColor: '#0fa84e',
  },
  ctaBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },

  // Bonus XP block
  xpBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  xpRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  xpRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpRowIcon: {
    fontSize: 16,
  },
  xpRowLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  xpRowAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  xpRowArrow: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  xpEarnedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpEarnedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
