import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarComparablesMl } from "@/lib/mercadolibre";
import { getValidMlAccessToken } from "@/lib/ml-token";
import { calcularRangoPrecio } from "@/lib/pricing";

export type MotivoSinValuar = "sin-datos" | "sin-conexion-ml" | "sin-comparables";

export const MENSAJE_SIN_VALUAR: Record<MotivoSinValuar, string> = {
  "sin-datos": "Agrega al menos marca o modelo para poder buscar comparables.",
  "sin-conexion-ml": "Conecta tu cuenta de Mercado Libre para buscar comparables.",
  "sin-comparables": "No se encontraron suficientes comparables en Mercado Libre.",
};

/** Busca comparables en ML con el token del dealer y actualiza el precio
 *  sugerido del equipo. Se usa tanto justo después del análisis con IA
 *  como para re-valuar un equipo ya existente (p. ej. tras editar marca/modelo). */
export async function valuarEquipo(
  supabase: SupabaseClient,
  dealerId: string,
  equipoId: string,
  marca: string | null,
  modelo: string | null
) {
  const query = [marca, modelo].filter(Boolean).join(" ");
  if (!query) {
    return { ok: false as const, motivo: "sin-datos" as const };
  }

  const mlToken = await getValidMlAccessToken(dealerId);
  if (!mlToken) {
    return { ok: false as const, motivo: "sin-conexion-ml" as const };
  }

  const listados = await buscarComparablesMl(query, mlToken);
  const rango = calcularRangoPrecio(listados);
  if (!rango) {
    return { ok: false as const, motivo: "sin-comparables" as const };
  }

  const { data: equipo, error } = await supabase
    .from("equipos")
    .update({
      precio_sugerido_min: rango.min,
      precio_sugerido_max: rango.max,
      comparables: rango.comparables,
      precio_justificacion: rango.justificacion,
      estado: "valuado",
    })
    .eq("id", equipoId)
    .select()
    .single();

  if (error) throw error;

  return { ok: true as const, equipo };
}
