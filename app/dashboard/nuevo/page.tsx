"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";

type EstadoGrupo = "pendiente" | "subiendo" | "analizando" | "listo" | "error";

interface Grupo {
  id: string;
  archivos: File[];
  video: File | null;
  estado: EstadoGrupo;
  error?: string;
}

function grupoVacio(): Grupo {
  return { id: crypto.randomUUID(), archivos: [], video: null, estado: "pendiente" };
}

const ETIQUETA_ESTADO: Record<EstadoGrupo, string> = {
  pendiente: "Sin procesar",
  subiendo: "Subiendo fotos…",
  analizando: "Analizando con IA…",
  listo: "Listo ✓",
  error: "Error",
};

export default function NuevoEquipoPage() {
  const { session } = useSession();
  const [grupos, setGrupos] = useState<Grupo[]>([grupoVacio()]);
  const [procesando, setProcesando] = useState(false);
  const [terminado, setTerminado] = useState(false);

  function actualizarGrupo(id: string, cambios: Partial<Grupo>) {
    setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ...cambios } : g)));
  }

  function seleccionarArchivos(id: string, files: FileList | null) {
    actualizarGrupo(id, { archivos: Array.from(files ?? []), estado: "pendiente", error: undefined });
  }

  function seleccionarVideo(id: string, files: FileList | null) {
    actualizarGrupo(id, { video: files?.[0] ?? null });
  }

  function agregarGrupo() {
    setGrupos((prev) => [...prev, grupoVacio()]);
  }

  function quitarGrupo(id: string) {
    setGrupos((prev) => (prev.length > 1 ? prev.filter((g) => g.id !== id) : prev));
  }

  async function procesarGrupo(session: Session, grupo: Grupo) {
    actualizarGrupo(grupo.id, { estado: "subiendo", error: undefined });
    try {
      const fotoUrls: string[] = [];
      for (const archivo of grupo.archivos) {
        const ruta = `${session.user.id}/${crypto.randomUUID()}-${archivo.name}`;
        const { error: subidaError } = await supabase.storage
          .from("equipos")
          .upload(ruta, archivo);
        if (subidaError) throw subidaError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("equipos").getPublicUrl(ruta);
        fotoUrls.push(publicUrl);
      }

      let videoUrl: string | null = null;
      if (grupo.video) {
        const ruta = `${session.user.id}/${crypto.randomUUID()}-${grupo.video.name}`;
        const { error: subidaError } = await supabase.storage
          .from("equipos")
          .upload(ruta, grupo.video);
        if (subidaError) throw subidaError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("equipos").getPublicUrl(ruta);
        videoUrl = publicUrl;
      }

      actualizarGrupo(grupo.id, { estado: "analizando" });
      const res = await fetch("/api/equipos/analizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fotos: fotoUrls, video: videoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error analizando el equipo");

      actualizarGrupo(grupo.id, { estado: "listo" });
    } catch (err) {
      actualizarGrupo(grupo.id, {
        estado: "error",
        error: err instanceof Error ? err.message : "Algo salió mal",
      });
    }
  }

  async function procesarTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    setProcesando(true);
    const pendientes = grupos.filter((g) => g.archivos.length > 0);
    for (const grupo of pendientes) {
      await procesarGrupo(session, grupo);
    }
    setProcesando(false);
    setTerminado(true);
  }

  const hayAlgoQueSubir = grupos.some((g) => g.archivos.length > 0);
  const huboErrores = grupos.some((g) => g.estado === "error");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold">Subir equipo</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Sube uno o varios equipos a la vez — cada uno con sus propias fotos
        (general, placa/horómetro, estado general). La IA identifica marca,
        modelo, año y horas visibles por equipo.
      </p>

      <form onSubmit={procesarTodo} className="mt-8 space-y-4">
        {grupos.map((grupo, i) => (
          <div
            key={grupo.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Equipo {i + 1}</span>
              <div className="flex items-center gap-3">
                {grupo.estado !== "pendiente" && (
                  <span
                    className={`text-xs ${
                      grupo.estado === "error"
                        ? "text-red-400"
                        : grupo.estado === "listo"
                          ? "text-emerald-400"
                          : "text-[var(--muted)]"
                    }`}
                  >
                    {ETIQUETA_ESTADO[grupo.estado]}
                  </span>
                )}
                {grupos.length > 1 && !procesando && (
                  <button
                    type="button"
                    onClick={() => quitarGrupo(grupo.id)}
                    className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
              <input
                id={`fotos-${grupo.id}`}
                type="file"
                accept="image/*"
                multiple
                disabled={procesando}
                onChange={(e) => seleccionarArchivos(grupo.id, e.target.files)}
                className="hidden"
              />
              <label htmlFor={`fotos-${grupo.id}`} className="cursor-pointer">
                <span className="text-sm font-medium text-[var(--accent)]">
                  Elegir fotos
                </span>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {grupo.archivos.length > 0
                    ? `${grupo.archivos.length} foto(s) seleccionadas`
                    : "PNG o JPG, varias a la vez"}
                </p>
              </label>
            </div>

            {grupo.archivos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {grupo.archivos.map((archivo, j) => (
                  <div
                    key={j}
                    className="aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
                  >
                    <img
                      src={URL.createObjectURL(archivo)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <input
                id={`video-${grupo.id}`}
                type="file"
                accept="video/*"
                disabled={procesando}
                onChange={(e) => seleccionarVideo(grupo.id, e.target.files)}
                className="hidden"
              />
              <label
                htmlFor={`video-${grupo.id}`}
                className="cursor-pointer text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
              >
                {grupo.video
                  ? `Video: ${grupo.video.name}`
                  : "+ Agregar video (opcional)"}
              </label>
              {grupo.video && !procesando && (
                <button
                  type="button"
                  onClick={() => actualizarGrupo(grupo.id, { video: null })}
                  className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              El video se guarda como evidencia extra del estado del equipo —
              la IA solo analiza las fotos.
            </p>

            {grupo.error && (
              <p className="mt-2 text-xs text-red-400">{grupo.error}</p>
            )}
          </div>
        ))}

        {!procesando && (
          <button
            type="button"
            onClick={agregarGrupo}
            className="w-full rounded-full border border-dashed border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            + Agregar otro equipo
          </button>
        )}

        <button
          type="submit"
          disabled={!hayAlgoQueSubir || procesando}
          className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {procesando
            ? "Procesando…"
            : `Subir y analizar (${grupos.filter((g) => g.archivos.length > 0).length})`}
        </button>

        {terminado && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
            <p className="text-sm">
              {huboErrores
                ? "Terminado, con algún error — revisa los equipos marcados arriba."
                : "Listo — todos los equipos se subieron y analizaron."}
            </p>
            <Link
              href="/dashboard"
              className="mt-2 inline-block text-sm font-medium text-[var(--accent)] underline"
            >
              Ir al dashboard
            </Link>
          </div>
        )}
      </form>
    </main>
  );
}
