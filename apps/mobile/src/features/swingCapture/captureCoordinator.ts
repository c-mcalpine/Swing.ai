/**
 * Capture Coordinator
 * 
 * Orchestrates the complete swing capture flow:
 * 1. Extract keyframes from recorded video
 * 2. Run pose detection on keyframes
 * 3. Render overlays
 * 4. Upload artifacts to Supabase Storage
 * 5. Insert records into database
 * 6. Trigger edge function analysis
 * 7. Clean up temporary files
 */

import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { edgeFunctions } from '@/api/edge';
import {
  extractKeyframes,
  generateSwingOptimizedTimestamps,
  cleanupKeyframes,
} from './keyframes/extractKeyframes';
import { createPoseExtractor, IPoseExtractor } from './pose/PoseExtractor';
import { tagSwingPhases, calculatePoseMetrics } from './pose/poseAnalysis';
import {
  renderPoseOverlay,
  getImageDimensions,
  cleanupOverlays,
} from './overlay/renderOverlay';
import { uploadCaptureArtifacts } from './upload/uploadArtifacts';
import { insertCompleteCapture } from './database/insertCapture';
import {
  PoseSummaryV1,
  KeyframeData,
  CaptureResult,
} from './types/pose';

/**
 * Capture coordinator configuration
 */
export interface CaptureConfig {
  generateOverlays?: boolean; // Default: true
  targetFrameCount?: number; // Default: 10
  club?: string;
}

/**
 * Capture progress callback
 */
export type ProgressCallback = (stage: string, progress: number) => void;

/**
 * Generate a UUID v4 for client_capture_id
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Main capture coordinator class
 */
export class CaptureCoordinator {
  private poseExtractor: IPoseExtractor | null = null;
  private initialized = false;

