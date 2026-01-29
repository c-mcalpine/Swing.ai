/**
 * Hook for fetching the latest swing capture and its analysis.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  fetchLatestSwingCapture,
  fetchSwingAnalysisByCapture,
  fetchSwingFrames,
} from '../api/swing';

// Type definitions matching api/swing.ts
interface SwingCapture {
  id: number;
  user_id: string;
  status: string;
  camera_angle: string | null;
  environment: string | null;
  pose_summary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface SwingFrame {
  id: number;
  capture_id: number;
  phase: string;
  timestamp_ms: number | null;
  frame_path: string;
  overlay_path: string | null;
  created_at: string;
}

interface SwingAnalysis {
  id: number;
  capture_id: number;
  user_id: string;
  // Versioning fields
  model: string;
  prompt_version: string;
  schema_version: string;
  input_fingerprint: string | null;
  // Analysis results
  raw_json: Record<string, unknown>;
  issue_scores: Record<string, number>;
  issue_confidence: Record<string, number>;
  mechanic_scores: Record<string, number>;
  club_angle_refs: Record<string, number>;
  overall_confidence: number | null;
  recommended_lesson_ids: number[] | null;
  recommended_drill_ids: number[] | null;
  created_at: string;
}

export interface SwingLatestData {
  capture: SwingCapture | null;
  analysis: SwingAnalysis | null;
  frames: SwingFrame[];
}

export interface UseSwingLatestReturn {
  data: SwingLatestData;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch the latest swing capture and its analysis for the current user.
 */
export function useSwingLatest(): UseSwingLatestReturn {
  const [data, setData] = useState<SwingLatestData>({
    capture: null,
    analysis: null,
    frames: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const capture = await fetchLatestSwingCapture();

        if (!capture) {
          if (isMounted) {
            setData({ capture: null, analysis: null, frames: [] });
          }
          return;
        }

        // Fetch analysis and frames in parallel
        const [analysis, frames] = await Promise.all([
          fetchSwingAnalysisByCapture(capture.id),
          fetchSwingFrames(capture.id),
        ]);

        if (isMounted) {
          setData({ capture, analysis, frames });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load swing data'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((t) => t + 1);
  }, []);

  return { data, loading, error, refetch };
}

/**
 * Hook to fetch a specific swing capture and its analysis by capture ID.
 */
export function useSwingCapture(captureId: number | null): UseSwingLatestReturn {
  const [data, setData] = useState<SwingLatestData>({
    capture: null,
    analysis: null,
    frames: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (captureId === null) {
      setData({ capture: null, analysis: null, frames: [] });
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch capture, analysis, and frames in parallel
        const [analysis, frames] = await Promise.all([
          fetchSwingAnalysisByCapture(captureId),
          fetchSwingFrames(captureId),
        ]);

        if (isMounted) {
          // We don't have a direct fetch for capture by ID, so we'll create a minimal one
          // or fetch it through the analysis
          setData({
            capture: null, // Would need to add fetchSwingCaptureById to api/swing.ts
            analysis,
            frames,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load swing data'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [captureId, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((t) => t + 1);
  }, []);

  return { data, loading, error, refetch };
}

