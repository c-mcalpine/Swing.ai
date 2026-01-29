/**
 * Shared types for swing capture and analysis feature.
 */

/** Swing phase names used throughout the app */
export type SwingPhase = 'address' | 'takeaway' | 'top' | 'downswing' | 'impact' | 'finish';

/** Phase timestamps in milliseconds */
export interface PhaseTimestamps {
  address?: number;
  takeaway?: number;
  top?: number;
  downswing?: number;
  impact?: number;
  finish?: number;
}

/** Confidence scores for detected phases */
export interface PhaseConfidence {
  address?: number;
  takeaway?: number;
  top?: number;
  downswing?: number;
  impact?: number;
  finish?: number;
}

/** Approximate club angle references derived from pose */
export interface ClubAngleRefs {
  shaft_top?: number;
  shaft_impact?: number;
}

/** Compact pose summary stored in swing_capture.pose_summary */
export interface PoseSummary {
  phases: PhaseTimestamps;
  confidence?: PhaseConfidence;
  handedness?: 'left' | 'right';
  approx_club_refs?: ClubAngleRefs;
}

/** Single pose landmark from MediaPipe */
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/** Full pose result from MediaPipe for a single frame */
export interface PoseFrame {
  timestamp_ms: number;
  landmarks: PoseLandmark[];
}

/** Time series of pose frames (kept in memory only) */
export type PoseTimeSeries = PoseFrame[];

/** Extracted keyframe with blob data */
export interface ExtractedKeyframe {
  phase: SwingPhase;
  timestamp_ms: number;
  frameBlob: Blob;
  overlayBlob?: Blob;
}

/** Result from the capture pipeline */
export interface SwingCaptureResult {
  captureId: number;
  poseSummary: PoseSummary;
  frames: ExtractedKeyframe[];
}

/** Result from swing analysis edge function */
export interface SwingAnalysisResult {
  ok: boolean;
  capture_id: number;
  analysis: {
    confidence?: number;
    issue_scores?: Record<string, number>;
    mechanic_scores?: Record<string, number>;
    club_angle_refs?: Record<string, number>;
    recommended_drill_ids?: number[];
    recommended_lesson_ids?: number[];
    coach_notes?: string;
  };
}

/** XP rewards for swing events */
export const XP_REWARDS = {
  SWING_CAPTURED: 10,
  SWING_ANALYZED: 25,
} as const;

