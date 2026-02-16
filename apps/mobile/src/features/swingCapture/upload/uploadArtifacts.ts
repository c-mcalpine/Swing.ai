import { File } from 'expo-file-system';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import {
  STORAGE_BUCKETS,
  getSwingFramePath,
  getSwingOverlayPath,
  getPublicUrl,
} from '@/lib/supabase/storagePaths';
import { UploadedArtifacts } from '../types/pose';

/**
 * Upload result for a single file
 */
interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

/**
 * Upload a single file to Supabase Storage
 * 
 * @param bucket - Storage bucket name
 * @param storagePath - Destination path within bucket
 * @param fileUri - Local file:// URI
 * @param contentType - MIME type
 * @returns Upload result with storage path and public URL
 */
async function uploadFile(
  bucket: string,
  storagePath: string,
  fileUri: string,
  contentType: string
): Promise<UploadResult> {
  try {
    // Read file as base64 (new expo-file-system API: File.base64())
    const file = new File(fileUri);
    const base64 = await file.base64();

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Generate public URL
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
    const publicUrl = getPublicUrl(bucket, storagePath, supabaseUrl);

    return {
      storagePath,
      publicUrl,
    };
  } catch (error) {
    console.error(`Failed to upload file to ${bucket}/${storagePath}:`, error);
    throw error;
  }
}

/**
 * Upload keyframe images to swing-frames bucket
 * 
 * @param userId - User ID for path construction
 * @param clientCaptureId - Client capture UUID for path construction (idempotent)
 * @param keyframes - Array of keyframe data with local URIs and timestamps
 * @returns Array of uploaded frame metadata
 */
export async function uploadKeyframes(
  userId: string,
  clientCaptureId: string,
  keyframes: Array<{ uri: string; timestamp_ms: number }>
): Promise<UploadedArtifacts['framePaths']> {
  const results: UploadedArtifacts['framePaths'] = [];

  for (const keyframe of keyframes) {
    const storagePath = getSwingFramePath(userId, clientCaptureId, keyframe.timestamp_ms);
    
    try {
      const { storagePath: path, publicUrl } = await uploadFile(
        STORAGE_BUCKETS.SWING_FRAMES,
        storagePath,
        keyframe.uri,
        'image/jpeg'
      );

      results.push({
        timestamp_ms: keyframe.timestamp_ms,
        storagePath: path,
        publicUrl,
      });
    } catch (error) {
      console.error(`Failed to upload keyframe at ${keyframe.timestamp_ms}ms:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Upload overlay images to swing-overlays bucket
 * 
 * @param userId - User ID for path construction
 * @param clientCaptureId - Client capture UUID for path construction (idempotent)
 * @param overlays - Array of overlay data with local URIs and timestamps
 * @returns Array of uploaded overlay metadata
 */
export async function uploadOverlays(
  userId: string,
  clientCaptureId: string,
  overlays: Array<{ uri: string; timestamp_ms: number }>
): Promise<UploadedArtifacts['overlayPaths']> {
  const results: UploadedArtifacts['overlayPaths'] = [];

  for (const overlay of overlays) {
    const storagePath = getSwingOverlayPath(userId, clientCaptureId, overlay.timestamp_ms);
    
    try {
      const { storagePath: path, publicUrl } = await uploadFile(
        STORAGE_BUCKETS.SWING_OVERLAYS,
        storagePath,
        overlay.uri,
        'image/png'
      );

      results.push({
        timestamp_ms: overlay.timestamp_ms,
        storagePath: path,
        publicUrl,
      });
    } catch (error) {
      console.error(`Failed to upload overlay at ${overlay.timestamp_ms}ms:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Upload all swing capture artifacts (frames + overlays)
 * 
 * Uses client_capture_id for idempotent upload paths that can be safely retried.
 * 
 * FAIL-FAST: Throws if ANY required upload fails. This ensures frame rows
 * are only inserted if all artifacts are successfully uploaded.
 * 
 * @param userId - User ID
 * @param clientCaptureId - Client capture UUID
 * @param keyframes - Keyframe data with URIs
 * @param overlays - Overlay data with URIs (optional)
 * @returns Complete upload results (guaranteed all uploads succeeded)
 */
export async function uploadCaptureArtifacts(
  userId: string,
  clientCaptureId: string,
  keyframes: Array<{ uri: string; timestamp_ms: number }>,
  overlays?: Array<{ uri: string; timestamp_ms: number }>
): Promise<UploadedArtifacts> {
  // Upload keyframes (will throw on failure)
  const framePaths = await uploadKeyframes(userId, clientCaptureId, keyframes);

  // Validate all frames uploaded
  if (framePaths.length !== keyframes.length) {
    throw new Error(
      `Frame upload incomplete: expected ${keyframes.length}, got ${framePaths.length}`
    );
  }

  // Upload overlays if provided (will throw on failure)
  const overlayPaths = overlays
    ? await uploadOverlays(userId, clientCaptureId, overlays)
    : [];

  // Validate all overlays uploaded (if overlays were requested)
  if (overlays && overlayPaths.length !== overlays.length) {
    throw new Error(
      `Overlay upload incomplete: expected ${overlays.length}, got ${overlayPaths.length}`
    );
  }

  return {
    framePaths,
    overlayPaths,
  };
}
