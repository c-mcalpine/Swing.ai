import { supabase } from '@/lib/supabase';
import {
  PoseSummaryV1,
  SwingFrameArtifactV1,
  KeyframeData,
  UploadedArtifacts,
} from '../types/pose';

/** Per database_design: swing_capture has id, user_id, status, camera_angle, environment, pose_summary, created_at, updated_at, client_capture_id */
type SwingCaptureIdRow = { id: number };

/**
 * Insert swing_capture record with idempotency
 * 
 * Uses client_capture_id as idempotency key to prevent duplicate captures
 * from retries. If a capture with the same client_capture_id already exists,
 * returns the existing ID instead of creating a duplicate.
 * 
 * @param userId - User ID
 * @param clientCaptureId - Client-generated UUID for idempotency
 * @param poseSummary - Pose summary data (compact!)
 * @returns Inserted or existing capture ID
 */
export async function insertSwingCapture(
  userId: string,
  clientCaptureId: string,
  poseSummary: PoseSummaryV1
): Promise<number> {
  try {
    // First, check if capture already exists (idempotency)
    const { data: existingRaw, error: checkError } = await supabase
      .from('swing_capture')
      .select('id')
      .eq('user_id', userId)
      .eq('client_capture_id', clientCaptureId)
      .maybeSingle();

    if (checkError) {
      console.warn('Error checking for existing capture:', checkError);
      // Continue to insert attempt
    }

    const existing = existingRaw as SwingCaptureIdRow | null;
    if (existing?.id) {
      console.log(`Capture already exists with client_capture_id ${clientCaptureId}, returning existing ID ${existing.id}`);
      return existing.id;
    }

    // Insert new capture (schema: user_id, client_capture_id, status, pose_summary; no club/captured_at)
    const { data: insertData, error } = await (supabase.from('swing_capture') as any)
      .insert({
        user_id: userId,
        client_capture_id: clientCaptureId,
        status: 'uploaded',
        pose_summary: poseSummary,
      })
      .select('id')
      .single();

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        // Duplicate, fetch the existing one
        const { data: retryRaw, error: retryError } = await supabase
          .from('swing_capture')
          .select('id')
          .eq('user_id', userId)
          .eq('client_capture_id', clientCaptureId)
          .single();

        const retryData = retryRaw as SwingCaptureIdRow | null;
        if (retryError || !retryData?.id) {
          throw new Error(`Failed to fetch existing capture after conflict: ${retryError?.message}`);
        }

        return retryData.id;
      }

      throw new Error(`Failed to insert swing_capture: ${error.message}`);
    }

    const data = insertData as SwingCaptureIdRow | null;
    if (!data?.id) {
      throw new Error('Capture ID not returned from insert');
    }

    return data.id;
  } catch (error) {
    console.error('Failed to insert swing_capture:', error);
    throw error;
  }
}

/**
 * Insert swing_frame records
 * 
 * @param captureId - Capture ID
 * @param keyframes - Keyframe data with phases and landmarks
 * @param uploadedArtifacts - Uploaded frame/overlay paths
 */
export async function insertSwingFrames(
  captureId: number,
  keyframes: KeyframeData[],
  uploadedArtifacts: UploadedArtifacts
): Promise<void> {
  try {
    // Build frame rows
    const frameRows = keyframes.map((keyframe, index) => {
      const framePath = uploadedArtifacts.framePaths.find(
        (f) => f.timestamp_ms === keyframe.timestamp_ms
      );
      const overlayPath = uploadedArtifacts.overlayPaths.find(
        (o) => o.timestamp_ms === keyframe.timestamp_ms
      );

      if (!framePath) {
        throw new Error(`No uploaded frame found for timestamp ${keyframe.timestamp_ms}ms`);
      }

      // Create frame artifact
      const artifact: SwingFrameArtifactV1 = {
        version: 'v1',
        timestamp_ms: keyframe.timestamp_ms,
        phase: keyframe.phase,
        landmarks: keyframe.landmarks,
      };

      return {
        capture_id: captureId,
        phase: keyframe.phase,
        frame_path: framePath.storagePath,
        overlay_path: overlayPath?.storagePath || null,
        timestamp_ms: keyframe.timestamp_ms,
        pose_data: artifact,
      };
    });

    // Batch insert frames (schema: capture_id, phase, frame_path, overlay_path, timestamp_ms, pose_data)
    const { error } = await (supabase.from('swing_frame') as any).insert(frameRows);

    if (error) {
      throw new Error(`Failed to insert swing_frames: ${error.message}`);
    }
  } catch (error) {
    console.error('Failed to insert swing_frames:', error);
    throw error;
  }
}

/**
 * Mark a capture as failed (e.g. after upload or frame insert failure).
 * Ensures no orphan capture rows stay in 'uploaded' with missing frames.
 */
export async function markCaptureFailed(captureId: number): Promise<void> {
  try {
    await (supabase.from('swing_capture') as any)
      .update({ status: 'failed' })
      .eq('id', captureId);
  } catch (err) {
    console.error('Failed to mark capture as failed:', err);
  }
}
