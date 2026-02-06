/**
 * Pose Data Contract Types
 * 
 * These types define the exact structure that flows from mobile → Supabase → Edge Function.
 * DO NOT modify without coordinating with the Edge Function.
 */

/**
 * MediaPipe Pose Landmark (33 keypoints per frame)
 * Normalized coordinates [0, 1] for x/y, z in world units
 */
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number; // 0-1, confidence landmark is visible
}

/**
 * Single keyframe with pose data
 */
export interface KeyframeData {
  timestamp_ms: number;
  phase: SwingPhase;
  landmarks: PoseLandmark[];
  frameUri: string; // Local file URI
  overlayUri?: string; // Local file URI (if overlay generated)
}

/**
 * Swing phases detected/tagged
 */
export type SwingPhase =
  | 'address'
  | 'takeaway'
  | 'backswing'
  | 'top'
  | 'transition'
  | 'downswing'
  | 'impact'
  | 'follow_through';

/**
 * Compact metrics derived from pose landmarks
 * These are deterministic calculations, not ML inferences
 */
export interface PoseMetrics {
  // Angles (in degrees)
  hip_rotation_max: number;
  shoulder_turn_max: number;
  knee_flex_address: number;
  wrist_hinge_top: number;
  spine_tilt_address: number;
  
  // Positions (normalized 0-1)
  weight_shift: number; // lateral CoM movement
  head_stability: number; // how much head moved
  club_path_deviation: number; // proxy from hand path
  
  // Motion metrics
  swing_tempo: number; // backswing:downswing ratio
  total_duration_ms: number;
}

/**
 * Pose Summary V1 - Stored on swing_capture.pose_summary
 * This is the canonical summary that Edge Functions read
 * 
 * CRITICAL: Keep this compact! Full landmarks are stored in swing_frame rows.
 */
export interface PoseSummaryV1 {
  version: 'v1';
  extractor: 'mediapipe-pose-0.10.9'; // Version tag
  captured_at: string; // ISO timestamp
  total_frames: number;
  keyframe_count: number;
  duration_ms: number;
  
  // Compact metrics only (no full landmarks)
  metrics: PoseMetrics;
  
  // Minimal keyframe metadata (phase + timestamps only)
  keyframes: Array<{
    timestamp_ms: number;
    phase: SwingPhase;
    has_overlay: boolean;
  }>;
  
  // Optional: key landmarks for critical phases only (address, top, impact)
  key_landmarks?: {
    address?: Array<{ idx: number; x: number; y: number; z: number }>;
    top?: Array<{ idx: number; x: number; y: number; z: number }>;
    impact?: Array<{ idx: number; x: number; y: number; z: number }>;
  };
}

/**
 * Swing Frame Artifact - Stored per swing_frame row
 * Contains per-frame landmarks for detailed analysis
 */
export interface SwingFrameArtifactV1 {
  version: 'v1';
  timestamp_ms: number;
  phase: SwingPhase;
  landmarks: PoseLandmark[];
  
  // Per-frame metrics (optional)
  frame_metrics?: {
    hip_angle?: number;
    shoulder_angle?: number;
    knee_flex?: number;
  };
}

/**
 * Storage paths for uploaded artifacts
 */
export interface UploadedArtifacts {
  framePaths: Array<{
    timestamp_ms: number;
    storagePath: string;
    publicUrl: string;
  }>;
  overlayPaths: Array<{
    timestamp_ms: number;
    storagePath: string;
    publicUrl: string;
  }>;
}

/**
 * Complete capture result ready for database insertion
 */
export interface CaptureResult {
  poseSummary: PoseSummaryV1;
  keyframes: KeyframeData[];
  uploadedArtifacts: UploadedArtifacts;
  videoUri: string;
  club?: string;
}
