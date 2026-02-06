import { useState } from 'react';
import { edgeFunctions, EdgeFunctionError } from '@/api/edge';

/**
 * Hook for requesting swing analysis
 * Frontend stays dumb - all AI logic happens server-side
 */
export function useSwingAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSwing = async (captureId: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await edgeFunctions.analyzeSwing(captureId);
      setLoading(false);
      return result;
    } catch (err: any) {
      const edgeError = err as EdgeFunctionError;
      setError(edgeError.message || edgeError.error || 'Analysis failed');
      setLoading(false);
      throw err;
    }
  };

  return {
    analyzeSwing,
    loading,
    error,
  };
}
