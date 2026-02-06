/**
 * Swing Capture Feature - Public API
 * 
 * Export the main coordinator and types for use throughout the app.
 */

export { getCaptureCoordinator, CaptureCoordinator } from './captureCoordinator';
export type { CaptureConfig, ProgressCallback } from './captureCoordinator';
export type {
  PoseSummaryV1,
  SwingFrameArtifactV1,
  KeyframeData,
  CaptureResult,
  PoseLandmark,
  SwingPhase,
  PoseMetrics,
} from './types/pose';
