import { useState, useEffect, useRef } from 'react';
import { getSwingAnalysisByCaptureId, SwingAnalysisWithCapture } from '@/api/swingAnalysis';
import { supabase } from '@/lib/supabase';
import { edgeFunctions } from '@/api/edge';
import type { Database } from '@/lib/supabaseTypes';

type SwingAnalysisRow = Database['public']['Tables']['swing_analysis']['Row'];
type SwingCaptureRow = Database['public']['Tables']['swing_capture']['Row'];
/** Result of .from('swing_analysis').select('*, swing_capture!inner(*)') — analysis row + joined capture */
type AnalysisRowWithCapture = SwingAnalysisRow & { swing_capture: SwingCaptureRow };

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const MAX_POLL_TIME_MS = 90000; // Timeout after 90 seconds

/**
 * Hook to fetch swing analysis data by capture ID with polling
 * 
 * Polls for analysis completion if not immediately available.
 * Shows analyzing status and allows retry on timeout.
 */
export function useSwingAnalysisData(captureId: number | undefined) {
  const [data, setData] = useState<SwingAnalysisWithCapture | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const fetchAnalysis = async (captureId: number): Promise<boolean> => {
    try {
      // First check if analysis exists
      const { data: analysisData, error: analysisError } = await supabase
        .from('swing_analysis')
        .select('*, swing_capture!inner(*)')
        .eq('capture_id', captureId)
        .maybeSingle();

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
        return false;
      }

      if (analysisData) {
        const row = analysisData as AnalysisRowWithCapture;
        const { swing_capture, ...analysisRow } = row;
        setData({
          analysis: analysisRow as SwingAnalysisRow,
          capture: swing_capture,
        });
        setLoading(false);
        setAnalyzing(false);
        stopPolling();
        return true;
      }

      // Check capture status (swing_capture.status: uploaded | analyzing | completed | failed)
      const { data: captureDataRaw, error: captureError } = await supabase
        .from('swing_capture')
        .select('status')
        .eq('id', captureId)
        .single();

      if (captureError) {
        console.error('Error fetching capture status:', captureError);
        return false;
      }

      const captureData = captureDataRaw as { status: string } | null;
      if (captureData?.status === 'failed') {
        setError('Analysis failed. Please try recording again.');
        setLoading(false);
        setAnalyzing(false);
        stopPolling();
        return true;
      }

      // Still analyzing
      setAnalyzing(true);
      return false;
    } catch (err: any) {
      console.error('Error in fetchAnalysis:', err);
      return false;
    }
  };

  const retryAnalysis = async () => {
    if (!captureId) return;

    setTimedOut(false);
    setError(null);
    setLoading(true);
    setAnalyzing(true);
    startTimeRef.current = Date.now();

    // Trigger analysis again
    try {
      await edgeFunctions.analyzeSwing(captureId);

      // Restart polling
      startPolling(captureId);
    } catch (err: any) {
      setError(err.message || 'Failed to retry analysis');
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const startPolling = (captureId: number) => {
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTimeRef.current;

      // Check timeout
      if (elapsed > MAX_POLL_TIME_MS) {
        stopPolling();
        setTimedOut(true);
        setError('Analysis is taking longer than expected');
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      // Poll for completion
      await fetchAnalysis(captureId);
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (!captureId) {
      setLoading(false);
      setError('No capture ID provided');
      return;
    }

    startTimeRef.current = Date.now();
    setLoading(true);
    setError(null);
    setTimedOut(false);

    // Initial fetch
    fetchAnalysis(captureId).then((complete) => {
      if (!complete) {
        // Start polling if not complete
        startPolling(captureId);
      }
    });

    return () => {
      stopPolling();
    };
  }, [captureId]);

  return { 
    data, 
    loading, 
    analyzing,
    error, 
    timedOut,
    retryAnalysis,
  };
}
