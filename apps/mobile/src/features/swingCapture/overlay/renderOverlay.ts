import { Skia, Canvas, Path, Paint, ImageFormat } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import { PoseLandmark } from '../types/pose';
import { POSE_LANDMARKS } from '../pose/poseAnalysis';

/**
 * Pose skeleton connections (pairs of landmark indices)
 * Defines which landmarks to connect with lines
 */
const POSE_CONNECTIONS: Array<[number, number]> = [
  // Face
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EAR],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EAR],
  
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  
  // Left arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_PINKY],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_THUMB],
  
  // Right arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_PINKY],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_THUMB],
  
  // Left leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  
  // Right leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

/**
 * Render pose overlay on image
 * 
 * Takes original keyframe image + landmarks, draws skeleton overlay,
 * and returns a new PNG image URI.
 * 
 * @param imageUri - Local file:// path to original keyframe
 * @param landmarks - Detected pose landmarks (normalized 0-1 coordinates)
 * @param imageWidth - Original image width in pixels
 * @param imageHeight - Original image height in pixels
 * @returns Local file:// path to rendered overlay PNG
 */
export async function renderPoseOverlay(
  imageUri: string,
  landmarks: PoseLandmark[],
  imageWidth: number,
  imageHeight: number
): Promise<string> {
  try {
    // Load the original image
    const imageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const image = Skia.Image.MakeImageFromEncoded(
      Skia.Data.fromBase64(imageData)
    );

    if (!image) {
      throw new Error('Failed to load image for overlay rendering');
    }

    // Create a canvas surface matching image dimensions
    const surface = Skia.Surface.Make(imageWidth, imageHeight);
    if (!surface) {
      throw new Error('Failed to create Skia surface');
    }

    const canvas = surface.getCanvas();

    // Draw original image
    canvas.drawImage(image, 0, 0);

    // Create paint for skeleton lines
    const linePaint = Skia.Paint();
    linePaint.setColor(Skia.Color('#00FF00')); // Green
    linePaint.setStyle(PaintStyle.Stroke);
    linePaint.setStrokeWidth(3);
    linePaint.setAntiAlias(true);

    // Create paint for landmark points
    const pointPaint = Skia.Paint();
    pointPaint.setColor(Skia.Color('#FF0000')); // Red
    pointPaint.setStyle(PaintStyle.Fill);
    pointPaint.setAntiAlias(true);

    // Draw skeleton connections
    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      // Skip if either landmark has low visibility
      if (
        (start.visibility && start.visibility < 0.5) ||
        (end.visibility && end.visibility < 0.5)
      ) {
        continue;
      }

      // Convert normalized coordinates to pixel coordinates
      const startX = start.x * imageWidth;
      const startY = start.y * imageHeight;
      const endX = end.x * imageWidth;
      const endY = end.y * imageHeight;

      // Draw line
      canvas.drawLine(startX, startY, endX, endY, linePaint);
    }

    // Draw landmark points
    for (const landmark of landmarks) {
      if (landmark.visibility && landmark.visibility < 0.5) {
        continue; // Skip low-visibility landmarks
      }

      const x = landmark.x * imageWidth;
      const y = landmark.y * imageHeight;
      canvas.drawCircle(x, y, 4, pointPaint);
    }

    // Encode surface to PNG
    const snapshot = surface.makeImageSnapshot();
    const pngData = snapshot.encodeToBase64(ImageFormat.PNG);

    // Save to temporary file
    const overlayUri = `${FileSystem.cacheDirectory}overlay_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(overlayUri, pngData, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return overlayUri;
  } catch (error) {
    console.error('Failed to render pose overlay:', error);
    throw new Error(`Overlay rendering failed: ${error}`);
  }
}

/**
 * Get image dimensions from URI
 */
export async function getImageDimensions(
  imageUri: string
): Promise<{ width: number; height: number }> {
  try {
    const imageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const image = Skia.Image.MakeImageFromEncoded(
      Skia.Data.fromBase64(imageData)
    );

    if (!image) {
      throw new Error('Failed to load image');
    }

    return {
      width: image.width(),
      height: image.height(),
    };
  } catch (error) {
    console.error('Failed to get image dimensions:', error);
    throw new Error(`Failed to get image dimensions: ${error}`);
  }
}

/**
 * Clean up overlay files from cache
 */
export async function cleanupOverlays(overlayUris: string[]): Promise<void> {
  for (const uri of overlayUris) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.warn(`Failed to cleanup overlay ${uri}:`, error);
    }
  }
}
