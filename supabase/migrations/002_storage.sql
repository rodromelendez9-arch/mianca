-- ============================================================
-- Mianca — Storage para fotos de equipo
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

insert into storage.buckets (id, name, public)
values ('equipos', 'equipos', true)
on conflict (id) do nothing;

-- Cada dealer sube sus fotos bajo una carpeta con su propio user id:
-- equipos/<dealer_id>/<archivo>
create policy "Dealers suben sus propias fotos"
on storage.objects for insert
with check (
  bucket_id = 'equipos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Fotos de equipos son públicas para lectura"
on storage.objects for select
using (bucket_id = 'equipos');

create policy "Dealers borran sus propias fotos"
on storage.objects for delete
using (
  bucket_id = 'equipos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
