-- Storage RLS for profile-photo bucket
-- Path format: {user_id}/avatar.jpg — one image per user, replaced on new upload.
-- Users can upload/update/delete only their own file; anyone can read (public avatars for leaderboards etc).
--
-- Ensure the bucket exists and is set to Public in Dashboard (Storage > profile-photo > Public)
-- so that getPublicUrl() returns a URL that works without auth.

-- Authenticated users can upload to their own folder only
create policy "Users can upload profile photo to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photo'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Required for upsert (overwrite): allow update on own folder
create policy "Users can update own profile photo"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photo'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photo'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read so avatar_url works without auth (profile screen, leaderboards)
create policy "Profile photos are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'profile-photo');

-- Users can delete their own profile photo (e.g. before replacing)
create policy "Users can delete own profile photo"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photo'
  and (storage.foldername(name))[1] = auth.uid()::text
);
