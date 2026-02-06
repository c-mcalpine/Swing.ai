import { PoseLandmark, PoseMetrics, SwingPhase, KeyframeData } from '../types/pose';

/**
 * MediaPipe Pose Landmark Indices
 * https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * Calculate angle between three points (in degrees)
 */
function calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Calculate distance between two points
 */
function calculateDistance(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate center of mass from hip landmarks
 */
function calculateCenterOfMass(landmarks: PoseLandmark[]): { x: number; y: number } {
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  return {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };
}

/**
 * Derive pose metrics from keyframe data
 */
export function calculatePoseMetrics(keyframes: KeyframeData[]): PoseMetrics {
  if (keyframes.length === 0) {
    throw new Error('Cannot calculate metrics from empty keyframe array');
  }

  // Find key phases
  const addressFrame = keyframes.find((kf) => kf.phase === 'address');
  const topFrame = keyframes.find((kf) => kf.phase === 'top');
  const impactFrame = keyframes.find((kf) => kf.phase === 'impact');

  if (!addressFrame || !topFrame) {
    throw new Error('Missing critical swing phases (address, top)');
  }

  const addressLandmarks = addressFrame.landmarks;
  const topLandmarks = topFrame.landmarks;

  // Calculate hip rotation (difference between address and top)
  const addressHipAngle = calculateAngle(
    addressLandmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    addressLandmarks[POSE_LANDMARKS.LEFT_HIP],
    addressLandmarks[POSE_LANDMARKS.LEFT_KNEE]
  );
  const topHipAngle = calculateAngle(
    topLandmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    topLandmarks[POSE_LANDMARKS.LEFT_HIP],
    topLandmarks[POSE_LANDMARKS.LEFT_KNEE]
  );
  const hip_rotation_max = Math.abs(topHipAngle - addressHipAngle);

  // Calculate shoulder turn
  const addressShoulderWidth = calculateDistance(
    addressLandmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    addressLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  );
  const topShoulderWidth = calculateDistance(
    topLandmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    topLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  );
  const shoulder_turn_max = Math.abs(topShoulderWidth - addressShoulderWidth) * 180; // Normalize

  // Knee flex at address
  const knee_flex_address = calculateAngle(
    addressLandmarks[POSE_LANDMARKS.LEFT_HIP],
    addressLandmarks[POSE_LANDMARKS.LEFT_KNEE],
    addressLandmarks[POSE_LANDMARKS.LEFT_ANKLE]
  );

  // Wrist hinge at top
  const wrist_hinge_top = calculateAngle(
    topLandmarks[POSE_LANDMARKS.LEFT_ELBOW],
    topLandmarks[POSE_LANDMARKS.LEFT_WRIST],
    topLandmarks[POSE_LANDMARKS.LEFT_INDEX]
  );

  // Spine tilt at address
  const spine_tilt_address =
    Math.atan2(
      addressLandmarks[POSE_LANDMARKS.NOSE].y -
        addressLandmarks[POSE_LANDMARKS.LEFT_HIP].y,
      addressLandmarks[POSE_LANDMARKS.NOSE].x -
        addressLandmarks[POSE_LANDMARKS.LEFT_HIP].x
    ) *
    (180 / Math.PI);

  // Weight shift (lateral CoM movement)
  const addressCoM = calculateCenterOfMass(addressLandmarks);
  const topCoM = calculateCenterOfMass(topLandmarks);
  const weight_shift = Math.abs(topCoM.x - addressCoM.x);

  // Head stability
  const addressHead = addressLandmarks[POSE_LANDMARKS.NOSE];
  const headMovements = keyframes.map((kf) => {
    const head = kf.landmarks[POSE_LANDMARKS.NOSE];
    return Math.sqrt(
      Math.pow(head.x - addressHead.x, 2) + Math.pow(head.y - addressHead.y, 2)
    );
  });
  const head_stability = 1 - Math.max(...headMovements); // Higher = more stable

  // Club path deviation (proxy from hand path)
  const handPaths = keyframes.map((kf) => ({
    x: kf.landmarks[POSE_LANDMARKS.LEFT_WRIST].x,
    y: kf.landmarks[POSE_LANDMARKS.LEFT_WRIST].y,
  }));
  const avgX = handPaths.reduce((sum, p) => sum + p.x, 0) / handPaths.length;
  const deviations = handPaths.map((p) => Math.abs(p.x - avgX));
  const club_path_deviation = Math.max(...deviations);

  // Swing tempo (backswing:downswing ratio)
  const backswingFrames = keyframes.filter(
    (kf) => kf.phase === 'takeaway' || kf.phase === 'backswing' || kf.phase === 'top'
  ).length;
  const downswingFrames = keyframes.filter(
    (kf) =>
      kf.phase === 'transition' ||
      kf.phase === 'downswing' ||
      kf.phase === 'impact'
  ).length;
  const swing_tempo = downswingFrames > 0 ? backswingFrames / downswingFrames : 1.0;

  // Total duration
  const total_duration_ms =
    keyframes[keyframes.length - 1].timestamp_ms - keyframes[0].timestamp_ms;

  return {
    hip_rotation_max,
    shoulder_turn_max,
    knee_flex_address,
    wrist_hinge_top,
    spine_tilt_address,
    weight_shift,
    head_stability,
    club_path_deviation,
    swing_tempo,
    total_duration_ms,
  };
}

/**
 * Tag swing phases based on pose landmarks
 * 
 * This is a deterministic heuristic, not ML.
 * Uses hand position, shoulder rotation, and hip angles.
 */
export function tagSwingPhases(keyframes: Array<{
  timestamp_ms: number;
  landmarks: PoseLandmark[];
}>): SwingPhase[] {
  if (keyframes.length === 0) return [];

  const phases: SwingPhase[] = [];

  // Calculate hand heights for each frame (left wrist Y position)
  const handHeights = keyframes.map(
    (kf) => kf.landmarks[POSE_LANDMARKS.LEFT_WRIST].y
  );
  const minHandHeight = Math.min(...handHeights);
  const maxHandHeight = Math.max(...handHeights);

  // Find critical frame indices
  const addressIdx = 0; // First frame is always address
  const topIdx = handHeights.indexOf(minHandHeight); // Highest hands = top
  const impactIdx = handHeights.lastIndexOf(maxHandHeight); // Lowest hands = impact

  for (let i = 0; i < keyframes.length; i++) {
    if (i === addressIdx) {
      phases.push('address');
    } else if (i < addressIdx + (topIdx - addressIdx) / 2) {
      phases.push('takeaway');
    } else if (i < topIdx) {
      phases.push('backswing');
    } else if (i === topIdx) {
      phases.push('top');
    } else if (i < topIdx + (impactIdx - topIdx) / 2) {
      phases.push('transition');
    } else if (i < impactIdx) {
      phases.push('downswing');
    } else if (i === impactIdx) {
      phases.push('impact');
    } else {
      phases.push('follow_through');
    }
  }

  return phases;
}
