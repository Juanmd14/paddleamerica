-- Storage necesita permiso de lectura para borrar o reemplazar un archivo por la API:
-- sin esta política, los admins "borraban" imágenes sin error pero no se eliminaban.
-- (El público ya las ve por la URL pública del bucket, que no pasa por RLS.)
create policy "Admins ven los archivos de media"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
