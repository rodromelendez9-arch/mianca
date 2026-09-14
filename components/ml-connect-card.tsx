"use client";

import { useSearchParams } from "next/navigation";
import { buildMlAuthorizeUrl } from "@/lib/mercadolibre";
import { useMlConnection } from "@/lib/use-ml-connection";

export function MlConnectCard({ dealerId }: { dealerId: string }) {
  const { conectado, loading } = useMlConnection(dealerId);
  const params = useSearchParams();
  const resultado = params.get("ml");

  async function conectar() {
    window.location.href = await buildMlAuthorizeUrl(dealerId);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Mercado Libre</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {loading
              ? "Comprobando conexión…"
              : conectado
                ? "Cuenta conectada — ya puedes publicar equipos directo desde Mianca."
                : "Conecta tu cuenta para publicar tus valuaciones sin salir de Mianca."}
          </p>
          {resultado === "conectado" && (
            <p className="mt-2 text-sm text-emerald-400">
              ✓ Conexión exitosa con Mercado Libre.
            </p>
          )}
          {resultado === "error" && (
            <p className="mt-2 text-sm text-red-400">
              No se pudo completar la conexión. Intenta de nuevo.
            </p>
          )}
          {resultado === "rechazado" && (
            <p className="mt-2 text-sm text-amber-400">
              Cancelaste la autorización en Mercado Libre.
            </p>
          )}
        </div>

        {!loading && !conectado && (
          <button
            onClick={conectar}
            type="button"
            className="shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Conectar
          </button>
        )}
        {!loading && conectado && (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400">
            Conectado
          </span>
        )}
      </div>
    </div>
  );
}
