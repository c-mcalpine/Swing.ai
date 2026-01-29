import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseTypes';

type SwingDiagnostic = Database['public']['Tables']['swing_diagnostic']['Row'];
type SwingDiagnosticInsert = Database['public']['Tables']['swing_diagnostic']['Insert'];

export interface CreateDiagnosticInput {
  userId: string;
  videoUrl?: string;
  phaseScores?: Record<string, number>;
  mechanicScores?: Record<string, number>;
  errorScores?: Record<string, number>;
  recommendedLessonIds?: number[];
  recommendedDrills?: any;
}

/**
 * Creates a new swing diagnostic record in the database.
 * 
 * @param input - The diagnostic data to insert
 * @returns Promise<SwingDiagnostic> - The created diagnostic record
 * @throws Error if the insert fails
 */
export async function createSwingDiagnostic(input: CreateDiagnosticInput): Promise<SwingDiagnostic> {
  const insertData: SwingDiagnosticInsert = {
    user_id: input.userId,
    video_url: input.videoUrl || null,
    phase_scores: input.phaseScores || null,
    mechanic_scores: input.mechanicScores || null,
    error_scores: input.errorScores || null,
    recommended_lesson_ids: input.recommendedLessonIds || null,
    recommended_drills: input.recommendedDrills || null,
  };

  const { data, error } = await supabase
    .from('swing_diagnostic')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create swing diagnostic: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create swing diagnostic: No data returned');
  }

  return data;
}

/**
 * Fetches a single swing diagnostic by ID.
 * 
 * @param id - The diagnostic ID
 * @returns Promise<SwingDiagnostic | null> - The diagnostic record or null if not found
 * @throws Error if the query fails
 */
export async function fetchSwingDiagnosticById(id: number): Promise<SwingDiagnostic | null> {
  const { data, error } = await supabase
    .from('swing_diagnostic')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // Return null for "not found" errors
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch swing diagnostic: ${error.message}`);
  }

  return data;
}

/**
 * Fetches all swing diagnostics for a specific user, ordered by creation date (newest first).
 * 
 * @param userId - The user ID
 * @returns Promise<SwingDiagnostic[]> - Array of diagnostic records
 * @throws Error if the query fails
 */
export async function fetchDiagnosticsForUser(userId: string): Promise<SwingDiagnostic[]> {
  const { data, error } = await supabase
    .from('swing_diagnostic')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch diagnostics for user: ${error.message}`);
  }

  return data || [];
}

/**
 * Updates an existing swing diagnostic record.
 * 
 * @param id - The diagnostic ID to update
 * @param updates - Partial diagnostic data to update
 * @returns Promise<SwingDiagnostic> - The updated diagnostic record
 * @throws Error if the update fails
 */
export async function updateSwingDiagnostic(
  id: number,
  updates: Partial<CreateDiagnosticInput>
): Promise<SwingDiagnostic> {
  const updateData: Partial<SwingDiagnosticInsert> = {};

  if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;
  if (updates.phaseScores !== undefined) updateData.phase_scores = updates.phaseScores;
  if (updates.mechanicScores !== undefined) updateData.mechanic_scores = updates.mechanicScores;
  if (updates.errorScores !== undefined) updateData.error_scores = updates.errorScores;
  if (updates.recommendedLessonIds !== undefined) updateData.recommended_lesson_ids = updates.recommendedLessonIds;
  if (updates.recommendedDrills !== undefined) updateData.recommended_drills = updates.recommendedDrills;

  const { data, error } = await supabase
    .from('swing_diagnostic')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update swing diagnostic: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to update swing diagnostic: No data returned');
  }

  return data;
}

/**
 * Deletes a swing diagnostic record.
 * 
 * @param id - The diagnostic ID to delete
 * @returns Promise<void>
 * @throws Error if the delete fails
 */
export async function deleteSwingDiagnostic(id: number): Promise<void> {
  const { error } = await supabase
    .from('swing_diagnostic')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete swing diagnostic: ${error.message}`);
  }
}

