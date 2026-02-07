import { PoseLandmark } from '../types/pose';
import { Platform } from 'react-native';
import PoseExtractorModule from '../../../../modules/pose-extractor/src';

/**
 * Pose detection result for a single frame
 */
export interface PoseDetectionResult {
  landmarks: PoseLandmark[];
  confidence: number;
  worldLandmarks?: PoseLandmark[]; // Not used on iOS
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
 * Native iOS MediaPipe Pose Extractor
 * 
 * Uses MediaPipe Tasks Vision Pod on iOS via Expo Module.
 * Detects 33 pose landmarks on still images.
 */
export class NativeIOSPoseExtractor implements IPoseExtractor {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await PoseExtractorModule.initialize();
      this.initialized = true;
      console.log('[NativeIOSPoseExtractor] Initialized successfully');
    } catch (error) {
      console.error('Failed to initialize native iOS pose extractor:', error);
      throw new Error(`PoseExtractor initialization failed: ${error}`);
    }
  }

  async detectPose(imageUri: string): Promise<PoseDetectionResult> {
    if (!this.initialized) {
      throw new Error('PoseExtractor not initialized. Call initialize() first.');
    }

    try {
      const landmarks = await PoseExtractorModule.detectPoseFromImage(imageUri);
      
      // Calculate average confidence from visibility scores
      const confidence =
        landmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / landmarks.length;

      return {
        landmarks,
        confidence,
      };
    } catch (error) {
      console.error('Pose detection failed:', error);
      throw new Error(`Pose detection failed: ${error}`);
    }
  }

  dispose(): void {
    if (this.initialized) {
      PoseExtractorModule.dispose();
      this.initialized = false;
    }
  }
}

/**
 * Factory function to create pose extractor
 * 
 * Returns native iOS implementation on iOS, mock on other platforms.
 */
export function createPoseExtractor(): IPoseExtractor {
  if (Platform.OS === 'ios') {
    return new NativeIOSPoseExtractor();
  }
  
  // Android/other: use mock for now
  const { MockPoseExtractor } = require('./MockPoseExtractor');
  console.warn('[PoseExtractor] Using MockPoseExtractor on non-iOS platform');
  return new MockPoseExtractor();
}
