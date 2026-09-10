"use client";

import { MlConnectCard } from "@/components/ml-connect-card";
import { equiposMock, type EquipmentStatus } from "@/lib/mock-data";
import { useSession } from "@/lib/use-session";

const estiloEstado: Record<EquipmentStatus, string> = {
  borrador: "bg-[var(--border)] text-[var(--muted)]",
  valuado: "bg-blue-500/15 text-blue-400",
  publicado: "bg-emerald-500/15 text-emerald-400",
};

const etiquetaEstado: Record<EquipmentStatus, string> = {
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

export default function DashboardPage() {
  const { session } = useSession();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tu flota</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {equiposMock.length} equipos · datos de ejemplo
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
        >
          + Subir equipo
        </button>
      </div>

      {session && (
        <div className="mt-6">
          <MlConnectCard dealerId={session.user.id} />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equiposMock.map((equipo) => (
          <div
            key={equipo.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{equipo.fotoPrincipal}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${estiloEstado[equipo.estado]}`}
              >
                {etiquetaEstado[equipo.estado]}
              </span>
            </div>

            <h2 className="mt-3 font-semibold">{equipo.nombre}</h2>
            <p className="text-sm text-[var(--muted)]">
              {equipo.marca} · {equipo.modelo} · {equipo.anio} ·{" "}
              {equipo.horas.toLocaleString("es-MX")} hrs
            </p>

            <div className="mt-4 border-t border-[var(--border)] pt-4">
              {equipo.precioSugeridoMin && equipo.precioSugeridoMax ? (
                <>
                  <p className="text-xs text-[var(--muted)]">
                    Precio sugerido · {equipo.comparables} comparables
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatoMoneda(equipo.precioSugeridoMin)} –{" "}
                    {formatoMoneda(equipo.precioSugeridoMax)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Aún sin valuar — sube fotos para generar el precio.
                </p>
              )}
            </div>

            {equipo.publicadoEn.length > 0 && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                Publicado en: {equipo.publicadoEn.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
