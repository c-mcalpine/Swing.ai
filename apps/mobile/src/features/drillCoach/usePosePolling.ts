/**
 * Drill Coach — Pose Polling Hook
 *
 * Drives a low-frequency "snapshot" loop:
 *   1. Take a very low-quality JPEG from the live camera preview
 *   2. Run on-device MediaPipe pose detection on it
 *   3. Delete the temp file
 *   4. Expose latest landmarks + confidence to callers
 *
 * The loop skips a cycle whenever the previous detection is still running
 * (async guard), so we never queue up work faster than the device can handle.
 *
 * intervalMs: 400 ≈ 2.5 FPS — sufficient for slow golf-drill movements.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import type { CameraView } from 'expo-camera';
import type { PoseLandmark } from '@/features/swingCapture/types/pose';
import { NativeIOSPoseExtractor } from '@/features/swingCapture/pose/PoseExtractor';
import { landmarkConfidence } from './signals';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PosePollingState {
  landmarks: PoseLandmark[] | null;
  confidence: number;
  fps: number;
  /** true while the extractor is being initialised */
  initializing: boolean;
  /** last detection error, if any */
  error: Error | null;
}

interface UsePosePollingOptions {
  intervalMs?: number;
  enabled?: boolean;
  /** Indices of landmarks to use for confidence calculation. Defaults to all. */
  confidenceLandmarks?: number[];
}

// ─────────────────────────────────────────────
// Module-level extractor singleton
// (avoids re-initialising MediaPipe on every render)
// ─────────────────────────────────────────────

let sharedExtractor: NativeIOSPoseExtractor | null = null;

async function getExtractor(): Promise<NativeIOSPoseExtractor> {
  if (!sharedExtractor) {
    sharedExtractor = new NativeIOSPoseExtractor();
  }
  if (!(sharedExtractor as any).initialized) {
    await sharedExtractor.initialize();
  }
  return sharedExtractor;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function usePosePolling(
  cameraRef: React.RefObject<CameraView>,
  options: UsePosePollingOptions = {}
): PosePollingState {
  const { intervalMs = 400, enabled = true, confidenceLandmarks } = options;

  const [state, setState] = useState<PosePollingState>({
    landmarks: null,
    confidence: 0,
    fps: 0,
    initializing: true,
    error: null,
  });

  const busyRef = useRef(false);
  const lastTickMsRef = useRef<number>(0);
  const fpsWindowRef = useRef<number[]>([]);

  // Initialise MediaPipe once on mount
  useEffect(() => {
    let cancelled = false;
    getExtractor()
      .then(() => {
        if (!cancelled) {
          setState((s) => ({ ...s, initializing: false }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({ ...s, initializing: false, error: err }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll loop
  const runDetection = useCallback(async () => {
    if (busyRef.current) return;
    if (!cameraRef.current) return;

    busyRef.current = true;
    let tempUri: string | null = null;

    try {
      const extractor = await getExtractor();

      // Capture a very small JPEG (~40KB at quality 0.1)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.1,
        skipProcessing: true,
        shutterSound: false,
      } as any);

      if (!photo?.uri) return;
      tempUri = photo.uri;

      const result = await extractor.detectPose(tempUri);

      const conf = landmarkConfidence(result.landmarks, confidenceLandmarks);

      // Rolling FPS calculation (last 5 ticks)
      const nowMs = Date.now();
      if (lastTickMsRef.current > 0) {
        fpsWindowRef.current.push(1000 / (nowMs - lastTickMsRef.current));
        if (fpsWindowRef.current.length > 5) fpsWindowRef.current.shift();
      }
      lastTickMsRef.current = nowMs;
      const fps =
        fpsWindowRef.current.length > 0
          ? fpsWindowRef.current.reduce((a, b) => a + b, 0) / fpsWindowRef.current.length
          : 0;

      setState((s) => ({
        ...s,
        landmarks: result.landmarks,
        confidence: conf,
        fps: Math.round(fps * 10) / 10,
        error: null,
      }));
    } catch (err: any) {
      // Non-fatal: pose detection can fail on blurry frames; just keep the last reading
      setState((s) => ({ ...s, error: err instanceof Error ? err : new Error(String(err)) }));
    } finally {
      // Clean up temp file
      if (tempUri) {
        FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
      }
      busyRef.current = false;
    }
  }, [cameraRef, confidenceLandmarks]);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(runDetection, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, runDetection]);

  return state;
}
