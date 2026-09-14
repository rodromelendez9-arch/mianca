"use client";

import { useState } from "react";
import type { Equipo, EstadoEquipo } from "@/lib/use-equipos";

const estiloEstado: Record<EstadoEquipo, string> = {
  borrador: "bg-[var(--border)] text-[var(--muted)]",
  valuado: "bg-blue-500/15 text-blue-400",
  publicado: "bg-emerald-500/15 text-emerald-400",
};

const etiquetaEstado: Record<EstadoEquipo, string> = {
  borrador: "Falta valuar",
  valuado: "Listo para publicar",
  publicado: "Publicado",
};

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

function detalles(equipo: Equipo) {
  return [
    equipo.marca,
    equipo.modelo,
    equipo.anio,
    equipo.horas ? `${equipo.horas.toLocaleString("es-MX")} hrs` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function EquipoCard({
  equipo,
  accessToken,
  onCambio,
}: {
  equipo: Equipo;
  accessToken: string;
  onCambio: () => void;
}) {
  const [cargando, setCargando] = useState<"anuncio" | "publicar" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [mostrarComparables, setMostrarComparables] = useState(false);

  const identificacionIncierta = !equipo.marca || !equipo.modelo;

  async function generarAnuncio() {
    setCargando("anuncio");
    setError(null);
    try {
      const res = await fetch(`/api/equipos/${equipo.id}/generar-anuncio`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error generando el anuncio");
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setCargando(null);
    }
  }

  async function publicar() {
    setCargando("publicar");
    setError(null);
    try {
      const res = await fetch(`/api/equipos/${equipo.id}/publicar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error publicando el equipo");
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-3">
        {equipo.fotos[0] ? (
          <img
            src={equipo.fotos[0]}
            alt=""
            className="h-14 w-14 rounded-lg object-cover"
          />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-[var(--border)]" />
        )}
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estiloEstado[equipo.estado]}`}
        >
          {etiquetaEstado[equipo.estado]}
        </span>
      </div>

      <h2 className="mt-3 font-semibold">{equipo.nombre}</h2>
      <p className="text-sm text-[var(--muted)]">{detalles(equipo)}</p>
      {equipo.estado_visible && (
        <p className="mt-1 text-xs text-[var(--muted)]">
          {equipo.estado_visible}
        </p>
      )}

      {identificacionIncierta && (
        <p className="mt-2 text-xs text-amber-400">
          ⚠ La IA no identificó {!equipo.marca && !equipo.modelo ? "marca ni modelo" : !equipo.marca ? "la marca" : "el modelo"} con certeza — revisa los comparables antes de confiar en el precio.
        </p>
      )}

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        {equipo.precio_sugerido_min && equipo.precio_sugerido_max ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">
                Precio sugerido · {equipo.comparables.length} comparables
              </p>
              {equipo.comparables.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarComparables((v) => !v)}
                  className="text-xs text-[var(--accent)] underline"
                >
                  {mostrarComparables ? "Ocultar" : "Ver comparables"}
                </button>
              )}
            </div>
            <p className="mt-1 font-semibold">
              {formatoMoneda(equipo.precio_sugerido_min)} –{" "}
              {formatoMoneda(equipo.precio_sugerido_max)}
            </p>
            {mostrarComparables && (
              <ul className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                {equipo.comparables.map((c) => (
                  <li key={c.id} className="text-xs">
                    <a
                      href={c.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--foreground)] underline decoration-[var(--border)] hover:decoration-[var(--accent)]"
                    >
                      {c.title}
                    </a>
                    <span className="ml-2 text-[var(--muted)]">
                      {formatoMoneda(c.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aún sin valuar — conecta Mercado Libre para buscar comparables.
          </p>
        )}
      </div>

      {equipo.titulo_anuncio && (
        <p className="mt-3 text-xs text-[var(--muted)] line-clamp-1">
          &ldquo;{equipo.titulo_anuncio}&rdquo;
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        {equipo.estado === "publicado" ? (
          <p className="text-xs text-[var(--muted)]">
            Publicado en Mercado Libre
          </p>
        ) : equipo.titulo_anuncio ? (
          <button
            type="button"
            onClick={publicar}
            disabled={cargando !== null}
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {cargando === "publicar" ? "Publicando…" : "Publicar en ML"}
          </button>
        ) : equipo.precio_sugerido_min ? (
          <button
            type="button"
            onClick={generarAnuncio}
            disabled={cargando !== null}
            className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            {cargando === "anuncio" ? "Generando…" : "Generar anuncio"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
