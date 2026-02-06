import { supabase } from '@/lib/supabase';
import {
  PoseSummaryV1,
  SwingFrameArtifactV1,
  KeyframeData,
  UploadedArtifacts,
} from '../types/pose';

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
 * @param club - Club used (optional)
 * @returns Inserted or existing capture ID
 */
export async function insertSwingCapture(
  userId: string,
  clientCaptureId: string,
  poseSummary: PoseSummaryV1,
  club?: string
): Promise<number> {
  try {
    // First, check if capture already exists (idempotency)
    const { data: existing, error: checkError } = await supabase
      .from('swing_capture')
      .select('id')
      .eq('user_id', userId)
      .eq('client_capture_id', clientCaptureId)
      .maybeSingle();

    if (checkError) {
      console.warn('Error checking for existing capture:', checkError);
      // Continue to insert attempt
    }

    if (existing?.id) {
      console.log(`Capture already exists with client_capture_id ${clientCaptureId}, returning existing ID ${existing.id}`);
      return existing.id;
    }

    // Insert new capture
    const { data, error } = await supabase
      .from('swing_capture')
      .insert({
        user_id: userId,
        client_capture_id: clientCaptureId,
        status: 'uploaded',
        pose_summary: poseSummary,
        club,
        captured_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        // Duplicate, fetch the existing one
        const { data: retryData, error: retryError } = await supabase
          .from('swing_capture')
          .select('id')
          .eq('user_id', userId)
          .eq('client_capture_id', clientCaptureId)
          .single();

        if (retryError || !retryData?.id) {
          throw new Error(`Failed to fetch existing capture after conflict: ${retryError?.message}`);
        }

        return retryData.id;
      }

      throw new Error(`Failed to insert swing_capture: ${error.message}`);
    }

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
        frame_number: index,
        phase: keyframe.phase,
        frame_path: framePath.storagePath,
        overlay_path: overlayPath?.storagePath || null,
        t_ms: keyframe.timestamp_ms,
        pose_data: artifact, // Store full artifact in pose_data column
      };
    });

    // Batch insert frames
    const { error } = await supabase.from('swing_frame').insert(frameRows);

    if (error) {
      throw new Error(`Failed to insert swing_frames: ${error.message}`);
    }
  } catch (error) {
    console.error('Failed to insert swing_frames:', error);
    throw error;
  }
}

/**
 * Complete capture insertion (capture + frames)
 * 
 * @param userId - User ID
 * @param poseSummary - Pose summary
 * @param keyframes - Keyframe data
 * @param uploadedArtifacts - Uploaded artifacts
 * @param club - Club used (optional)
 * @returns Inserted capture ID
 */
export async function insertCompleteCapture(
  userId: string,
  poseSummary: PoseSummaryV1,
  keyframes: KeyframeData[],
  uploadedArtifacts: UploadedArtifacts,
  club?: string
): Promise<number> {
  // Insert capture
  const captureId = await insertSwingCapture(userId, poseSummary, club);

  // Insert frames
  await insertSwingFrames(captureId, keyframes, uploadedArtifacts);

  return captureId;
}
