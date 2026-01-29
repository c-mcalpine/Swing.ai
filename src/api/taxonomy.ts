import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseTypes';

// Type aliases for convenience
type SwingPhase = Database['public']['Tables']['swing_phase']['Row'];
type SwingMechanic = Database['public']['Tables']['swing_mechanic']['Row'];
type SwingError = Database['public']['Tables']['swing_error']['Row'];
type Drill = Database['public']['Tables']['drill']['Row'];
type CoachingCue = Database['public']['Tables']['coaching_cue']['Row'];
type Lesson = Database['public']['Tables']['lesson']['Row'];
type LessonStep = Database['public']['Tables']['lesson_step']['Row'];
type DrillMechanic = Database['public']['Tables']['drill_mechanic']['Row'];
type DrillError = Database['public']['Tables']['drill_error']['Row'];
type CueDrill = Database['public']['Tables']['cue_drill']['Row'];
type CueError = Database['public']['Tables']['cue_error']['Row'];
type ErrorMechanic = Database['public']['Tables']['error_mechanic']['Row'];
type MechanicKeyPoint = Database['public']['Tables']['mechanic_key_point']['Row'];
type MechanicTip = Database['public']['Tables']['mechanic_tip']['Row'];

export interface SwingTaxonomy {
  phases: SwingPhase[];
  mechanics: SwingMechanic[];
  errors: SwingError[];
  drills: Drill[];
  cues: CoachingCue[];
  lessons: Lesson[];
  lessonSteps: LessonStep[];
  drillMechanics: DrillMechanic[];
  drillErrors: DrillError[];
  cueDrills: CueDrill[];
  cueErrors: CueError[];
  errorMechanics: ErrorMechanic[];
  mechanicKeyPoints: MechanicKeyPoint[];
  mechanicTips: MechanicTip[];
}

/**
 * Fetches the complete swing taxonomy from Supabase.
 * This includes all phases, mechanics, errors, drills, cues, lessons, and their relationships.
 * All queries are executed in parallel for optimal performance.
 * 
 * @throws Error if any query fails
 * @returns Promise<SwingTaxonomy>
 */
