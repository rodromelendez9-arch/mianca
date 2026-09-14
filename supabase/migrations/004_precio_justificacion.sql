-- ============================================================
-- Mianca — Justificación en texto del rango de precio sugerido
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

alter table equipos add column if not exists precio_justificacion text;
