import { useState, useEffect, useRef } from 'react';
import { SwingAnalysisWithCapture } from '@/api/swingAnalysis';
import { supabase } from '@/lib/supabase';
import { edgeFunctions } from '@/api/edge';
import type { Database } from '@/lib/supabaseTypes';

type SwingAnalysisRow = Database['public']['Tables']['swing_analysis']['Row'];
type SwingCaptureRow = Database['public']['Tables']['swing_capture']['Row'];
/** Result of .from('swing_analysis').select('*, swing_capture!inner(*)') — analysis row + joined capture */
type AnalysisRowWithCapture = SwingAnalysisRow & { swing_capture: SwingCaptureRow };

const POLL_DELAY_MS = 1000;
const MAX_POLL_ATTEMPTS = 20; // ~20s total

/**
 * Hook to fetch swing analysis data by capture ID with status-first polling.
 *
 * 1. Poll swing_capture.status until 'analyzed' or 'failed' (avoids race where
 *    analysis row isn't visible yet).
 * 2. When status === 'analyzed', fetch swing_analysis and render.
 * 3. When status === 'failed', show error and Retry button.
 */
export function useSwingAnalysisData(captureId: number | undefined) {
  const [data, setData] = useState<SwingAnalysisWithCapture | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const retryAnalysis = async () => {
    if (!captureId) return;
    setTimedOut(false);
    setError(null);
    setLoading(true);
    setAnalyzing(true);
    setData(null);
    try {
      await edgeFunctions.analyzeSwing(captureId);
      setRetryTrigger((t) => t + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to retry analysis');
      setLoading(false);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!captureId) {
      setLoading(false);
      setError('No capture ID provided');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setTimedOut(false);
    setData(null);

    async function load() {
      let lastStatus: string | null = null;
      for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        const { data: cap, error: capErr } = await supabase
          .from('swing_capture')
          .select('status')
          .eq('id', captureId)
          .single();

        if (cancelled) return;
        if (capErr) {
          console.error('[useSwingAnalysisData] capture status error:', capErr);
          setError('Could not load capture status');
          setLoading(false);
          setAnalyzing(false);
          return;
        }

        const status = (cap as { status: string } | null)?.status;
        lastStatus = status ?? null;

        if (status === 'analyzed') break;
        if (status === 'failed') {
          setError('Analysis failed. You can retry below.');
          setLoading(false);
          setAnalyzing(false);
          return;
        }

        setAnalyzing(true);
        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
      }

      if (cancelled) return;
      if (lastStatus !== 'analyzed') {
        setTimedOut(true);
        setError('Analysis is taking longer than expected');
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      const { data: analysisData, error: analysisError } = await supabase
        .from('swing_analysis')
        .select('*, swing_capture!inner(*)')
        .eq('capture_id', captureId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cancelled) return;
      if (analysisError || !analysisData) {
        console.error('[useSwingAnalysisData] analysis fetch error:', analysisError);
        setError(analysisError?.message || 'Analysis not found');
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      const row = analysisData as AnalysisRowWithCapture;
      const { swing_capture, ...analysisRow } = row;
      setData({
        analysis: analysisRow as SwingAnalysisRow,
        capture: swing_capture,
      });
      setLoading(false);
      setAnalyzing(false);
    }

    load().catch((e) => {
      if (!cancelled) {
        console.error('[useSwingAnalysisData] load failed', e);
        setError(e?.message || 'Something went wrong');
        setLoading(false);
        setAnalyzing(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [captureId, retryTrigger]);

  return {
    data,
    loading,
    analyzing,
    error,
    timedOut,
    retryAnalysis,
  };
}
