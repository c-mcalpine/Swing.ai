import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

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
  timestamps: number[]
): Promise<Keyframe[]> {
  const keyframes: Keyframe[] = [];

  for (const timestamp_ms of timestamps) {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timestamp_ms,
        quality: 1.0, // Maximum quality for pose detection
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

/**
 * Generate timestamps optimized for golf swing phases
 * Uses denser sampling during critical phases (impact, transition)
 * 
 * @param videoDurationMs - Total video duration in milliseconds
 * @returns Array of timestamps optimized for swing analysis
 */
export function generateSwingOptimizedTimestamps(videoDurationMs: number): number[] {
  // For a typical 2.5s swing, we want:
  // - 1 frame at address (early)
  // - 2-3 frames during backswing
  // - 1 frame at top
  // - 3-4 frames during downswing (dense sampling)
  // - 1 frame at impact (critical)
  // - 2 frames during follow-through
  
  const duration = videoDurationMs;
  
  // Proportional timestamps (as % of total duration)
  const proportions = [
    0.05, // address
    0.15, // early backswing
    0.30, // mid backswing
    0.45, // top
    0.55, // early downswing
    0.65, // mid downswing
    0.72, // late downswing
    0.78, // impact zone
    0.85, // early follow-through
    0.95, // full follow-through
  ];
  
  return proportions.map((p) => Math.floor(duration * p));
}

/**
 * Clean up extracted keyframe files from cache
 */
export async function cleanupKeyframes(keyframes: Keyframe[]): Promise<void> {
  for (const keyframe of keyframes) {
    try {
      await FileSystem.deleteAsync(keyframe.uri, { idempotent: true });
    } catch (error) {
      console.warn(`Failed to cleanup keyframe ${keyframe.uri}:`, error);
    }
  }
}
