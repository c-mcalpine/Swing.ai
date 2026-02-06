import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabaseTypes';

type SwingAnalysis = Database['public']['Tables']['swing_analysis']['Row'];
type SwingCapture = Database['public']['Tables']['swing_capture']['Row'];

export interface SwingAnalysisWithCapture {
  analysis: SwingAnalysis;
  capture: SwingCapture;
}

/**
 * Fetch swing analysis by capture_id
 * Uses RLS - automatically filtered by auth.uid()
 */
export async function getSwingAnalysisByCaptureId(
  captureId: number
): Promise<SwingAnalysisWithCapture | null> {
  // Fetch analysis with capture data
  const { data: analysis, error: analysisError } = await supabase
    .from('swing_analysis')
    .select('*')
    .eq('capture_id', captureId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analysisError) {
    console.error('[API] getSwingAnalysis error:', analysisError);
    throw analysisError;
  }

  if (!analysis) {
    return null;
  }

  // Fetch capture data
  const { data: capture, error: captureError } = await supabase
    .from('swing_capture')
    .select('*')
    .eq('id', captureId)
    .single();

  if (captureError) {
    console.error('[API] getSwingCapture error:', captureError);
    throw captureError;
  }

  return {
    analysis,
    capture,
  };
}

/**
 * Get list of user's swing analyses (for history screen)
 */
export async function getUserSwingAnalyses(limit: number = 10): Promise<SwingAnalysisWithCapture[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { data: analyses, error } = await supabase
    .from('swing_analysis')
    .select('*, swing_capture!inner(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[API] getUserSwingAnalyses error:', error);
    throw error;
  }

  // Transform joined data
  return (analyses || []).map(item => ({
    analysis: {
      ...item,
      swing_capture: undefined, // Remove join field
    } as unknown as SwingAnalysis,
    capture: (item as any).swing_capture as SwingCapture,
  }));
}
