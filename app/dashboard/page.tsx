"use client";

import Link from "next/link";
import { MlConnectCard } from "@/components/ml-connect-card";
import { useEquipos, type Equipo, type EstadoEquipo } from "@/lib/use-equipos";
import { useSession } from "@/lib/use-session";

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
  return [equipo.marca, equipo.modelo, equipo.anio, equipo.horas ? `${equipo.horas.toLocaleString("es-MX")} hrs` : null]
    .filter(Boolean)
    .join(" · ");
}

export default function DashboardPage() {
  const { session } = useSession();
  const { equipos, loading } = useEquipos(session?.user.id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tu flota</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {loading ? "Cargando…" : `${equipos.length} equipo(s)`}
          </p>
        </div>
        <Link
          href="/dashboard/nuevo"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
        >
          + Subir equipo
        </Link>
      </div>

      {session && (
        <div className="mt-6">
          <MlConnectCard dealerId={session.user.id} />
        </div>
      )}

      {!loading && equipos.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted)]">
            Todavía no has subido ningún equipo.
          </p>
          <Link
            href="/dashboard/nuevo"
            className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline"
          >
            Sube el primero
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipos.map((equipo) => (
          <div
            key={equipo.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
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

            <div className="mt-4 border-t border-[var(--border)] pt-4">
              {equipo.precio_sugerido_min && equipo.precio_sugerido_max ? (
                <>
                  <p className="text-xs text-[var(--muted)]">
                    Precio sugerido · {equipo.comparables.length} comparables
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatoMoneda(equipo.precio_sugerido_min)} –{" "}
                    {formatoMoneda(equipo.precio_sugerido_max)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Aún sin valuar — falta buscar comparables.
                </p>
              )}
            </div>

            {equipo.ml_item_id && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                Publicado en Mercado Libre
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
