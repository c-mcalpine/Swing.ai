/**
 * MediaPipe Pose pipeline for swing analysis.
 * Runs pose detection on video frames and extracts phase timestamps.
 */
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import type {
  PoseTimeSeries,
  PoseSummary,
  PhaseTimestamps,
} from '../types';

let poseLandmarker: PoseLandmarker | null = null;

/** MediaPipe landmark indices */
const LANDMARK = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

/**
 * Initialize the MediaPipe PoseLandmarker.
 */
async function initPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  });

  return poseLandmarker;
}

/**
 * Run pose detection on a video blob and return time series of pose frames.
 * NOTE: This processes frames at ~10fps for performance.
 */
export async function runPose(videoBlob: Blob): Promise<PoseTimeSeries> {
  const landmarker = await initPoseLandmarker();
  const videoUrl = URL.createObjectURL(videoBlob);
  
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });

  const duration = video.duration * 1000; // ms
  const frameInterval = 100; // ~10 fps
  const poseFrames: PoseTimeSeries = [];

  // Process frames by seeking through video
  for (let t = 0; t < duration; t += frameInterval) {
    video.currentTime = t / 1000;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    const result = landmarker.detectForVideo(video, t);
    
    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0].map((lm: { x: number; y: number; z: number; visibility?: number }) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      poseFrames.push({
        timestamp_ms: t,
        landmarks,
      });
    }
  }

  URL.revokeObjectURL(videoUrl);
  return poseFrames;
}

/**
 * Detect swing phases from pose time series.
 * Returns timestamps for each detected phase.
 */
export function detectPhases(poses: PoseTimeSeries): PhaseTimestamps {
  if (poses.length === 0) return {};

  const timestamps: PhaseTimestamps = {};
  
  // Find wrist positions over time (use right wrist for right-handed golfer)
  const wristYOverTime = poses.map((p) => ({
    t: p.timestamp_ms,
    y: p.landmarks[LANDMARK.RIGHT_WRIST]?.y ?? 0,
    x: p.landmarks[LANDMARK.RIGHT_WRIST]?.x ?? 0,
  }));

  // Note: Hip Y values could be used for more advanced phase detection
  // Currently using wrist positions as primary signal

  // Address: First frame where pose is detected and relatively still
  timestamps.address = poses[0]?.timestamp_ms;

  // Find the highest wrist position (top of backswing)
  // In normalized coords, lower Y = higher position
  let minWristY = Infinity;
  let topIndex = 0;
  
  for (let i = 0; i < wristYOverTime.length; i++) {
    if (wristYOverTime[i].y < minWristY) {
      minWristY = wristYOverTime[i].y;
      topIndex = i;
    }
  }
  timestamps.top = wristYOverTime[topIndex]?.t;

  // Takeaway: ~30% of the way to top
  const takeawayIndex = Math.floor(topIndex * 0.3);
  timestamps.takeaway = wristYOverTime[takeawayIndex]?.t;

  // Find impact: lowest wrist position after top (hands at ball level)
  let maxWristY = -Infinity;
  let impactIndex = topIndex;
  
  for (let i = topIndex; i < wristYOverTime.length; i++) {
    if (wristYOverTime[i].y > maxWristY) {
      maxWristY = wristYOverTime[i].y;
      impactIndex = i;
    }
  }
  timestamps.impact = wristYOverTime[impactIndex]?.t;

  // Downswing: ~50% between top and impact
  const downswingIndex = Math.floor((topIndex + impactIndex) / 2);
  timestamps.downswing = wristYOverTime[downswingIndex]?.t;

  // Finish: Last frame or ~500ms after impact
  const finishIndex = Math.min(
    impactIndex + 5, // ~500ms at 10fps
    poses.length - 1
  );
  timestamps.finish = poses[finishIndex]?.timestamp_ms;

  return timestamps;
}

/**
 * Determine handedness from pose (which shoulder is closer to ball side).
 */
export function detectHandedness(
  poses: PoseTimeSeries
): 'left' | 'right' {
  if (poses.length === 0) return 'right';

  // Use first few frames to determine setup orientation
  const firstPose = poses[0];
  if (!firstPose) return 'right';

  const leftShoulder = firstPose.landmarks[LANDMARK.LEFT_SHOULDER];
  const rightShoulder = firstPose.landmarks[LANDMARK.RIGHT_SHOULDER];

  if (!leftShoulder || !rightShoulder) return 'right';

  // If left shoulder is more to the left (lower X), likely right-handed golfer
  // This is a simplification - real detection would consider more factors
  return leftShoulder.x < rightShoulder.x ? 'right' : 'left';
}

/**
 * Compute approximate club angle references from pose data.
 * These are rough estimates based on arm angles.
 */
export function computeClubAngleRefs(
  poses: PoseTimeSeries,
  phases: PhaseTimestamps
): { shaft_top?: number; shaft_impact?: number } {
  const refs: { shaft_top?: number; shaft_impact?: number } = {};

  // Find frame at top
  const topFrame = poses.find((p) => p.timestamp_ms === phases.top);
  if (topFrame) {
    const shoulder = topFrame.landmarks[LANDMARK.RIGHT_SHOULDER];
    const wrist = topFrame.landmarks[LANDMARK.RIGHT_WRIST];
    if (shoulder && wrist) {
      // Rough angle based on shoulder-to-wrist line
      const dx = wrist.x - shoulder.x;
      const dy = wrist.y - shoulder.y;
      refs.shaft_top = Math.atan2(dy, dx);
    }
  }

  // Find frame at impact
  const impactFrame = poses.find((p) => p.timestamp_ms === phases.impact);
  if (impactFrame) {
    const shoulder = impactFrame.landmarks[LANDMARK.RIGHT_SHOULDER];
    const wrist = impactFrame.landmarks[LANDMARK.RIGHT_WRIST];
    if (shoulder && wrist) {
      const dx = wrist.x - shoulder.x;
      const dy = wrist.y - shoulder.y;
      refs.shaft_impact = Math.atan2(dy, dx);
    }
  }

  return refs;
}

/**
 * Build a compact pose summary from the full pose time series.
 */
export function buildPoseSummary(poses: PoseTimeSeries): PoseSummary {
  const phases = detectPhases(poses);
  const handedness = detectHandedness(poses);
  const approx_club_refs = computeClubAngleRefs(poses, phases);

  // Compute confidence based on landmark visibility at key phases
  const confidence: Record<string, number> = {};
  
  for (const [phase, timestamp] of Object.entries(phases)) {
    const frame = poses.find((p) => p.timestamp_ms === timestamp);
    if (frame) {
      const avgVisibility =
        frame.landmarks.reduce((sum, lm) => sum + (lm.visibility ?? 0), 0) /
        frame.landmarks.length;
      confidence[phase] = Math.round(avgVisibility * 100) / 100;
    }
  }

  return {
    phases,
    confidence,
    handedness,
    approx_club_refs,
  };
}

/** Export DrawingUtils for use in overlay rendering */
export { DrawingUtils };

