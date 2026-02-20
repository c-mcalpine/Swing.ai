-- Storage RLS for swing capture buckets
-- Path format: {user_id}/{client_capture_id}/frame_*.jpg (or overlay_*.png)
-- Restrict so authenticated users can only INSERT/SELECT objects under their own user_id folder.

-- swing-frames: allow authenticated users to upload/read in their own folder
create policy "Users can upload swing frames to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'swing-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own swing frames"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'swing-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- swing-overlays: same for overlay images
create policy "Users can upload swing overlays to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'swing-overlays'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own swing overlays"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'swing-overlays'
  and (storage.foldername(name))[1] = auth.uid()::text
);
