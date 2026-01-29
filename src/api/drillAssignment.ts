import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseTypes';

type UserDrillAssignment = Database['public']['Tables']['user_drill_assignment']['Row'];
type Drill = Database['public']['Tables']['drill']['Row'];

export interface DrillAssignmentWithDrill extends UserDrillAssignment {
  drill: Drill;
}

/**
 * Fetches quick drills for home screen (active drills that are due or highest priority).
 * 
 * @param userId - The user's ID
 * @param limit - Number of drills to return (default: 2)
 * @returns Promise<DrillAssignmentWithDrill[]>
 * @throws Error if the query fails
 */
export async function fetchQuickDrills(
  userId: string,
  limit: number = 2
): Promise<DrillAssignmentWithDrill[]> {
  const { data, error } = await supabase
    .from('user_drill_assignment')
    .select(`
      *,
      drill:drill_id (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('status', ['active', 'paused'])
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch quick drills: ${error.message}`);
  }

  return (data || []).map(item => ({
    ...item,
    drill: Array.isArray(item.drill) ? item.drill[0] : item.drill
  })) as DrillAssignmentWithDrill[];
}

/**
 * Fetches all drill assignments for a user.
 * 
 * @param userId - The user's ID
 * @returns Promise<DrillAssignmentWithDrill[]>
 * @throws Error if the query fails
 */
export async function fetchAssignedDrills(userId: string): Promise<DrillAssignmentWithDrill[]> {
  const { data, error } = await supabase
    .from('user_drill_assignment')
    .select(`
      *,
      drill:drill_id (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch assigned drills: ${error.message}`);
  }

  return (data || []).map(item => ({
    ...item,
    drill: Array.isArray(item.drill) ? item.drill[0] : item.drill
  })) as DrillAssignmentWithDrill[];
}

/**
 * Assigns a drill to a user.
 * 
 * @param userId - The user's ID
 * @param drillId - The drill ID to assign
 * @param options - Optional assignment options
 * @returns Promise<UserDrillAssignment>
 * @throws Error if the insert fails
 */
export async function assignDrill(
  userId: string,
  drillId: number,
  options?: {
    status?: string;
    dueAt?: string;
    sortOrder?: number;
  }
): Promise<UserDrillAssignment> {
  const insertData: Database['public']['Tables']['user_drill_assignment']['Insert'] = {
    user_id: userId,
    drill_id: drillId,
    status: options?.status || 'active',
    due_at: options?.dueAt || null,
    is_active: true,
    sort_order: options?.sortOrder || null,
  };

  const { data, error } = await supabase
    .from('user_drill_assignment')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign drill: ${error.message}`);
  }

  return data;
}

/**
 * Updates a drill assignment.
 * 
 * @param assignmentId - The assignment ID
 * @param updates - Partial assignment data to update
 * @returns Promise<UserDrillAssignment>
 * @throws Error if the update fails
 */
export async function updateDrillAssignment(
  assignmentId: number,
  updates: Partial<Database['public']['Tables']['user_drill_assignment']['Update']>
): Promise<UserDrillAssignment> {
  const { data, error } = await supabase
    .from('user_drill_assignment')
    .update(updates)
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update drill assignment: ${error.message}`);
  }

  return data;
}

/**
 * Marks a drill as completed/mastered.
 * 
 * @param assignmentId - The assignment ID
 * @returns Promise<UserDrillAssignment>
 * @throws Error if the update fails
 */
export async function completeDrill(assignmentId: number): Promise<UserDrillAssignment> {
  return updateDrillAssignment(assignmentId, {
    status: 'mastered',
    last_practiced_at: new Date().toISOString(),
  });
}

/**
 * Deactivates a drill assignment.
 * 
 * @param assignmentId - The assignment ID
 * @returns Promise<void>
 * @throws Error if the update fails
 */
export async function deactivateDrill(assignmentId: number): Promise<void> {
  const { error } = await supabase
    .from('user_drill_assignment')
    .update({ is_active: false })
    .eq('id', assignmentId);

  if (error) {
    throw new Error(`Failed to deactivate drill: ${error.message}`);
  }
}

