import { File } from 'expo-file-system';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import {
  STORAGE_BUCKETS,
  getProfilePhotoPath,
  getPublicUrl,
} from '@/lib/supabase/storagePaths';

/**
 * Upload a profile photo to Supabase Storage and return the public URL.
 * One image per user: uploads to profile-photo/{userId}/avatar.jpg with upsert
 * so replacing the photo overwrites the previous file.
 *
 * @param userId - Current user's auth id
 * @param localUri - Local file URI from ImagePicker (e.g. file:///...)
 * @returns Public URL to use as profiles.avatar_url
 */
export async function uploadProfilePhoto(
  userId: string,
  localUri: string
): Promise<string> {
  const storagePath = getProfilePhotoPath(userId);

  const file = new File(localUri);
  const base64 = await file.base64();

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PHOTO)
    .upload(storagePath, bytes, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('[API] uploadProfilePhoto error:', error);
    throw error;
  }

  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
  return getPublicUrl(STORAGE_BUCKETS.PROFILE_PHOTO, storagePath, supabaseUrl);
}
