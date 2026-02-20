import * as VideoThumbnails from 'expo-video-thumbnails';
import { File } from 'expo-file-system';
import type { IPoseExtractor } from '../pose/PoseExtractor';
import type { SwingPhase } from '../types/pose';
import {
  detectSwingWindow,
  getCoarseTimestamps,
  getDenseTimestampsInWindow,
  selectBestFrameMarks,
  type CandidateWithPose,
} from './swingWindow';

/**
 * Keyframe extraction result
 */
export interface Keyframe {
  uri: string; // Local file:// path to extracted image
  timestamp_ms: number;
}

/**
 * Extract keyframes from a video at specific timestamps
 * 
 * Uses Expo's VideoThumbnails to generate still frames from video.
 * Returns local file URIs that can be processed by MediaPipe.
 * 
 * @param videoUri - Local file:// path to recorded video
 * @param timestamps - Array of timestamps in milliseconds to extract
 * @returns Array of keyframes with local URIs
 */
export async function extractKeyframes(
  videoUri: string,
  timestamps: number[],
  quality: number = 1.0
): Promise<Keyframe[]> {
  const keyframes: Keyframe[] = [];

  for (const timestamp_ms of timestamps) {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timestamp_ms,
        quality, // Lower quality is used for coarse scan to reduce cost
      });

      keyframes.push({
        uri,
        timestamp_ms,
      });
    } catch (error) {
      console.error(`Failed to extract keyframe at ${timestamp_ms}ms:`, error);
      throw new Error(`Keyframe extraction failed at ${timestamp_ms}ms: ${error}`);
    }
  }

  return keyframes;
}

/**
 * Generate optimal keyframe timestamps for swing analysis
 * 
 * Uses fixed intervals optimized for golf swing phases.
 * Typical golf swing is 2-3 seconds, we extract 8-12 frames.
 * 
 * @param videoDurationMs - Total video duration in milliseconds
 * @param targetFrameCount - Target number of keyframes (default: 10)
 * @returns Array of timestamps in milliseconds
 */
export function generateKeyframeTimestamps(
  videoDurationMs: number,
  targetFrameCount: number = 10
): number[] {
  // Ensure we don't exceed video duration
  const safeFrameCount = Math.min(targetFrameCount, Math.floor(videoDurationMs / 100));
  
  // Distribute frames evenly across the video
  const interval = videoDurationMs / (safeFrameCount + 1);
  
  const timestamps: number[] = [];
  for (let i = 1; i <= safeFrameCount; i++) {
    timestamps.push(Math.floor(interval * i));
  }
  
  return timestamps;
}

/** Skip this much at the start (setup: positioning, pressing record). */
const DEFAULT_SETUP_TRIM_MS = 2_500;
/** Skip this much at the end (walking away, stopping record). */
const DEFAULT_END_TRIM_MS = 500;
/** Minimum swing window length so we don't over-trim short clips. */
const MIN_SWING_WINDOW_MS = 1_500;

export interface SwingWindowOptions {
  /** Ms to skip at video start (setup). Default 2500. */
  setupTrimMs?: number;
  /** Ms to skip at video end. Default 500. */
  endTrimMs?: number;
}

/**
 * Compute the swing window [startMs, endMs] for keyframe extraction.
 * Excludes setup at the start and trailing junk at the end.
 */
export function getSwingWindow(
  videoDurationMs: number,
  options?: SwingWindowOptions
): { startMs: number; endMs: number; windowMs: number } {
  const setupTrim = options?.setupTrimMs ?? DEFAULT_SETUP_TRIM_MS;
  const endTrim = options?.endTrimMs ?? DEFAULT_END_TRIM_MS;

  let endMs = Math.max(0, videoDurationMs - endTrim);
  let startMs = Math.min(setupTrim, Math.max(0, endMs - MIN_SWING_WINDOW_MS));
  if (endMs - startMs < MIN_SWING_WINDOW_MS) {
    startMs = Math.max(0, endMs - MIN_SWING_WINDOW_MS);
  }
  endMs = Math.min(videoDurationMs, Math.max(endMs, startMs + MIN_SWING_WINDOW_MS));

  const windowMs = Math.max(0, endMs - startMs);
  return { startMs, endMs, windowMs };
}

/** Proportional positions for 10 phase keyframes within the swing window */
const PHASE_PROPORTIONS = [
  0.05, 0.15, 0.30, 0.45, 0.55, 0.65, 0.72, 0.78, 0.85, 0.95,
];

