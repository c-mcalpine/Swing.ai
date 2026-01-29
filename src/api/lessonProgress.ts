import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseTypes';

type UserLessonProgress = Database['public']['Tables']['user_lesson_progress']['Row'];
type Lesson = Database['public']['Tables']['lesson']['Row'];
type UserReviewEvent = Database['public']['Tables']['user_review_event']['Row'];

export interface LessonProgressWithLesson extends UserLessonProgress {
  lesson: Lesson;
}

/**
 * Fetches the recommended daily lesson for a user.
 * Returns the next due lesson or the one with highest priority.
 * 
 * @param userId - The user's ID
 * @returns Promise<LessonProgressWithLesson | null>
 * @throws Error if the query fails
 */
export async function fetchDailyLesson(userId: string): Promise<LessonProgressWithLesson | null> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select(`
      *,
      lesson:lesson_id (*)
    `)
    .eq('user_id', userId)
    .or('status.eq.in_progress,status.is.null')
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No lesson found
    }
    throw new Error(`Failed to fetch daily lesson: ${error.message}`);
  }

  return {
    ...data,
    lesson: Array.isArray(data.lesson) ? data.lesson[0] : data.lesson
  } as LessonProgressWithLesson;
}

/**
 * Fetches the "up next" lesson for Smart Review screen.
 * Prioritizes in_progress lessons, then due lessons.
 * 
 * @param userId - The user's ID
 * @returns Promise<LessonProgressWithLesson | null>
 * @throws Error if the query fails
 */
export async function fetchUpNextLesson(userId: string): Promise<LessonProgressWithLesson | null> {
  // First try to get in_progress lesson
  const { data: inProgressData, error: inProgressError } = await supabase
    .from('user_lesson_progress')
    .select(`
      *,
      lesson:lesson_id (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('last_practiced_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (inProgressError) {
    throw new Error(`Failed to fetch up next lesson: ${inProgressError.message}`);
  }

  if (inProgressData) {
    return {
      ...inProgressData,
      lesson: Array.isArray(inProgressData.lesson) ? inProgressData.lesson[0] : inProgressData.lesson
    } as LessonProgressWithLesson;
  }

  // If no in_progress, get next due lesson
  return fetchDailyLesson(userId);
}

/**
 * Fetches the review timeline/events for a user.
 * 
 * @param userId - The user's ID
 * @returns Promise<UserReviewEvent[]>
 * @throws Error if the query fails
 */
export async function fetchReviewTimeline(userId: string): Promise<UserReviewEvent[]> {
  const { data, error } = await supabase
    .from('user_review_event')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('occurred_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch review timeline: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches all lesson progress for a user.
 * 
 * @param userId - The user's ID
 * @returns Promise<UserLessonProgress[]>
 * @throws Error if the query fails
 */
export async function fetchUserLessonProgress(userId: string): Promise<UserLessonProgress[]> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user lesson progress: ${error.message}`);
  }

  return data || [];
}

/**
 * Updates lesson progress.
 * 
 * @param progressId - The progress record ID
 * @param updates - Partial progress data to update
 * @returns Promise<UserLessonProgress>
 * @throws Error if the update fails
 */
export async function updateLessonProgress(
  progressId: number,
  updates: Partial<Database['public']['Tables']['user_lesson_progress']['Update']>
): Promise<UserLessonProgress> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .update(updates)
    .eq('id', progressId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lesson progress: ${error.message}`);
  }

  return data;
}

/**
 * Creates a new lesson progress record for a user.
 * 
 * @param input - Progress data to insert
 * @returns Promise<UserLessonProgress>
 * @throws Error if the insert fails
 */
export async function createLessonProgress(
  input: Database['public']['Tables']['user_lesson_progress']['Insert']
): Promise<UserLessonProgress> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lesson progress: ${error.message}`);
  }

  return data;
}

