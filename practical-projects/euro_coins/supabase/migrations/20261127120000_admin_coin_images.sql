-- Lets administrators add new national-side coin series from the app.
--
-- * Storage bucket "coin-images": public read (images are shown to everyone, on the web and in the
--   mobile app), but only administrators may upload or remove files. Only WebP, or JPEG where the
--   browser can't encode WebP, up to 1 MB per file.
-- * coin_series: administrators may insert new series and update existing ones (to close the
--   previous series' year range). Everyone else keeps read-only access.
--
-- Admin checks use public.is_admin(), which runs on the server, so a modified client cannot bypass them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coin-images', 'coin-images', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "coin-images insert by admins" on storage.objects;
create policy "coin-images insert by admins" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'coin-images' and public.is_admin());

-- Removing a file needs select as well; the public URLs work without it
drop policy if exists "coin-images select by admins" on storage.objects;
create policy "coin-images select by admins" on storage.objects
  for select to authenticated
  using (bucket_id = 'coin-images' and public.is_admin());

drop policy if exists "coin-images delete by admins" on storage.objects;
create policy "coin-images delete by admins" on storage.objects
  for delete to authenticated
  using (bucket_id = 'coin-images' and public.is_admin());

drop policy if exists "coin_series insert by admins" on public.coin_series;
create policy "coin_series insert by admins" on public.coin_series
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "coin_series update by admins" on public.coin_series;
create policy "coin_series update by admins" on public.coin_series
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
