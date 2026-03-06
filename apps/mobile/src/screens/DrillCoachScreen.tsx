/**
 * DrillCoachScreen
 *
 * Live camera view with on-device pose verification.
 * Shows a rep counter (reps mode), hold timer (hold mode), or countdown (timer mode).
 * Fires submitReview() on finish — same pipeline as the existing completion flow.
 *
 * Navigation params:
 *   drillId         — required
 *   fromSmartReview — optional, passed back to submitReview source
 *   reviewItem      — optional, for smart-review submissions
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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDrill } from '@/hooks/useDrill';
import { useDrillCoach } from '@/features/drillCoach/useDrillCoach';
import { useSubmitReviewResult } from '@/hooks/useSmartReview';
import { colors } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

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

  const drillId = (route.params as any)?.drillId as number;
  const fromSmartReview = (route.params as any)?.fromSmartReview as boolean | undefined;
  const reviewItem = (route.params as any)?.reviewItem;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const { drill, loading: drillLoading } = useDrill(drillId);
  const { state, saving, saveSession } = useDrillCoach(drill ?? null, cameraRef as any);
  const { submit: submitReview, loading: submitting } = useSubmitReviewResult();
  const [finishing, setFinishing] = useState(false);

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
        <Text style={styles.permText}>Camera access is required to verify your drill.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Drill loading ──
  if (drillLoading || !drill) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // ── Cue from drill tips (first sentence) ──
  const cue = drill.tips
    ? drill.tips.split(/[.!?]/)[0].trim()
    : drill.objective ?? drill.name;

  // ── Finish handler ──
  const handleFinish = useCallback(async () => {
    if (finishing || submitting || saving) return;
    setFinishing(true);

    try {
      // 1. Save session telemetry to DB
      await saveSession();

      // 2. Compute score (0–1)
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

      // 3. Submit to review pipeline
      const result = await submitReview({
        item_type: 'drill',
        item_id: drillId,
        score,
        issue_slug: reviewItem?.issue_slug ?? null,
        duration_min: durationMin,
        source: fromSmartReview ? 'review' : 'daily',
      });

      // 4. Success summary
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
      Alert.alert('Error', err?.message ?? 'Failed to save drill. Please try again.');
    } finally {
      setFinishing(false);
    }
  }, [
    finishing, submitting, saving, saveSession, submitReview,
    state, drillId, fromSmartReview, reviewItem, navigation,
  ]);

  // ── Finish enabled? ──
  const canFinish = state.isComplete || (state.mode === 'none');

  // ── Main counter / timer display ──
  const counterDisplay = () => {
    if (state.mode === 'reps') {
      return (
        <View style={styles.counterBlock}>
          <Text style={styles.counterBig}>{state.repsValid}</Text>
          <Text style={styles.counterSub}>
            / {state.minValidReps} verified reps
          </Text>
          {state.repsAttempted > state.repsValid && (
            <Text style={styles.counterAttempted}>
              {state.repsAttempted} total attempted
            </Text>
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
          <Text style={styles.counterSub}>
            hold {formatHoldTime(state.minHoldMs)} target
          </Text>
          {/* Circular progress ring replaced with simple arc text for simplicity */}
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
    // none mode — show manual rep counter (same as DrillDetailsScreen fallback)
    return (
      <View style={styles.counterBlock}>
        <Text style={styles.counterBig}>{state.elapsedMs > 0 ? formatElapsed(state.elapsedMs) : '—'}</Text>
        <Text style={styles.counterSub}>in progress</Text>
      </View>
    );
  };

  // ── Initializing overlay ──
  const initOverlay = !state.ready && state.mode !== 'none' && (
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
        facing="back"
      />

      {/* Dark gradient scrim at top */}
      <View style={styles.topScrim} />

      {/* Dark gradient scrim at bottom */}
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
            {drill.name}
          </Text>

          <View style={styles.elapsedBadge}>
            <Text style={styles.elapsedText}>{formatElapsed(state.elapsedMs)}</Text>
          </View>
        </View>

        {/* Coaching cue */}
        {!!cue && (
          <View style={styles.cueCard}>
            <Text style={styles.cueLabel}>CUE</Text>
            <Text style={styles.cueText} numberOfLines={2}>{cue}</Text>
          </View>
        )}

        {/* Tracking badge */}
        <View style={styles.trackingRow}>
          <TrackingBadge health={state.trackingHealth} />
          {state.fps > 0 && (
            <Text style={styles.fps}>{state.fps.toFixed(1)} fps</Text>
          )}
        </View>
      </SafeAreaView>

      {/* ── Centre counter ── */}
      <View style={styles.counterArea} pointerEvents="none">
        {counterDisplay()}
      </View>

      {/* ── Bottom panel ── */}
      <SafeAreaView style={styles.bottomPanel}>
        {/* Quality bar (only when verification active) */}
        {state.mode !== 'none' && state.avgQuality > 0 && (
          <View style={styles.qualityRow}>
            <QualityBar quality={state.avgQuality} />
          </View>
        )}

        {/* Finish button */}
        <TouchableOpacity
          style={[
            styles.finishBtn,
            !canFinish && styles.finishBtnDisabled,
          ]}
          onPress={handleFinish}
          disabled={!canFinish || finishing || submitting || saving}
          activeOpacity={0.8}
        >
          {finishing || submitting || saving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.finishBtnText}>
              {canFinish ? 'Finish Drill' : state.mode === 'reps'
                ? `${state.repsValid} / ${state.minValidReps} reps`
                : state.mode === 'hold'
                ? `Hold ${formatHoldTime(state.minHoldMs - state.holdMs)} more`
                : 'In Progress…'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Early exit for verified drills only */}
        {!canFinish && state.mode !== 'none' && (
          <TouchableOpacity
            style={styles.skipBtn}
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
            <Text style={styles.skipBtnText}>Exit without finishing</Text>
          </TouchableOpacity>
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

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
    zIndex: 10,
  },
  qualityRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
  },

  // Finish button
  finishBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  finishBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },

  // Skip / exit
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipBtnText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
});
