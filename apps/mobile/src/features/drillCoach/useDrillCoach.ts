/**
 * Drill Coach — Orchestration Hook
 *
 * Combines pose polling + the appropriate verifier (rep FSM or hold verifier)
 * based on drill.verification_type.
 *
 * Exposes a single unified interface to DrillCoachScreen so the screen doesn't
 * need to know which verifier is active.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { CameraView } from 'expo-camera';
import type { Database } from '@/lib/supabaseTypes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

import { usePosePolling } from './usePosePolling';
import { RepCounterFSM } from './repCounterFSM';
import { HoldVerifier } from './holdVerifier';
import { extractSignals } from './signals';
import type { VerificationConfig, SignalDefinition } from './signals';

type DrillRow = Database['public']['Tables']['drill']['Row'];
type DrillCoachSessionInsert =
  Database['public']['Tables']['drill_coach_session']['Insert'];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type TrackingHealth = 'good' | 'weak' | 'lost';

export interface DrillCoachState {
  /** How many reps have been attempted (reps mode) */
  repsAttempted: number;
  /** Reps that passed quality gate (reps mode) */
  repsValid: number;
  /** 0–1 moving-average quality score */
  avgQuality: number;
  /** Milliseconds the user has held the target pose (hold mode) */
  holdMs: number;
  /** Minimum hold required from config */
  minHoldMs: number;
  /** Minimum valid reps required from config */
  minValidReps: number;
  /** Whether the user currently satisfies the target pose (hold mode) */
  isHolding: boolean;
  /** Whether the drill completion requirement has been met */
  isComplete: boolean;
  /** Camera/pose tracking health */
  trackingHealth: TrackingHealth;
  /** Approx real-time FPS of pose detection */
  fps: number;
  /** True once the pose extractor has initialised */
  ready: boolean;
  /** Verification mode derived from drill config */
  mode: 'reps' | 'hold' | 'timer' | 'none';
  /** Total elapsed drill time in ms (starts when session begins) */
  elapsedMs: number;
}

