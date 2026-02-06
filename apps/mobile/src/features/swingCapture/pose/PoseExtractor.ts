import { PoseLandmark } from '../types/pose';
import { PoseLandmarker, FilesetResolver, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import * as FileSystem from 'expo-file-system';

/**
 * Pose detection result for a single frame
 */
export interface PoseDetectionResult {
  landmarks: PoseLandmark[];
  confidence: number;
  worldLandmarks?: PoseLandmark[]; // 3D world coordinates
}

/**
 * Interface for pose extraction implementations
 */
export interface IPoseExtractor {
  initialize(): Promise<void>;
  detectPose(imageUri: string): Promise<PoseDetectionResult>;
  dispose(): void;
}

/**
 * MediaPipe Pose Extractor
 * 
 * Wraps MediaPipe PoseLandmarker for React Native usage.
 * Detects 33 pose landmarks on still images.
 */
export class MediaPipePoseExtractor implements IPoseExtractor {
  private poseLandmarker: PoseLandmarker | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize MediaPipe with WASM files
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'GPU', // Use GPU acceleration
        },
        runningMode: 'IMAGE',
        numPoses: 1, // Only detect one person (the golfer)
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe PoseExtractor:', error);
      throw new Error(`PoseExtractor initialization failed: ${error}`);
    }
  }

  async detectPose(imageUri: string): Promise<PoseDetectionResult> {
    if (!this.poseLandmarker) {
      throw new Error('PoseExtractor not initialized. Call initialize() first.');
    }

    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create Image element from base64 (for MediaPipe)
      const image = await this.createImageFromBase64(base64);

      // Run pose detection
      const result: PoseLandmarkerResult = this.poseLandmarker.detect(image);

      // Check if pose was detected
      if (!result.landmarks || result.landmarks.length === 0) {
        throw new Error('No pose detected in image');
      }

      // Convert to our format
      const landmarks: PoseLandmark[] = result.landmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      // Calculate average confidence from visibility scores
      const confidence =
        landmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / landmarks.length;

      // Extract world landmarks if available (3D coordinates)
      const worldLandmarks = result.worldLandmarks?.[0]?.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      return {
        landmarks,
        confidence,
        worldLandmarks,
      };
    } catch (error) {
      console.error('Pose detection failed:', error);
      throw new Error(`Pose detection failed: ${error}`);
    }
  }

  dispose(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
      this.initialized = false;
    }
  }

  /**
   * Helper: Create HTMLImageElement from base64 string
   * (MediaPipe expects HTMLImageElement in web context)
   */
  private createImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }
}

/**
 * Factory function to create pose extractor
 */
export function createPoseExtractor(): IPoseExtractor {
  return new MediaPipePoseExtractor();
}
