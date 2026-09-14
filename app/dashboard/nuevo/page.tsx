"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";

export default function NuevoEquipoPage() {
  const router = useRouter();
  const { session } = useSession();
  const [archivos, setArchivos] = useState<File[]>([]);
  const [paso, setPaso] = useState<"idle" | "subiendo" | "analizando">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  function onSeleccionarArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    setArchivos(Array.from(e.target.files ?? []));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || archivos.length === 0) return;

    setError(null);

    try {
      setPaso("subiendo");
      const fotoUrls: string[] = [];

      for (const archivo of archivos) {
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

      setPaso("analizando");
      const res = await fetch("/api/equipos/analizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fotos: fotoUrls }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error analizando el equipo");

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
      setPaso("idle");
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold">Subir equipo</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Sube varias fotos del equipo (general, placa/horómetro, estado
        general). La IA identifica marca, modelo, año y horas visibles.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <input
            id="fotos"
            type="file"
            accept="image/*"
            multiple
            onChange={onSeleccionarArchivos}
            className="hidden"
          />
          <label htmlFor="fotos" className="cursor-pointer">
            <span className="text-sm font-medium text-[var(--accent)]">
              Elegir fotos
            </span>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {archivos.length > 0
                ? `${archivos.length} foto(s) seleccionadas`
                : "PNG o JPG, varias a la vez"}
            </p>
          </label>
        </div>

        {archivos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {archivos.map((archivo, i) => (
              <div
                key={i}
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

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={archivos.length === 0 || paso !== "idle"}
          className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {paso === "subiendo" && "Subiendo fotos…"}
          {paso === "analizando" && "Analizando con IA…"}
          {paso === "idle" && "Subir y analizar"}
        </button>
      </form>
    </main>
  );
}