  /**
   * Initialize the coordinator (must be called before processing)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.poseExtractor = createPoseExtractor();
      await this.poseExtractor.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize CaptureCoordinator:', error);
      throw new Error(`CaptureCoordinator initialization failed: ${error}`);
    }
  }

  /**
   * Process a recorded swing video
   * 
   * Complete flow from video → database → analysis with full idempotency
   * and cleanup of temp files.
   * 
   * @param videoUri - Local file:// path to recorded video
   * @param videoDurationMs - Video duration in milliseconds (if known, else will detect)
   * @param userId - User ID
   * @param config - Capture configuration
   * @param onProgress - Progress callback (optional)
   * @returns Capture ID
   */
  async processSwingCapture(
    videoUri: string,
    videoDurationMs: number | null,
    userId: string,
    config: CaptureConfig = {},
    onProgress?: ProgressCallback
  ): Promise<number> {
    if (!this.initialized || !this.poseExtractor) {
      throw new Error('CaptureCoordinator not initialized');
    }

    const { generateOverlays = true, club } = config;

    // Generate client_capture_id for idempotency
    const clientCaptureId = generateUUID();
    console.log(`Processing capture with client_capture_id: ${clientCaptureId}`);

    // Track temp files for cleanup
    const tempFiles: string[] = [];

    try {
      // Stage 0: Get real video duration if not provided
      if (!videoDurationMs) {
        onProgress?.('Analyzing video', 0.05);
        videoDurationMs = await this.getVideoDuration(videoUri);
      }

      // Stage 1: Extract keyframes
      onProgress?.('Extracting keyframes', 0.1);
      const timestamps = generateSwingOptimizedTimestamps(videoDurationMs);
      const keyframes = await extractKeyframes(videoUri, timestamps);
      tempFiles.push(...keyframes.map((kf) => kf.uri));

      // Stage 2: Run pose detection
      onProgress?.('Detecting pose', 0.3);
      const keyframeData: KeyframeData[] = [];
      
      for (let i = 0; i < keyframes.length; i++) {
        const keyframe = keyframes[i];
        
        try {
          const poseResult = await this.poseExtractor.detectPose(keyframe.uri);
          
          keyframeData.push({
            timestamp_ms: keyframe.timestamp_ms,
            phase: 'address', // Temporary, will be tagged later
            landmarks: poseResult.landmarks,
            frameUri: keyframe.uri,
          });

          onProgress?.(
            'Detecting pose',
            0.3 + (0.3 * (i + 1)) / keyframes.length
          );
        } catch (error) {
          console.error(`Pose detection failed for keyframe at ${keyframe.timestamp_ms}ms:`, error);
          // Continue with other frames instead of failing completely
        }
      }

      if (keyframeData.length === 0) {
        throw new Error('No poses detected in video. Please ensure the golfer is visible.');
      }

      // Stage 3: Tag swing phases
      onProgress?.('Analyzing swing phases', 0.6);
      const phases = tagSwingPhases(keyframeData);
      keyframeData.forEach((kf, i) => {
        kf.phase = phases[i];
      });

      // Stage 4: Render overlays (optional)
      if (generateOverlays) {
        onProgress?.('Rendering overlays', 0.65);
        
        for (let i = 0; i < keyframeData.length; i++) {
          const kf = keyframeData[i];
          const dimensions = await getImageDimensions(kf.frameUri);
          
          try {
            const overlayUri = await renderPoseOverlay(
              kf.frameUri,
              kf.landmarks,
              dimensions.width,
              dimensions.height
            );
            kf.overlayUri = overlayUri;
            tempFiles.push(overlayUri); // Track for cleanup

            onProgress?.(
              'Rendering overlays',
              0.65 + (0.1 * (i + 1)) / keyframeData.length
            );
          } catch (error) {
            console.warn(`Failed to render overlay for keyframe at ${kf.timestamp_ms}ms:`, error);
            // Continue without overlay for this frame
          }
        }
      }

      // Stage 5: Calculate metrics
      onProgress?.('Calculating metrics', 0.75);
      const metrics = calculatePoseMetrics(keyframeData);

      // Stage 6: Create pose summary
      const poseSummary: PoseSummaryV1 = {
        version: 'v1',
        extractor: 'mediapipe-pose-0.10.9',
        captured_at: new Date().toISOString(),
        total_frames: keyframes.length,
        keyframe_count: keyframeData.length,
        duration_ms: videoDurationMs,
        metrics,
        keyframes: keyframeData.map((kf) => ({
          timestamp_ms: kf.timestamp_ms,
          phase: kf.phase,
          has_overlay: !!kf.overlayUri,
        })),
      };

      // Stage 7: Insert capture record with idempotency (gets capture_id)
      onProgress?.('Creating capture record', 0.77);
      const { insertSwingCapture } = await import('./database/insertCapture');
      const captureId = await insertSwingCapture(userId, clientCaptureId, poseSummary, club);

      // Stage 8: Upload artifacts (idempotent via client_capture_id paths)
      onProgress?.('Uploading frames', 0.8);
      const uploadedArtifacts = await uploadCaptureArtifacts(
        userId,
        clientCaptureId, // Use client_capture_id for deterministic paths
        keyframeData.map((kf) => ({ uri: kf.frameUri, timestamp_ms: kf.timestamp_ms })),
        generateOverlays
          ? keyframeData
              .filter((kf) => !!kf.overlayUri)
              .map((kf) => ({ uri: kf.overlayUri!, timestamp_ms: kf.timestamp_ms }))
          : undefined
      );

      // Stage 9: Insert frame records
      onProgress?.('Saving frame data', 0.9);
      const { insertSwingFrames } = await import('./database/insertCapture');
      await insertSwingFrames(captureId, keyframeData, uploadedArtifacts);
      
      // Stage 10: Trigger analysis
      onProgress?.('Starting AI analysis', 0.95);
      try {
        await edgeFunctions.analyzeSwing({ capture_id: captureId });
      } catch (error) {
        console.error('Failed to trigger analysis:', error);
        // Don't fail the capture if analysis fails - user can retry later
      }

      // Stage 11: Clean up ALL temporary files
      onProgress?.('Cleaning up', 0.98);
      await this.cleanupTempFiles(tempFiles);

      onProgress?.('Complete', 1.0);
      return captureId;
    } catch (error) {
      console.error('Swing capture processing failed:', error);
      
      // Clean up temp files even on error
      try {
        await this.cleanupTempFiles(tempFiles);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp files after error:', cleanupError);
      }
      
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await FileSystem.deleteAsync(file, { idempotent: true });
      } catch (error) {
        console.warn(`Failed to delete temp file ${file}:`, error);
      }
    }
  }

  /**
   * Get actual video duration from URI using expo-av
   */
  async getVideoDuration(videoUri: string): Promise<number> {
    try {
      const { sound, status } = await Video.createAsync(
        { uri: videoUri },
        { shouldPlay: false }
      );
      
      if (status.isLoaded && status.durationMillis) {
        await sound.unloadAsync();
        return Math.floor(status.durationMillis);
      }
      
      await sound.unloadAsync();
      console.warn('Could not get video duration, using default');
      return 2500; // Default 2.5 seconds
    } catch (error) {
      console.warn('Failed to get video duration:', error);
      return 2500; // Default fallback
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.poseExtractor) {
      this.poseExtractor.dispose();
      this.poseExtractor = null;
      this.initialized = false;
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
let coordinatorInstance: CaptureCoordinator | null = null;

/**
 * Get or create the global coordinator instance
 */
export function getCaptureCoordinator(): CaptureCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new CaptureCoordinator();
  }
  return coordinatorInstance;
}
