"use client";

import Link from "next/link";
import { EquipoCard } from "@/components/equipo-card";
import { MlConnectCard } from "@/components/ml-connect-card";
import { useEquipos } from "@/lib/use-equipos";
import { useSession } from "@/lib/use-session";

export default function DashboardPage() {
  const { session } = useSession();
  const { equipos, loading, recargar } = useEquipos(session?.user.id);

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
        {session &&
          equipos.map((equipo) => (
            <EquipoCard
              key={equipo.id}
              equipo={equipo}
              accessToken={session.access_token}
              onCambio={recargar}
            />
          ))}
      </div>
    </main>
  );
}
