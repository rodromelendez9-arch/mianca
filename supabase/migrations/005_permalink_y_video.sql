-- ============================================================
-- Mianca — permalink de ML (para métricas/link) + video del equipo
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

alter table equipos add column if not exists ml_permalink text;
alter table equipos add column if not exists video_url text;
