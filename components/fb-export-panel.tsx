"use client";

import { useState } from "react";
import type { Equipo } from "@/lib/use-equipos";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

/** Facebook Marketplace no tiene API pública para crear publicaciones —
 *  esto arma el texto ya listo para copiar/pegar a mano en su formulario. */
export function FbExportPanel({ equipo }: { equipo: Equipo }) {
  const [copiado, setCopiado] = useState(false);

  if (!equipo.titulo_anuncio || !equipo.descripcion_anuncio) return null;

  const precio =
    equipo.precio_sugerido_min && equipo.precio_sugerido_max
      ? Math.round((equipo.precio_sugerido_min + equipo.precio_sugerido_max) / 2)
      : null;

  const texto = [
    equipo.titulo_anuncio,
    precio ? `Precio: ${formatoMoneda(precio)}` : null,
    "",
    equipo.descripcion_anuncio,
  ]
    .filter((v) => v !== null)
    .join("\n");

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="mt-3 rounded-lg border border-[var(--border)] p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">Para Facebook Marketplace</p>
        <button
          type="button"
          onClick={copiar}
          className="text-xs text-[var(--accent)] underline"
        >
          {copiado ? "Copiado ✓" : "Copiar texto"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        FB no tiene forma de publicar esto automático — copia el texto y
        pégalo tú al crear el artículo en Marketplace. Las fotos están en la
        tarjeta de arriba, guárdalas y súbelas ahí también.
      </p>
      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-black/20 p-2 text-xs text-[var(--muted)]">
        {texto}
      </pre>
    </div>
  );
}
