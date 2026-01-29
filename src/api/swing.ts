import { supabase } from '../lib/supabaseClient';
import { DEV_USER_ID } from '../config/devUser';

// Type definitions for swing-related tables
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

interface XpEvent {
  id: number;
  user_id: string;
  source_type: string;
  source_id: number | null;
  reason: string | null;
  xp: number;
  idempotency_key: string | null;
  occurred_at: string;
  created_at: string;
}

export interface CreateSwingCaptureInput {
  environment?: string;
  camera_angle?: string;
  pose_summary?: Record<string, unknown>;
}

export interface InsertSwingFrameInput {
  capture_id: number;
  phase: string;
  timestamp_ms?: number;
  frame_path: string;
  overlay_path?: string | null;
}

/**
 * Creates a new swing_capture record in the database.
 */
export async function createSwingCapture(
  input: CreateSwingCaptureInput
): Promise<SwingCapture> {
  const insertData = {
    user_id: DEV_USER_ID,
    status: 'uploaded',
    environment: input.environment ?? null,
    camera_angle: input.camera_angle ?? null,
    pose_summary: input.pose_summary ?? null,
  };

  const { data, error } = await supabase
    .from('swing_capture' as 'swing_capture')
    .insert(insertData as never)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create swing capture: ${error.message}`);
  if (!data) throw new Error('Failed to create swing capture: No data returned');
  return data as SwingCapture;
}

/**
 * Uploads an image blob to Supabase Storage.
 */
export async function uploadSwingImage(opts: {
  bucket: 'swing-frames' | 'swing-overlays';
  path: string;
  blob: Blob;
}): Promise<string> {
  const { data, error } = await supabase.storage
    .from(opts.bucket)
    .upload(opts.path, opts.blob, {
      upsert: true,
      contentType: opts.blob.type || 'image/webp',
    });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);
  return data.path;
}

/**
 * Inserts a swing_frame record in the database.
 */
export async function insertSwingFrame(row: InsertSwingFrameInput): Promise<void> {
  const insertData = {
    capture_id: row.capture_id,
    phase: row.phase,
    timestamp_ms: row.timestamp_ms ?? null,
    frame_path: row.frame_path,
    overlay_path: row.overlay_path ?? null,
  };

  const { error } = await supabase
    .from('swing_frame' as 'swing_frame')
    .insert(insertData as never);

  if (error) throw new Error(`Failed to insert swing frame: ${error.message}`);
}

/**
 * Invokes the swing-analysis edge function for a given capture.
 */
export async function runSwingAnalysis(captureId: number): Promise<{
  ok: boolean;
  capture_id: number;
  analysis: Record<string, unknown>;
}> {
  const { data, error } = await supabase.functions.invoke('swing-analysis', {
    body: { capture_id: captureId },
  });

  if (error) throw new Error(`Failed to run swing analysis: ${error.message}`);
  return data;
}

/**
 * Fetches the latest swing capture for the current user.
 */
export async function fetchLatestSwingCapture(): Promise<SwingCapture | null> {
  const { data, error } = await supabase
    .from('swing_capture' as 'swing_capture')
    .select('*')
    .eq('user_id', DEV_USER_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch latest swing capture: ${error.message}`);
  }
  return data as SwingCapture;
}

/**
 * Fetches swing analysis for a specific capture.
 */
export async function fetchSwingAnalysisByCapture(
  captureId: number
): Promise<SwingAnalysis | null> {
  const { data, error } = await supabase
    .from('swing_analysis' as 'swing_analysis')
    .select('*')
    .eq('capture_id', captureId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch swing analysis: ${error.message}`);
  }
  return data as SwingAnalysis;
}

/**
 * Fetches frames for a specific capture.
 */
export async function fetchSwingFrames(captureId: number): Promise<SwingFrame[]> {
  const { data, error } = await supabase
    .from('swing_frame' as 'swing_frame')
    .select('*')
    .eq('capture_id', captureId);

  if (error) throw new Error(`Failed to fetch swing frames: ${error.message}`);
  return (data || []) as SwingFrame[];
}

/**
 * Creates an XP event with idempotency protection.
 * Uses idempotency_key to prevent duplicate XP awards on retries.
 * 
 * Idempotency key patterns:
 * - capture:<captureId> - XP for capturing a swing
 * - analysis:<captureId> - XP for completing analysis
 * - challenge_complete:<challengeProgressId> - XP for challenge completion
 * - drill_complete:<drillAssignmentId> - XP for drill completion
 * - lesson_complete:<lessonProgressId> - XP for lesson completion
 */
export async function createXpEvent(opts: {
  source_type: string;
  source_id?: number;
  reason?: string;
  xp: number;
  idempotency_key: string;
}): Promise<XpEvent | null> {
  const insertData = {
    user_id: DEV_USER_ID,
    source_type: opts.source_type,
    source_id: opts.source_id ?? null,
    reason: opts.reason ?? null,
    xp: opts.xp,
    idempotency_key: opts.idempotency_key,
  };

  const { data, error } = await supabase
    .from('xp_event' as 'xp_event')
    .insert(insertData as never)
    .select('*')
    .single();

  // If duplicate key error (23505), silently return null - XP already awarded
  if (error) {
    if (error.code === '23505') {
      console.log(`XP already awarded for: ${opts.idempotency_key}`);
      return null;
    }
    throw new Error(`Failed to create XP event: ${error.message}`);
  }
  
  return data as XpEvent;
}

