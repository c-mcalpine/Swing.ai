/**
 * DrillCoachScreen
 *
 * Live camera view with on-device pose verification.
 * Used for both drills and lessons: camera must be on for the required duration.
 * Fires submitReview() on finish — same pipeline as the existing completion flow.
 *
 * Navigation params (at least one required):
 *   drillId         — when completing a drill
 *   lessonId        — when completing a lesson (camera + timer)
 *   fromSmartReview — optional
 *   reviewItem      — optional
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { CameraRotateIcon, DeviceMobileCameraIcon } from 'phosphor-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDrill } from '@/hooks/useDrill';
import { useLesson } from '@/hooks/useLesson';
import { useDrillCoach } from '@/features/drillCoach/useDrillCoach';
import { useSubmitReviewResult } from '@/hooks/useSmartReview';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';
import type { Database } from '@/lib/supabaseTypes';

type DrillCoachScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'DrillCoach'
>;
type DrillCoachScreenRouteProp = RouteProp<AppStackParamList, 'DrillCoach'>;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatHoldTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function formatElapsed(ms: number): string {
  return formatHoldTime(ms);
}

// ─────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────

function TrackingBadge({ health }: { health: 'good' | 'weak' | 'lost' }) {
  const label = health === 'good' ? 'Tracking: Good' : health === 'weak' ? 'Tracking: Weak' : 'Tracking: Lost';
  const dot = health === 'good' ? colors.primary : health === 'weak' ? colors.warning : colors.error;
  return (
    <View style={trackingStyles.badge}>
      <View style={[trackingStyles.dot, { backgroundColor: dot }]} />
      <Text style={trackingStyles.label}>{label}</Text>
    </View>
  );
}

const trackingStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

function QualityBar({ quality }: { quality: number }) {
  const pct = Math.round(quality * 100);
  const fill = pct >= 70 ? colors.primary : pct >= 40 ? colors.warning : colors.error;
  return (
    <View style={qStyles.container}>
      <Text style={qStyles.label}>QUALITY</Text>
      <View style={qStyles.track}>
        <View style={[qStyles.fill, { width: `${pct}%` as any, backgroundColor: fill }]} />
      </View>
      <Text style={[qStyles.pct, { color: fill }]}>{pct}%</Text>
    </View>
  );
}

const qStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    width: 52,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  pct: {
    fontSize: 12,
    fontWeight: '700',
    width: 34,
    textAlign: 'right',
  },
});

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export function DrillCoachScreen() {
  const navigation = useNavigation<DrillCoachScreenNavigationProp>();
  const route = useRoute<DrillCoachScreenRouteProp>();

  type LessonCoachSessionInsert = Database['public']['Tables']['lesson_coach_session']['Insert'];

  const drillId = (route.params as any)?.drillId as number | undefined;
  const lessonId = (route.params as any)?.lessonId as number | undefined;
  const fromSmartReview = (route.params as any)?.fromSmartReview as boolean | undefined;
  const reviewItem = (route.params as any)?.reviewItem;

  const isLessonMode = !!lessonId && !drillId;
  const isDrillMode = !!drillId && !lessonId;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [started, setStarted] = useState(false);

  const { userId } = useAuth();
  const { drill, loading: drillLoading } = useDrill(drillId ?? 0);
  const { lesson, loading: lessonLoading } = useLesson(lessonId ?? 0);

  // Build a synthetic drill row so useDrillCoach can run timer mode for a lesson
  const syntheticDrill = React.useMemo((): Database['public']['Tables']['drill']['Row'] | null => {
    if (!isLessonMode || !lesson) return null;
    const minMs = (lesson.duration_min ?? 3) * 60 * 1000;
    return {
      id: 0,
      verification_type: (lesson.verification_type ?? 'timer') as 'none' | 'reps' | 'hold' | 'timer',
      verification_config: lesson.verification_config ?? {
        timer: { min_duration_ms: minMs },
        min_confidence: 0.4,
      },
    } as Database['public']['Tables']['drill']['Row'];
  }, [isLessonMode, lesson]);

  const activeDrill = isDrillMode ? (drill ?? null) : isLessonMode ? syntheticDrill : null;

  // Only pass the drill to useDrillCoach once the user has tapped Start,
  // so the timer and pose tracking don't run until the user is positioned.
  const { state, saving, saveSession } = useDrillCoach(started ? activeDrill : null, cameraRef as any);
  const { submit: submitReview, loading: submitting } = useSubmitReviewResult();
  const [finishing, setFinishing] = useState(false);

  // ── ALL hooks must be declared before any early returns ──

  const saveLessonSession = useCallback(async (): Promise<void> => {
    if (!userId || !lessonId || !lesson) return;
    const durationSec = Math.round(state.elapsedMs / 1000);
    const finishedAt = new Date();
    const startedAt = new Date(finishedAt.getTime() - state.elapsedMs);
    await supabase.from('lesson_coach_session').insert({
      user_id: userId,
      lesson_id: lessonId,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_sec: durationSec,
      verification_type: lesson.verification_type ?? 'timer',
      telemetry: null,
    } as any);
  }, [userId, lessonId, lesson, state.elapsedMs]);

  const handleFinish = useCallback(async () => {
    if (finishing || submitting || saving) return;
    setFinishing(true);

    try {
      if (isLessonMode) {
        await saveLessonSession();
        const durationMin = Math.max(1, Math.round(state.elapsedMs / 60000));
        const result = await submitReview({
          item_type: 'lesson',
          item_id: lessonId!,
          score: 1,
          issue_slug: reviewItem?.issue_slug ?? null,
          duration_min: durationMin,
          source: fromSmartReview ? 'review' : 'daily',
        });
        Alert.alert(
          'Lesson Complete!',
          `${formatElapsed(state.elapsedMs)} completed${result?.xp_awarded ? `\n+${result.xp_awarded} XP` : ''}`,
          [{ text: 'Continue', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Drill mode
      await saveSession();
      let score = 0;
      if (state.mode === 'reps') {
        score = state.minValidReps > 0
          ? Math.min(1, state.repsValid / state.minValidReps)
          : 1;
      } else if (state.mode === 'hold') {
        score = state.minHoldMs > 0
          ? Math.min(1, state.holdMs / state.minHoldMs)
          : 1;
      } else {
        score = 1;
      }

      const durationMin = Math.max(1, Math.round(state.elapsedMs / 60000));

      const result = await submitReview({
        item_type: 'drill',
        item_id: drillId!,
        score,
        issue_slug: reviewItem?.issue_slug ?? null,
        duration_min: durationMin,
        source: fromSmartReview ? 'review' : 'daily',
      });

      const repsSummary =
        state.mode === 'reps'
          ? `${state.repsValid}/${state.repsAttempted} reps verified`
          : state.mode === 'hold'
          ? `${formatHoldTime(state.holdMs)} held`
          : `${formatElapsed(state.elapsedMs)} completed`;

      Alert.alert(
        'Drill Complete!',
        `${repsSummary}${result?.xp_awarded ? `\n+${result.xp_awarded} XP` : ''}`,
        [{ text: 'Continue', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? `Failed to save ${isLessonMode ? 'lesson' : 'drill'}. Please try again.`);
    } finally {
      setFinishing(false);
    }
  }, [
    finishing, submitting, saving, saveSession, saveLessonSession, submitReview,
    state, drillId, lessonId, isLessonMode, fromSmartReview, reviewItem, navigation,
  ]);

  // ── Early returns (all hooks above this line) ──

  // ── No subject ──
  if (!isLessonMode && !isDrillMode) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>No lesson or drill selected.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.permBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Permission gate ──
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>
          Camera access is required to verify your {isLessonMode ? 'lesson' : 'drill'}.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (isDrillMode && (drillLoading || !drill)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (isLessonMode && (lessonLoading || !lesson)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const displayName = isLessonMode ? (lesson!.title ?? 'Lesson') : drill!.name;
  const cue = isLessonMode
    ? (lesson!.summary ? lesson!.summary.split(/[.!?]/)[0].trim() : lesson!.title ?? '')
    : (drill!.tips ? drill!.tips.split(/[.!?]/)[0].trim() : drill!.objective ?? drill!.name);

  // ── Finish enabled? ──
  const canFinish = state.isComplete || (state.mode === 'none');

  // ── Main counter / timer display ──
  const counterDisplay = () => {
    if (!started) {
      return (
        <View style={styles.counterBlock}>
          <Text style={styles.alignText}>POSITION YOURSELF</Text>
        </View>
      );
    }
    if (state.mode === 'reps') {
      return (
        <View style={styles.counterBlock}>
          <Text style={styles.counterBig}>{state.repsValid}</Text>
          <Text style={styles.counterSub}>/ {state.minValidReps} verified reps</Text>
          {state.repsAttempted > state.repsValid && (
            <Text style={styles.counterAttempted}>{state.repsAttempted} total attempted</Text>
          )}
        </View>
      );
    }
    if (state.mode === 'hold') {
      const pct = Math.min(100, (state.holdMs / state.minHoldMs) * 100);
      return (
        <View style={styles.counterBlock}>
          <Text style={[styles.counterBig, state.isHolding && styles.counterBigActive]}>
            {formatHoldTime(state.holdMs)}
          </Text>
          <Text style={styles.counterSub}>hold {formatHoldTime(state.minHoldMs)} target</Text>
          <View style={styles.holdBar}>
            <View style={[styles.holdFill, { width: `${pct}%` as any }]} />
          </View>
        </View>
      );
    }
    if (state.mode === 'timer') {
      return (
        <View style={styles.counterBlock}>
          <Text style={styles.counterBig}>{formatElapsed(state.elapsedMs)}</Text>
          <Text style={styles.counterSub}>elapsed</Text>
        </View>
      );
    }
    return (
      <View style={styles.counterBlock}>
        <Text style={styles.counterBig}>{state.elapsedMs > 0 ? formatElapsed(state.elapsedMs) : '—'}</Text>
        <Text style={styles.counterSub}>in progress</Text>
      </View>
    );
  };

  // ── Initializing overlay (only shown after started) ──
  const initOverlay = started && !state.ready && state.mode !== 'none' && (
    <View style={styles.initOverlay}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.initText}>Initializing pose tracking…</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Camera fills screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />

      {/* Scrims */}
      <View style={styles.topScrim} />
      <View style={styles.bottomScrim} />

      {/* Init overlay */}
      {initOverlay}

      {/* ── Top bar ── */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.drillTitle} numberOfLines={1}>
            {displayName}
          </Text>

          {started ? (
            <View style={styles.elapsedBadge}>
              <Text style={styles.elapsedText}>{formatElapsed(state.elapsedMs)}</Text>
            </View>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Setup instruction pill (before start) */}
        {!started && (
          <View style={styles.instructions}>
            <View style={styles.instructionPill}>
              <DeviceMobileCameraIcon size={16} color={colors.white} weight="regular" />
              <Text style={styles.instructionText}>
                {isLessonMode ? 'Position yourself, then tap Start' : 'Set up your camera, then tap Start'}
              </Text>
            </View>
          </View>
        )}

        {/* Coaching cue (after start) */}
        {started && !!cue && (
          <View style={styles.cueCard}>
            <Text style={styles.cueLabel}>CUE</Text>
            <Text style={styles.cueText} numberOfLines={2}>{cue}</Text>
          </View>
        )}

        {/* Tracking badge (after start) */}
        {started && (
          <View style={styles.trackingRow}>
            <TrackingBadge health={state.trackingHealth} />
            {state.fps > 0 && (
              <Text style={styles.fps}>{state.fps.toFixed(1)} fps</Text>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* ── Centre counter / prompt ── */}
      <View style={styles.counterArea} pointerEvents="none">
        {counterDisplay()}
      </View>

      {/* ── Bottom panel ── */}
      <SafeAreaView style={styles.bottomPanel}>
        {/* Quality bar (only when active and verification running) */}
        {started && state.mode !== 'none' && state.avgQuality > 0 && (
          <View style={styles.qualityRow}>
            <QualityBar quality={state.avgQuality} />
          </View>
        )}

        {/* Camera controls row: [side btn] [main btn] [flip btn] */}
        <View style={styles.cameraControls}>
          {/* Left placeholder / exit-early when active */}
          {started && !canFinish && state.mode !== 'none' ? (
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => {
                Alert.alert(
                  'Exit early?',
                  'Your progress will still be saved.',
                  [
                    { text: 'Keep going', style: 'cancel' },
                    { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() },
                  ]
                );
              }}
            >
              <Text style={styles.controlBtnText}>✕</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.controlBtnPlaceholder} />
          )}

          {/* Main action button */}
          {!started ? (
            <TouchableOpacity style={styles.startBtn} onPress={() => setStarted(true)} activeOpacity={0.85}>
              <View style={styles.startBtnInner} />
              <Text style={styles.startBtnLabel}>START</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.finishBtn, !canFinish && styles.finishBtnDisabled]}
              onPress={handleFinish}
              disabled={!canFinish || finishing || submitting || saving}
              activeOpacity={0.8}
            >
              {finishing || submitting || saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.finishBtnText}>
                  {canFinish
                    ? (isLessonMode ? 'Finish Lesson' : 'Finish Drill')
                    : state.mode === 'reps'
                    ? `${state.repsValid} / ${state.minValidReps} reps`
                    : state.mode === 'hold'
                    ? `Hold ${formatHoldTime(state.minHoldMs - state.holdMs)} more`
                    : 'In Progress…'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Flip camera */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            accessibilityLabel="Flip camera"
          >
            <CameraRotateIcon size={24} color={colors.white} weight="regular" />
          </TouchableOpacity>
        </View>

        {!started && (
          <Text style={styles.helperText}>Get in position, then tap Start</Text>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 20,
    padding: 24,
  },
  permText: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  permBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permBtnText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },

  // Scrims
  topScrim: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 220,
    backgroundColor: 'transparent',
    // Linear gradient substitute via overlapping Views
    opacity: 0.75,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
  } as any,
  bottomScrim: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 280,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Init overlay
  initOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  initText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  // Top bar
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  drillTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  elapsedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  elapsedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Coaching cue
  cueCard: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  cueLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  cueText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Tracking
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fps: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },

  // Centre counter
  counterArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBlock: {
    alignItems: 'center',
    gap: 6,
  },
  counterBig: {
    fontSize: 88,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    fontVariant: ['tabular-nums'],
    lineHeight: 96,
  },
  counterBigActive: {
    color: colors.primary,
  },
  counterSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  counterAttempted: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },

  // Hold bar
  holdBar: {
    width: 160,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginTop: 8,
  },
  holdFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },

  // Instructions pill (setup mode)
  instructions: {
    alignItems: 'center',
    marginTop: 8,
  },
  instructionPill: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },

  // Align prompt (setup center)
  alignText: {
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.2,
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: 'center',
    opacity: 0.7,
  },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 16,
    zIndex: 10,
  },
  qualityRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
  },

  // Camera controls row (mirrors SwingRecordingScreen)
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28,39,31,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  controlBtnPlaceholder: {
    width: 48,
    height: 48,
  },

  // Start button (big circle like SwingRecordingScreen record button)
  startBtn: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 36,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  startBtnLabel: {
    position: 'relative',
    zIndex: 10,
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Finish button (wide pill, shown when active)
  finishBtn: {
    flex: 1,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 8,
  },
  finishBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },

  helperText: {
    color: '#9db9a6',
    fontSize: 12,
    textAlign: 'center',
  },

  // Skip / exit (kept for potential reuse)
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipBtnText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
});
