import { useState, useEffect, useRef } from 'react';
import { getCaptureCoordinator } from '@/features/swingCapture';
import type { CaptureConfig, ProgressCallback } from '@/features/swingCapture';
import { useAuth } from '@/lib/AuthContext';

/**
 * Capture state
 */
export type CaptureState = 'idle' | 'processing' | 'success' | 'error';

/**
 * Hook for managing swing capture flow
 */
export function useSwingCapture() {
  const { user } = useAuth();
  const [state, setState] = useState<CaptureState>('idle');
  const [progress, setProgress] = useState<{ stage: string; percent: number }>({
    stage: '',
    percent: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [captureId, setCaptureId] = useState<number | null>(null);
  const coordinatorRef = useRef(getCaptureCoordinator());

  // Initialize coordinator on mount
  useEffect(() => {
    const init = async () => {
      try {
        await coordinatorRef.current.initialize();
      } catch (err) {
        console.error('Failed to initialize capture coordinator:', err);
        setError('Failed to initialize camera. Please restart the app.');
      }
    };
    init();
  }, []);

  /**
   * Process a recorded video
   * 
   * @param videoUri - Local file:// path to video
   * @param videoDurationMs - Video duration in ms (optional, will auto-detect if null)
   * @param config - Capture configuration
   */
  const processCapture = async (
    videoUri: string,
    videoDurationMs: number | null = null,
    config?: CaptureConfig
  ): Promise<number | null> => {
    if (!user) {
      setError('You must be logged in to capture swings');
      setState('error');
      return null;
    }

    try {
      setState('processing');
      setError(null);
      setCaptureId(null);

      const progressCallback: ProgressCallback = (stage, percent) => {
        setProgress({ stage, percent });
      };

      const id = await coordinatorRef.current.processSwingCapture(
        videoUri,
        videoDurationMs,
        user.id,
        config,
        progressCallback
      );

      setCaptureId(id);
      setState('success');
      return id;
    } catch (err: any) {
      console.error('Capture processing failed:', err);
      setError(err.message || 'Failed to process swing capture');
      setState('error');
      return null;
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setState('idle');
    setProgress({ stage: '', percent: 0 });
    setError(null);
    setCaptureId(null);
  };

  return {
    state,
    progress,
    error,
    captureId,
    processCapture,
    reset,
  };
}
