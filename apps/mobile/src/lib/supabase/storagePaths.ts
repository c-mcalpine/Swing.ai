/**
 * Supabase Storage Path Utilities
 * 
 * Single source of truth for all storage bucket paths.
 * NEVER hardcode paths elsewhere in the app.
 */

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  SWING_FRAMES: 'swing-frames',
  SWING_OVERLAYS: 'swing-overlays',
} as const;

/**
 * Generate storage path for a swing frame
 * Format: {user_id}/{client_capture_id}/frame_{timestamp_ms}.jpg
 * 
 * Using client_capture_id (UUID) instead of capture_id (int) ensures
 * upload paths are deterministic and retry-safe before DB insert.
 */
export function getSwingFramePath(
  userId: string,
  clientCaptureId: string,
  timestampMs: number
): string {
  return `${userId}/${clientCaptureId}/frame_${timestampMs}.jpg`;
}

/**
 * Generate storage path for a swing overlay
 * Format: {user_id}/{client_capture_id}/overlay_{timestamp_ms}.png
 * 
 * Using client_capture_id (UUID) instead of capture_id (int) ensures
 * upload paths are deterministic and retry-safe before DB insert.
 */
export function getSwingOverlayPath(
  userId: string,
  clientCaptureId: string,
  timestampMs: number
): string {
  return `${userId}/${clientCaptureId}/overlay_${timestampMs}.png`;
}

/**
 * Get public URL for a storage file
 */
export function getPublicUrl(bucket: string, path: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Generate signed URL for private storage access (7 days expiry)
 */
export async function getSignedUrl(
  supabase: any,
  bucket: string,
  path: string,
  expiresIn: number = 604800 // 7 days in seconds
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