export interface GenerateSwingTimestampsOptions extends SwingWindowOptions {
  /** When set, coarse scan + motion detection is used to find swing window. */
  poseExtractor?: IPoseExtractor;
  /** Use auto-detected window (default true when poseExtractor provided). */
  useAutoWindow?: boolean;
  /** Over-sample inside window and pick best 10 by phase heuristics (default false). */
  bestFrameSelection?: boolean;
  /** Coarse scan step ms (default 200). */
  coarseStepMs?: number;
  /** Quality for coarse thumbnail scan (default 0.25). */
  coarseQuality?: number;
  onProgress?: (message: string) => void;
}

export interface GeneratedKeyframePlan {
  timestamps: number[];
  lockedPhases?: Array<{ timestamp_ms: number; phase: SwingPhase }>;
}

/**
 * Generate timestamps optimized for golf swing phases.
 * Step 1: Detect swing window (coarse scan + motion) or fall back to fixed trim.
 * Step 2: Either proportional 10 in window, or over-sample 30 + pick best 10.
 *
 * @param videoUri - Local file URI (needed for auto window + best-frame)
 * @param videoDurationMs - Total video duration in milliseconds
 * @param options - poseExtractor + useAutoWindow + bestFrameSelection, etc.
 * @returns Promise of 10 timestamps in ms, all inside the swing window
 */
export async function generateSwingOptimizedTimestamps(
  videoUri: string,
  videoDurationMs: number,
  options?: GenerateSwingTimestampsOptions
): Promise<GeneratedKeyframePlan> {
  const poseExtractor = options?.poseExtractor;
  const useAutoWindow = options?.useAutoWindow !== false && !!poseExtractor;
  const bestFrameSelection = options?.bestFrameSelection === true && !!poseExtractor;
  const coarseStepMs = options?.coarseStepMs ?? 200;
  const coarseQuality = options?.coarseQuality ?? 0.25;
  const onProgress = options?.onProgress;

  let startMs: number;
  let endMs: number;
  let windowMs: number;

  if (useAutoWindow && poseExtractor) {
    onProgress?.('Finding swing in video…');
    const coarseTs = getCoarseTimestamps(videoDurationMs, coarseStepMs);
    const coarseKeyframes = await extractKeyframes(videoUri, coarseTs, coarseQuality);
    let window: Awaited<ReturnType<typeof detectSwingWindow>> = null;
    try {
      window = await detectSwingWindow(coarseKeyframes, poseExtractor, { onProgress });
    } finally {
      await cleanupKeyframes(coarseKeyframes);
    }
    if (window) {
      startMs = window.startMs;
      endMs = window.endMs;
      windowMs = window.windowMs;
    } else {
      const fallback = getSwingWindow(videoDurationMs, options);
      startMs = fallback.startMs;
      endMs = fallback.endMs;
      windowMs = fallback.windowMs;
    }
  } else {
    const fallback = getSwingWindow(videoDurationMs, options);
    startMs = fallback.startMs;
    endMs = fallback.endMs;
    windowMs = fallback.windowMs;
  }

  if (bestFrameSelection && poseExtractor) {
    onProgress?.('Picking best frames…');
    const denseTs = getDenseTimestampsInWindow(startMs, endMs, 30);
    const denseKeyframes = await extractKeyframes(videoUri, denseTs, coarseQuality);
    const candidates: CandidateWithPose[] = [];
    try {
      for (let i = 0; i < denseKeyframes.length; i++) {
        onProgress?.(`Analyzing frames (${i + 1}/${denseKeyframes.length})`);
        try {
          const result = await poseExtractor.detectPose(denseKeyframes[i].uri);
          candidates.push({
            timestamp_ms: denseKeyframes[i].timestamp_ms,
            landmarks: result.landmarks,
          });
        } catch {
          candidates.push({
            timestamp_ms: denseKeyframes[i].timestamp_ms,
            landmarks: [],
          });
        }
      }
      const valid = candidates.filter((c) => c.landmarks.length > 0);
      if (valid.length < 5) {
        return {
          timestamps: PHASE_PROPORTIONS.map((p) => Math.floor(startMs + p * windowMs)),
        };
      }
      const marks = selectBestFrameMarks(valid);
      return {
        timestamps: marks.map((m) => m.timestamp_ms),
        lockedPhases: marks,
      };
    } finally {
      await cleanupKeyframes(denseKeyframes);
    }
  }

  return {
    timestamps: PHASE_PROPORTIONS.map((p) => Math.floor(startMs + p * windowMs)),
  };
}

/**
 * Clean up extracted keyframe files from cache
 */
export async function cleanupKeyframes(keyframes: Keyframe[]): Promise<void> {
  for (const keyframe of keyframes) {
    try {
      const file = new File(keyframe.uri);
      if (file.exists) file.delete();
    } catch (error) {
      console.warn(`Failed to cleanup keyframe ${keyframe.uri}:`, error);
    }
  }
}
