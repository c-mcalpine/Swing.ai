/**
 * Auto-detect swing window via coarse scan + motion heuristics.
 * Two-pass: coarse sample → motion series → find [startMs, endMs] → dense sample inside.
 */

import type { IPoseExtractor } from '../pose/PoseExtractor';
import { POSE_LANDMARKS } from '../pose/poseAnalysis';
import type { PoseLandmark, SwingPhase } from '../types/pose';
import type { Keyframe } from './extractKeyframes';

/** Normalized motion threshold: above = swing, below = setup/static. */
const MOTION_THRESHOLD = 0.015;
/** Consecutive frames above threshold to mark swing start. */
const CONSECUTIVE_ABOVE_TO_START = 4;
/** Consecutive frames below threshold (after active) to mark swing end. */
const CONSECUTIVE_BELOW_TO_END = 6;
/** Moving average half-width for smoothing motion. */
const SMOOTH_RADIUS = 2;
/** Clamp detected window length to this range (ms). */
const MIN_WINDOW_MS = 1_200;
const MAX_WINDOW_MS = 4_500;
const MIN_POSE_CONFIDENCE = 0.45;
const PRE_ROLL_STABLE_FRAMES = 3;

function distance(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Scale for normalization: hip width (stable across frames). */
function getScale(landmarks: PoseLandmark[]): number {
  const left = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const right = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const d = distance(left, right);
  return d > 1e-6 ? d : 1;
}

/** Per-frame motion: mean landmark displacement from previous frame, normalized by scale. */
function computeMotion(
  prev: PoseLandmark[],
  curr: PoseLandmark[],
  scale: number
): number {
  if (prev.length !== curr.length || scale <= 0) return 0;
  let sum = 0;
  for (let j = 0; j < curr.length; j++) {
    sum += distance(curr[j], prev[j]);
  }
  return sum / curr.length / scale;
}

/** Moving average of size (2 * radius + 1). */
function smooth(values: number[], radius: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    for (let k = i - radius; k <= i + radius; k++) {
      if (k >= 0 && k < values.length) {
        sum += values[k];
        count++;
      }
    }
    out.push(count > 0 ? sum / count : 0);
  }
  return out;
}

export interface DetectSwingWindowOptions {
  motionThreshold?: number;
  consecutiveAboveToStart?: number;
  consecutiveBelowToEnd?: number;
  minWindowMs?: number;
  maxWindowMs?: number;
  onProgress?: (message: string) => void;
}

export interface SwingWindowResult {
  startMs: number;
  endMs: number;
  windowMs: number;
}

/**
 * Detect swing window from coarse keyframes using pose + motion.
 * Returns [startMs, endMs] or null if detection fails (fall back to fixed trim).
 */
export async function detectSwingWindow(
  coarseKeyframes: Keyframe[],
  poseExtractor: IPoseExtractor,
  options?: DetectSwingWindowOptions
): Promise<SwingWindowResult | null> {
  const threshold = options?.motionThreshold ?? MOTION_THRESHOLD;
  const nAboveStart = options?.consecutiveAboveToStart ?? CONSECUTIVE_ABOVE_TO_START;
  const nBelowEnd = options?.consecutiveBelowToEnd ?? CONSECUTIVE_BELOW_TO_END;
  const minWindowMs = options?.minWindowMs ?? MIN_WINDOW_MS;
  const maxWindowMs = options?.maxWindowMs ?? MAX_WINDOW_MS;
  const onProgress = options?.onProgress;

  if (coarseKeyframes.length < nAboveStart + nBelowEnd) {
    return null;
  }

  const landmarksByFrame: (PoseLandmark[] | null)[] = [];

  for (let i = 0; i < coarseKeyframes.length; i++) {
    onProgress?.(`Scanning for swing (${i + 1}/${coarseKeyframes.length})`);
    try {
      const result = await poseExtractor.detectPose(coarseKeyframes[i].uri);
      if (result.confidence >= MIN_POSE_CONFIDENCE) {
        landmarksByFrame.push(result.landmarks);
      } else {
        landmarksByFrame.push(null);
      }
    } catch {
      landmarksByFrame.push(null);
    }
  }

  // Build raw motion series (frame 0 has no previous, so motion[0] = 0)
  const motionRaw: number[] = [0];
  for (let i = 1; i < landmarksByFrame.length; i++) {
    const prev = landmarksByFrame[i - 1];
    const curr = landmarksByFrame[i];
    if (!prev || !curr) {
      motionRaw.push(0);
      continue;
    }
    const scale = getScale(curr);
    motionRaw.push(computeMotion(prev, curr, scale));
  }

  const motion = smooth(motionRaw, SMOOTH_RADIUS);

  // Find first run of >= nAboveStart consecutive above threshold,
  // preceded by at least PRE_ROLL_STABLE_FRAMES low-motion frames.
  let startIdx = -1;
  for (let i = 0; i <= motion.length - nAboveStart; i++) {
    let hasStablePreroll = i >= PRE_ROLL_STABLE_FRAMES;
    if (hasStablePreroll) {
      for (let p = 1; p <= PRE_ROLL_STABLE_FRAMES; p++) {
        if (motion[i - p] >= threshold) {
          hasStablePreroll = false;
          break;
        }
      }
    }
    if (!hasStablePreroll) continue;

    let ok = true;
    for (let k = 0; k < nAboveStart; k++) {
      if (motion[i + k] < threshold) {
        ok = false;
        break;
      }
    }
    if (ok) {
      startIdx = i;
      break;
    }
  }

  if (startIdx < 0) {
    return null;
  }

  // From startIdx onward, find first run of >= nBelowEnd consecutive below threshold.
  // Swing end = last active frame (frame before that run).
  let endIdx = motion.length - 1;
  for (let i = startIdx + nAboveStart; i <= motion.length - nBelowEnd; i++) {
    let ok = true;
    for (let k = 0; k < nBelowEnd; k++) {
      if (motion[i + k] >= threshold) {
        ok = false;
        break;
      }
    }
    if (ok) {
      endIdx = Math.max(startIdx, i - 1);
      break;
    }
  }

  let startMs = coarseKeyframes[startIdx].timestamp_ms;
  let endMs = coarseKeyframes[endIdx].timestamp_ms;
  let windowMs = endMs - startMs;

  if (windowMs < minWindowMs) {
    const pad = (minWindowMs - windowMs) / 2;
    startMs = Math.max(0, startMs - pad);
    endMs = Math.min(
      coarseKeyframes[coarseKeyframes.length - 1].timestamp_ms,
      endMs + pad
    );
    windowMs = endMs - startMs;
  }
  if (windowMs > maxWindowMs) {
    // Prefer trimming low-motion edges over symmetric center trim.
    let s = startIdx;
    let e = endIdx;
    while (e > s && coarseKeyframes[e].timestamp_ms - coarseKeyframes[s].timestamp_ms > maxWindowMs) {
      const leftScore = motion[s] ?? 0;
      const rightScore = motion[e] ?? 0;
      if (leftScore <= rightScore) s++;
      else e--;
    }
    startMs = coarseKeyframes[s].timestamp_ms;
    endMs = coarseKeyframes[e].timestamp_ms;
    windowMs = endMs - startMs;
  }

  return { startMs, endMs, windowMs };
}

