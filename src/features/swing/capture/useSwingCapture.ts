/**
 * Hook that orchestrates the complete swing capture pipeline:
 * 1. Record video locally
 * 2. Run MediaPipe pose detection
 * 3. Detect phase timestamps
 * 4. Extract keyframes
 * 5. Render pose overlays
 * 6. Upload images to storage
 * 7. Create DB records
 * 8. Invoke analysis edge function
 */
import { useState, useCallback, useRef } from 'react';
import { DEV_USER_ID } from '../../../config/devUser';
import {
  createSwingCapture,
  uploadSwingImage,
  insertSwingFrame,
  runSwingAnalysis,
  createXpEvent,
} from '../../../api/swing';
import { runPose, buildPoseSummary } from '../pose/posePipeline';
import { renderFrameWithOverlay } from '../pose/overlayRender';
import type {
  SwingPhase,
  PoseSummary,
  ExtractedKeyframe,
  SwingAnalysisResult,
  PoseTimeSeries,
} from '../types';
import { XP_REWARDS } from '../types';

/** Phases to extract keyframes for */
const KEYFRAME_PHASES: SwingPhase[] = ['address', 'top', 'impact', 'finish'];

export type CaptureStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'extracting'
  | 'uploading'
  | 'analyzing'
  | 'complete'
  | 'error';

export interface UseSwingCaptureReturn {
  status: CaptureStatus;
  progress: string;
  error: Error | null;
  captureId: number | null;
  analysis: SwingAnalysisResult | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  processVideoBlob: (blob: Blob, opts?: { environment?: string; camera_angle?: string }) => Promise<void>;
  reset: () => void;
}

export function useSwingCapture(): UseSwingCaptureReturn {
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [captureId, setCaptureId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<SwingAnalysisResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /**
   * Start recording video from camera.
   */
  const startRecording = useCallback(async () => {
    try {
      setStatus('recording');
      setProgress('Starting camera...');
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // collect data every 100ms
      setProgress('Recording...');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start recording'));
      setStatus('error');
    }
  }, []);

  /**
   * Stop recording and get video blob.
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  /**
   * Process a video blob through the full pipeline.
   */
  const processVideoBlob = useCallback(
    async (videoBlob: Blob, opts?: { environment?: string; camera_angle?: string }) => {
      try {
        setStatus('processing');
        setProgress('Running pose detection...');

        // 1. Run MediaPipe pose detection
        const poses = await runPose(videoBlob);
        
        if (poses.length === 0) {
          throw new Error('No poses detected in video');
        }

        // 2. Build pose summary
        const poseSummary = buildPoseSummary(poses);
        setProgress('Extracting keyframes...');
        setStatus('extracting');

        // 3. Extract keyframes at phase timestamps
        const keyframes = await extractKeyframes(videoBlob, poses, poseSummary);

        if (keyframes.length === 0) {
          throw new Error('Failed to extract keyframes');
        }

        setProgress('Creating capture record...');
        setStatus('uploading');

        // 4. Create swing_capture row
        const capture = await createSwingCapture({
          environment: opts?.environment,
          camera_angle: opts?.camera_angle,
          pose_summary: poseSummary as unknown as Record<string, unknown>,
        });

        setCaptureId(capture.id);

        // 5. Award XP for capture (idempotent - safe to retry)
        await createXpEvent({
          source_type: 'swing_capture',
          source_id: capture.id,
          reason: 'Swing video captured',
          xp: XP_REWARDS.SWING_CAPTURED,
          idempotency_key: `capture:${capture.id}`,
        });

        // 6. Upload frames and overlays
        setProgress('Uploading frames...');
        
        for (const kf of keyframes) {
          const framePath = `${DEV_USER_ID}/${capture.id}/${kf.phase}.webp`;
          const overlayPath = `${DEV_USER_ID}/${capture.id}/${kf.phase}_overlay.webp`;

          // Upload frame
          await uploadSwingImage({
            bucket: 'swing-frames',
            path: framePath,
            blob: kf.frameBlob,
          });

          // Upload overlay if available
          if (kf.overlayBlob) {
            await uploadSwingImage({
              bucket: 'swing-overlays',
              path: overlayPath,
              blob: kf.overlayBlob,
            });
          }

          // Insert frame row
          await insertSwingFrame({
            capture_id: capture.id,
            phase: kf.phase,
            timestamp_ms: kf.timestamp_ms,
            frame_path: framePath,
            overlay_path: kf.overlayBlob ? overlayPath : null,
          });
        }

        // 7. Invoke edge function for analysis
        setProgress('Analyzing swing...');
        setStatus('analyzing');

        const analysisResult = await runSwingAnalysis(capture.id);

        // 8. Award XP for analysis (idempotent - safe to retry)
        await createXpEvent({
          source_type: 'swing_analysis',
          source_id: capture.id,
          reason: 'Swing analyzed',
          xp: XP_REWARDS.SWING_ANALYZED,
          idempotency_key: `analysis:${capture.id}`,
        });

        setAnalysis(analysisResult as SwingAnalysisResult);
        setStatus('complete');
        setProgress('Analysis complete!');
      } catch (err) {
        console.error('Swing capture error:', err);
        setError(err instanceof Error ? err : new Error('Capture failed'));
        setStatus('error');
      }
    },
    []
  );

  /**
   * Reset state for a new capture.
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress('');
    setError(null);
    setCaptureId(null);
    setAnalysis(null);
    chunksRef.current = [];
  }, []);

  return {
    status,
    progress,
    error,
    captureId,
    analysis,
    startRecording,
    stopRecording,
    processVideoBlob,
    reset,
  };
}

/**
 * Extract keyframes from video at detected phase timestamps.
 */
async function extractKeyframes(
  videoBlob: Blob,
  poses: PoseTimeSeries,
  poseSummary: PoseSummary
): Promise<ExtractedKeyframe[]> {
  const videoUrl = URL.createObjectURL(videoBlob);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video for keyframe extraction'));
  });

  const keyframes: ExtractedKeyframe[] = [];

  for (const phase of KEYFRAME_PHASES) {
    const timestamp = poseSummary.phases[phase];
    if (timestamp === undefined) continue;

    // Find pose frame closest to this timestamp
    const poseFrame = poses.reduce((closest, current) => {
      const closestDiff = Math.abs(closest.timestamp_ms - timestamp);
      const currentDiff = Math.abs(current.timestamp_ms - timestamp);
      return currentDiff < closestDiff ? current : closest;
    }, poses[0]);

    if (!poseFrame) continue;

    // Seek video to timestamp
    video.currentTime = timestamp / 1000;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    // Render frame with overlay
    const { frameBlob, overlayBlob } = await renderFrameWithOverlay(
      video,
      poseFrame.landmarks
    );

    keyframes.push({
      phase,
      timestamp_ms: timestamp,
      frameBlob,
      overlayBlob,
    });
  }

  URL.revokeObjectURL(videoUrl);
  return keyframes;
}

