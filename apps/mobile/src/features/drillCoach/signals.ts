/**
 * Drill Coach — Pose Signal Extraction
 *
 * Given a verification_config.signals array and 33 MediaPipe landmarks,
 * produces a Record<signalLabel, number> for use by the FSM / hold verifier.
 *
 * Reuses the same math helpers that swing analysis uses in poseAnalysis.ts.
 */

import type { PoseLandmark } from '@/features/swingCapture/types/pose';

// ─────────────────────────────────────────────
// Types matching the verification_config schema
// ─────────────────────────────────────────────

export type SignalType = 'angle' | 'distance' | 'y_position' | 'x_position';

export interface SignalDefinition {
  /** Unique name used as the key in computed signal maps */
  label: string;
  type: SignalType;
  /**
   * MediaPipe landmark indices.
   * - angle: [a, vertex, c] (3 points)
   * - distance: [a, b] (2 points)
   * - y_position | x_position: [idx] (1 point, normalized 0–1)
   */
  landmarks: number[];
  /** Acceptable range for "in position" quality gate [min, max] */
  min?: number;
  max?: number;
}

export interface RepFsmConfig {
  /** Threshold bands for each FSM state — all named signals must be in range */
  ready: Record<string, [number, number]>;
  rep_start: Record<string, [number, number]>;
  rep_end: Record<string, [number, number]>;
}

export interface VerificationConfig {
  signals: SignalDefinition[];
  /** Present when verification_type === 'reps' */
  fsm?: RepFsmConfig;
  /** Present when verification_type === 'hold' */
  hold?: {
    target: Record<string, [number, number]>;
    min_hold_ms: number;
  };
  /** Present when verification_type === 'timer' */
  timer?: {
    min_duration_ms: number;
  };
  min_valid_reps?: number;
  min_confidence?: number;
}

// ─────────────────────────────────────────────
// Math helpers (mirrored from poseAnalysis.ts)
// ─────────────────────────────────────────────

function calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

function calculateDistance(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─────────────────────────────────────────────
// Signal extraction
// ─────────────────────────────────────────────

/**
 * Compute all signal values for a single frame.
 * Returns null for any signal whose required landmarks are missing or low-visibility.
 */
export function extractSignals(
  landmarks: PoseLandmark[],
  definitions: SignalDefinition[],
  minVisibility = 0.4
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const def of definitions) {
    const pts = def.landmarks.map((idx) => landmarks[idx]);

    // Skip if any required landmark is missing or invisible
    if (pts.some((p) => !p || (p.visibility !== undefined && p.visibility < minVisibility))) {
      continue;
    }

    switch (def.type) {
      case 'angle':
        if (pts.length >= 3) {
          result[def.label] = calculateAngle(pts[0], pts[1], pts[2]);
        }
        break;
      case 'distance':
        if (pts.length >= 2) {
          result[def.label] = calculateDistance(pts[0], pts[1]);
        }
        break;
      case 'y_position':
        result[def.label] = pts[0].y;
        break;
      case 'x_position':
        result[def.label] = pts[0].x;
        break;
    }
  }

  return result;
}

/**
 * Returns true if the given signal map satisfies all threshold bands.
 * A band [min, max] is satisfied when min <= value <= max.
 * Signals missing from the map are treated as NOT satisfied.
 */
export function signalsInBands(
  signals: Record<string, number>,
  bands: Record<string, [number, number]>
): boolean {
  for (const [label, [min, max]] of Object.entries(bands)) {
    const value = signals[label];
    if (value === undefined) return false;
    if (value < min || value > max) return false;
  }
  return true;
}

/**
 * Compute a 0–1 quality score for a given signal snapshot.
 * Each signal with a defined min/max range contributes:
 *   1.0 if in range, else decays linearly by how far out of range it is.
 */
export function computeSignalQuality(
  signals: Record<string, number>,
  definitions: SignalDefinition[]
): number {
  const scored = definitions.filter((d) => d.min !== undefined && d.max !== undefined);
  if (scored.length === 0) return 1;

  let total = 0;
  for (const def of scored) {
    const value = signals[def.label];
    if (value === undefined) {
      // No reading → 0 quality contribution
      continue;
    }
    const min = def.min!;
    const max = def.max!;
    const range = max - min;
    if (range <= 0) {
      total += 1;
      continue;
    }
    if (value >= min && value <= max) {
      total += 1;
    } else {
      const overshoot = value < min ? min - value : value - max;
      total += Math.max(0, 1 - overshoot / range);
    }
  }

  return total / scored.length;
}

/**
 * Average landmark visibility across the provided landmark indices.
 * Returns 0 if no landmarks have visibility data.
 */
export function landmarkConfidence(
  landmarks: PoseLandmark[],
  indices?: number[]
): number {
  const pts = indices ? indices.map((i) => landmarks[i]).filter(Boolean) : landmarks;
  const withVis = pts.filter((p) => p.visibility !== undefined);
  if (withVis.length === 0) return 0;
  return withVis.reduce((sum, p) => sum + (p.visibility ?? 0), 0) / withVis.length;
}