export async function fetchSwingTaxonomy(): Promise<SwingTaxonomy> {
  try {
    const [
      phasesResult,
      mechanicsResult,
      errorsResult,
      drillsResult,
      cuesResult,
      lessonsResult,
      lessonStepsResult,
      drillMechanicsResult,
      drillErrorsResult,
      cueDrillsResult,
      cueErrorsResult,
      errorMechanicsResult,
      mechanicKeyPointsResult,
      mechanicTipsResult,
    ] = await Promise.all([
      supabase.from('swing_phase').select('*').order('sort_order', { ascending: true }),
      supabase.from('swing_mechanic').select('*'),
      supabase.from('swing_error').select('*'),
      supabase.from('drill').select('*'),
      supabase.from('coaching_cue').select('*'),
      supabase.from('lesson').select('*'),
      supabase.from('lesson_step').select('*').order('step_order', { ascending: true }),
      supabase.from('drill_mechanic').select('*'),
      supabase.from('drill_error').select('*'),
      supabase.from('cue_drill').select('*'),
      supabase.from('cue_error').select('*'),
      supabase.from('error_mechanic').select('*'),
      supabase.from('mechanic_key_point').select('*').order('sort_order', { ascending: true }),
      supabase.from('mechanic_tip').select('*').order('sort_order', { ascending: true }),
    ]);

    // Check for errors
    if (phasesResult.error) throw new Error(`Failed to fetch swing_phase: ${phasesResult.error.message}`);
    if (mechanicsResult.error) throw new Error(`Failed to fetch swing_mechanic: ${mechanicsResult.error.message}`);
    if (errorsResult.error) throw new Error(`Failed to fetch swing_error: ${errorsResult.error.message}`);
    if (drillsResult.error) throw new Error(`Failed to fetch drill: ${drillsResult.error.message}`);
    if (cuesResult.error) throw new Error(`Failed to fetch coaching_cue: ${cuesResult.error.message}`);
    if (lessonsResult.error) throw new Error(`Failed to fetch lesson: ${lessonsResult.error.message}`);
    if (lessonStepsResult.error) throw new Error(`Failed to fetch lesson_step: ${lessonStepsResult.error.message}`);
    if (drillMechanicsResult.error) throw new Error(`Failed to fetch drill_mechanic: ${drillMechanicsResult.error.message}`);
    if (drillErrorsResult.error) throw new Error(`Failed to fetch drill_error: ${drillErrorsResult.error.message}`);
    if (cueDrillsResult.error) throw new Error(`Failed to fetch cue_drill: ${cueDrillsResult.error.message}`);
    if (cueErrorsResult.error) throw new Error(`Failed to fetch cue_error: ${cueErrorsResult.error.message}`);
    if (errorMechanicsResult.error) throw new Error(`Failed to fetch error_mechanic: ${errorMechanicsResult.error.message}`);
    if (mechanicKeyPointsResult.error) throw new Error(`Failed to fetch mechanic_key_point: ${mechanicKeyPointsResult.error.message}`);
    if (mechanicTipsResult.error) throw new Error(`Failed to fetch mechanic_tip: ${mechanicTipsResult.error.message}`);

    return {
      phases: phasesResult.data,
      mechanics: mechanicsResult.data,
      errors: errorsResult.data,
      drills: drillsResult.data,
      cues: cuesResult.data,
      lessons: lessonsResult.data,
      lessonSteps: lessonStepsResult.data,
      drillMechanics: drillMechanicsResult.data,
      drillErrors: drillErrorsResult.data,
      cueDrills: cueDrillsResult.data,
      cueErrors: cueErrorsResult.data,
      errorMechanics: errorMechanicsResult.data,
      mechanicKeyPoints: mechanicKeyPointsResult.data,
      mechanicTips: mechanicTipsResult.data,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching swing taxonomy');
  }
}

/**
 * Helper function to get drills for a specific mechanic
 */
export function getDrillsForMechanic(taxonomy: SwingTaxonomy, mechanicId: number): Drill[] {
  const drillIds = taxonomy.drillMechanics
    .filter(dm => dm.mechanic_id === mechanicId)
    .map(dm => dm.drill_id);
  
  return taxonomy.drills.filter(drill => drillIds.includes(drill.id));
}

/**
 * Helper function to get drills for a specific error
 */
export function getDrillsForError(taxonomy: SwingTaxonomy, errorId: number): Drill[] {
  const drillIds = taxonomy.drillErrors
    .filter(de => de.error_id === errorId)
    .map(de => de.drill_id);
  
  return taxonomy.drills.filter(drill => drillIds.includes(drill.id));
}

/**
 * Helper function to get coaching cues for a specific mechanic
 */
export function getCuesForMechanic(taxonomy: SwingTaxonomy, mechanicId: number): CoachingCue[] {
  return taxonomy.cues.filter(cue => cue.mechanic_id === mechanicId);
}

/**
 * Helper function to get coaching cues for a specific error
 */
export function getCuesForError(taxonomy: SwingTaxonomy, errorId: number): CoachingCue[] {
  const cueIds = taxonomy.cueErrors
    .filter(ce => ce.error_id === errorId)
    .map(ce => ce.cue_id);
  
  return taxonomy.cues.filter(cue => cueIds.includes(cue.id));
}

/**
 * Helper function to get key points for a specific mechanic
 */
export function getKeyPointsForMechanic(taxonomy: SwingTaxonomy, mechanicId: number): MechanicKeyPoint[] {
  return taxonomy.mechanicKeyPoints.filter(kp => kp.mechanic_id === mechanicId);
}

/**
 * Helper function to get tips for a specific mechanic
 */
export function getTipsForMechanic(taxonomy: SwingTaxonomy, mechanicId: number): MechanicTip[] {
  return taxonomy.mechanicTips.filter(tip => tip.mechanic_id === mechanicId);
}