/**
 * Generate coarse timestamps for two-pass scan (e.g. every 200ms).
 */
export function getCoarseTimestamps(
  videoDurationMs: number,
  stepMs: number = 200
): number[] {
  const out: number[] = [];
  for (let t = 0; t < videoDurationMs; t += stepMs) {
    out.push(t);
  }
  if (out.length > 0 && out[out.length - 1] < videoDurationMs - 50) {
    out.push(videoDurationMs - 1);
  }
  return out;
}

/** Candidate frame with pose for best-frame selection */
export interface CandidateWithPose {
  timestamp_ms: number;
  landmarks: PoseLandmark[];
}

const TARGET_FRAME_COUNT = 10;
const AUTO_PHASE_BUCKETS: SwingPhase[] = [
  'address',
  'takeaway',
  'backswing',
  'top',
  'transition',
  'downswing',
  'impact',
  'downswing',
  'follow_through',
  'follow_through',
];

export interface BestFrameMark {
  timestamp_ms: number;
  phase: SwingPhase;
}

/**
 * From ~30 candidates with landmarks, pick the best 10 for phase diversity.
 * Uses phase anchors: address (low motion), top (min wrist Y), impact (max wrist Y), follow-through.
 */
export function selectBestFrameMarks(candidates: CandidateWithPose[]): BestFrameMark[] {
  if (candidates.length <= TARGET_FRAME_COUNT) {
    return candidates.map((c, i) => ({
      timestamp_ms: c.timestamp_ms,
      phase: AUTO_PHASE_BUCKETS[Math.min(i, AUTO_PHASE_BUCKETS.length - 1)],
    }));
  }

  const n = candidates.length;
  const motion: number[] = [0];
  for (let i = 1; i < n; i++) {
    const scale = getScale(candidates[i].landmarks);
    motion.push(computeMotion(candidates[i - 1].landmarks, candidates[i].landmarks, scale));
  }

  const leftWristY = (i: number) => candidates[i].landmarks[POSE_LANDMARKS.LEFT_WRIST].y;

  const bucketSize = n / TARGET_FRAME_COUNT;
  const marks: BestFrameMark[] = [];

  for (let b = 0; b < TARGET_FRAME_COUNT; b++) {
    const lo = Math.floor(b * bucketSize);
    const hi = Math.min(n, Math.floor((b + 1) * bucketSize));
    if (lo >= hi) continue;

    let best = lo;
    if (b === 0) {
      for (let i = lo; i < hi; i++) if (motion[i] < motion[best]) best = i;
    } else if (b === 3) {
      for (let i = lo; i < hi; i++) if (leftWristY(i) < leftWristY(best)) best = i;
    } else if (b === 4 || b === 5) {
      for (let i = lo; i < hi; i++) if (motion[i] > motion[best]) best = i;
    } else if (b === 6) {
      for (let i = lo; i < hi; i++) if (leftWristY(i) > leftWristY(best)) best = i;
    } else {
      best = Math.floor((lo + hi) / 2);
    }
    marks.push({
      timestamp_ms: candidates[best].timestamp_ms,
      phase: AUTO_PHASE_BUCKETS[b],
    });
  }

  return marks;
}

/**
 * Generate evenly spaced timestamps inside a window (for over-sample before best-frame pick).
 */
export function getDenseTimestampsInWindow(
  startMs: number,
  endMs: number,
  count: number = 30
): number[] {
  const windowMs = endMs - startMs;
  if (windowMs <= 0 || count < 1) return [];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const p = (i + 0.5) / count;
    out.push(Math.floor(startMs + p * windowMs));
  }
  return out;
}
