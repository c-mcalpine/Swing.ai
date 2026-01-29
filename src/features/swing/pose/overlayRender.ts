/**
 * Overlay rendering utilities for drawing pose skeleton on canvas.
 */
import type { PoseLandmark } from '../types';

/** Skeleton connections for drawing lines between landmarks */
const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], // shoulders
  [11, 23], // left shoulder to hip
  [12, 24], // right shoulder to hip
  [23, 24], // hips
  // Left arm
  [11, 13], // shoulder to elbow
  [13, 15], // elbow to wrist
  // Right arm
  [12, 14], // shoulder to elbow
  [14, 16], // elbow to wrist
  // Left leg
  [23, 25], // hip to knee
  [25, 27], // knee to ankle
  // Right leg
  [24, 26], // hip to knee
  [26, 28], // knee to ankle
];

/** Color palette for skeleton drawing */
const COLORS = {
  skeleton: '#00FF88',
  skeletonAlpha: 'rgba(0, 255, 136, 0.7)',
  landmark: '#FFFFFF',
  landmarkStroke: '#00FF88',
  text: '#FFFFFF',
  textBg: 'rgba(0, 0, 0, 0.6)',
};

/**
 * Draw pose landmarks and skeleton on a canvas.
 */
export function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  options?: {
    lineWidth?: number;
    landmarkRadius?: number;
    showIndices?: boolean;
  }
): void {
  const { lineWidth = 3, landmarkRadius = 5, showIndices = false } = options ?? {};

  // Draw connections (skeleton lines)
  ctx.strokeStyle = COLORS.skeleton;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (!start || !end) continue;
    
    // Skip if visibility is too low
    const minVisibility = Math.min(start.visibility ?? 1, end.visibility ?? 1);
    if (minVisibility < 0.3) continue;

    ctx.globalAlpha = Math.min(1, minVisibility + 0.3);
    ctx.beginPath();
    ctx.moveTo(start.x * width, start.y * height);
    ctx.lineTo(end.x * width, end.y * height);
    ctx.stroke();
  }

  // Draw landmarks (joints)
  ctx.globalAlpha = 1;
  
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 1) < 0.3) continue;

    const x = lm.x * width;
    const y = lm.y * height;

    // Filled circle
    ctx.fillStyle = COLORS.landmark;
    ctx.beginPath();
    ctx.arc(x, y, landmarkRadius, 0, Math.PI * 2);
    ctx.fill();

    // Stroke
    ctx.strokeStyle = COLORS.landmarkStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Optional: show landmark indices for debugging
    if (showIndices) {
      ctx.fillStyle = COLORS.textBg;
      ctx.fillRect(x + 8, y - 8, 20, 16);
      ctx.fillStyle = COLORS.text;
      ctx.font = '10px monospace';
      ctx.fillText(String(i), x + 10, y + 3);
    }
  }
}

/**
 * Render a video frame with pose overlay to a canvas and return as Blob.
 */
export async function renderFrameWithOverlay(
  video: HTMLVideoElement,
  landmarks: PoseLandmark[],
  outputFormat: 'image/webp' | 'image/jpeg' = 'image/webp',
  quality = 0.9
): Promise<{ frameBlob: Blob; overlayBlob: Blob }> {
  const width = video.videoWidth;
  const height = video.videoHeight;

  // Create canvases
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = width;
  frameCanvas.height = height;
  const frameCtx = frameCanvas.getContext('2d')!;

  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext('2d')!;

  // Draw original frame
  frameCtx.drawImage(video, 0, 0, width, height);

  // Draw frame + overlay
  overlayCtx.drawImage(video, 0, 0, width, height);
  drawPoseOverlay(overlayCtx, landmarks, width, height);

  // Convert to blobs
  const [frameBlob, overlayBlob] = await Promise.all([
    canvasToBlob(frameCanvas, outputFormat, quality),
    canvasToBlob(overlayCanvas, outputFormat, quality),
  ]);

  return { frameBlob, overlayBlob };
}

/**
 * Extract a single frame from video at given time and return as Blob.
 */
export async function extractFrameBlob(
  video: HTMLVideoElement,
  timestampMs: number,
  outputFormat: 'image/webp' | 'image/jpeg' = 'image/webp',
  quality = 0.9
): Promise<Blob> {
  // Seek to timestamp
  video.currentTime = timestampMs / 1000;
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0);

  return canvasToBlob(canvas, outputFormat, quality);
}

/**
 * Helper to convert canvas to Blob.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from canvas'));
      },
      type,
      quality
    );
  });
}

/**
 * Draw phase label on canvas.
 */
export function drawPhaseLabel(
  ctx: CanvasRenderingContext2D,
  phase: string,
  width: number
): void {
  const label = phase.toUpperCase();
  
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  
  // Background pill
  const textWidth = ctx.measureText(label).width;
  const padding = 16;
  const pillWidth = textWidth + padding * 2;
  const pillHeight = 36;
  const x = width / 2;
  const y = 40;

  ctx.fillStyle = COLORS.textBg;
  ctx.beginPath();
  ctx.roundRect(x - pillWidth / 2, y - pillHeight / 2, pillWidth, pillHeight, 8);
  ctx.fill();

  // Text
  ctx.fillStyle = COLORS.skeleton;
  ctx.fillText(label, x, y + 8);
}

