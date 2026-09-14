-- ============================================================
-- Mianca — Guarda la descripción de estado que ya generaba la IA
-- pero que se descartaba (necesaria para redactar el anuncio).
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

alter table equipos add column if not exists estado_visible text;
