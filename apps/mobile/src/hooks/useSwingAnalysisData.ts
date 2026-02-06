import { useState, useEffect } from 'react';
import { getSwingAnalysisByCaptureId, SwingAnalysisWithCapture } from '@/api/swingAnalysis';

/**
 * Hook to fetch swing analysis data by capture ID
 * Frontend stays dumb - just fetches and renders data
 */
export function useSwingAnalysisData(captureId: number | undefined) {
  const [data, setData] = useState<SwingAnalysisWithCapture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!captureId) {
      setLoading(false);
      setError('No capture ID provided');
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getSwingAnalysisByCaptureId(captureId);
        
        if (!cancelled) {
          if (!result) {
            setError('No analysis found for this capture');
          } else {
            setData(result);
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load analysis');
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [captureId]);

  return { data, loading, error };
}