interface UseDrillCoachOptions {
  /** Invoked with the session telemetry once the user taps Finish */
  onSessionSaved?: (sessionId: number) => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function trackingHealth(confidence: number): TrackingHealth {
  if (confidence >= 0.6) return 'good';
  if (confidence >= 0.35) return 'weak';
  return 'lost';
}

function parseConfig(drill: DrillRow): VerificationConfig | null {
  if (!drill.verification_config) return null;
  try {
    return drill.verification_config as VerificationConfig;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useDrillCoach(
  drill: DrillRow | null,
  cameraRef: React.RefObject<CameraView>,
  options: UseDrillCoachOptions = {}
) {
  const { userId } = useAuth();

  // ── Session timing ──
  const sessionStartRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!drill) return;
    sessionStartRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedMs(Date.now() - (sessionStartRef.current ?? Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [drill?.id]);

  // ── Parse config ──
  const config = drill ? parseConfig(drill) : null;
  const verType = drill?.verification_type ?? 'none';
  const signalDefs: SignalDefinition[] = config?.signals ?? [];
  const minValidReps = config?.min_valid_reps ?? 5;
  const minConfidence = config?.min_confidence ?? 0.5;
  const minHoldMs = config?.hold?.min_hold_ms ?? 5000;

  // ── Pose polling (only when verification is active) ──
  const pollingEnabled = !!drill && verType !== 'none';
  const { landmarks, confidence, fps, initializing } = usePosePolling(cameraRef, {
    intervalMs: 400,
    enabled: pollingEnabled,
  });

  // ── Verifier instances (stable refs; reset when drill changes) ──
  const fsmRef = useRef<RepCounterFSM | null>(null);
  const holdRef = useRef<HoldVerifier | null>(null);

  useEffect(() => {
    if (!config || verType === 'none') return;
    if (verType === 'reps' && config.fsm) {
      fsmRef.current = new RepCounterFSM(config.fsm, signalDefs, minConfidence);
      holdRef.current = null;
    } else if (verType === 'hold' && config.hold) {
      holdRef.current = new HoldVerifier(config.hold, signalDefs, minConfidence);
      fsmRef.current = null;
    }
    return () => {
      fsmRef.current = null;
      holdRef.current = null;
    };
  }, [drill?.id]);

  // ── State ──
  const [state, setState] = useState<DrillCoachState>({
    repsAttempted: 0,
    repsValid: 0,
    avgQuality: 0,
    holdMs: 0,
    minHoldMs,
    minValidReps,
    isHolding: false,
    isComplete: false,
    trackingHealth: 'lost',
    fps: 0,
    ready: false,
    mode: verType === 'none' ? 'none' : (verType as DrillCoachState['mode']),
    elapsedMs: 0,
  });

  // Mark ready when extractor finishes init
  useEffect(() => {
    if (!initializing) {
      setState((s) => ({ ...s, ready: true }));
    }
  }, [initializing]);

  // ── Tick verifier on each new landmarks snapshot ──
  useEffect(() => {
    if (!landmarks || verType === 'none') return;

    const signals = extractSignals(landmarks, signalDefs, 0.4);
    const conf = confidence;
    const health = trackingHealth(conf);

    if (verType === 'reps' && fsmRef.current) {
      const snap = fsmRef.current.tick(signals, conf);
      setState((s) => ({
        ...s,
        repsAttempted: snap.repsAttempted,
        repsValid: snap.repsValid,
        avgQuality: snap.avgQuality,
        isComplete: snap.repsValid >= minValidReps,
        trackingHealth: health,
        fps,
        elapsedMs,
      }));
    } else if (verType === 'hold' && holdRef.current) {
      const snap = holdRef.current.tick(signals, conf, Date.now());
      setState((s) => ({
        ...s,
        holdMs: snap.holdMs,
        isHolding: snap.isHolding,
        isComplete: snap.isComplete,
        avgQuality: snap.quality,
        trackingHealth: health,
        fps,
        elapsedMs,
      }));
    } else if (verType === 'timer') {
      const done = elapsedMs >= (config?.timer?.min_duration_ms ?? 60000);
      setState((s) => ({
        ...s,
        isComplete: done,
        trackingHealth: health,
        fps,
        elapsedMs,
      }));
    }
  }, [landmarks, confidence, fps]);

  // Sync elapsedMs into state on each timer tick (also for timer mode)
  useEffect(() => {
    setState((s) => ({ ...s, elapsedMs }));
  }, [elapsedMs]);

  // ── Save session + trigger submitReview ──
  const [saving, setSaving] = useState(false);

  const saveSession = useCallback(async (): Promise<number | null> => {
    if (!drill || !userId) return null;
    setSaving(true);
    try {
      const durationSec = Math.round(elapsedMs / 1000);
      const row: DrillCoachSessionInsert = {
        user_id: userId,
        drill_id: drill.id,
        finished_at: new Date().toISOString(),
        duration_sec: durationSec,
        reps_attempted: state.repsAttempted,
        reps_valid: state.repsValid,
        avg_quality: Math.round(state.avgQuality * 100) / 100,
        hold_ms: state.holdMs || null,
        verification_type: verType,
        telemetry: {
          fps: state.fps,
          tracking_health: state.trackingHealth,
          min_valid_reps: minValidReps,
          min_hold_ms: minHoldMs,
        },
      };
      const { data, error } = await supabase
        .from('drill_coach_session')
        .insert(row)
        .select('id')
        .single();
      if (error) throw error;
      if (options.onSessionSaved && data) {
        options.onSessionSaved(data.id);
      }
      return data?.id ?? null;
    } finally {
      setSaving(false);
    }
  }, [drill, userId, elapsedMs, state, verType, minValidReps, minHoldMs, options]);

  return { state, saving, saveSession };
}
