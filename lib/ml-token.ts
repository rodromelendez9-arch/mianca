import { refreshMlToken } from "@/lib/mercadolibre";
import { createServerClient } from "@/lib/supabase";

const MARGEN_MS = 60_000;

/** Devuelve un access_token de ML válido para el dealer, refrescándolo si
 *  ya venció. Devuelve null si el dealer no ha conectado su cuenta de ML. */
export async function getValidMlAccessToken(
  dealerId: string
): Promise<string | null> {
  const admin = createServerClient();

  const { data: conexion } = await admin
    .from("ml_conexiones")
    .select("*")
    .eq("dealer_id", dealerId)
    .maybeSingle();

  if (!conexion) return null;

  const expiraEn = new Date(conexion.expires_at).getTime();
  if (Date.now() < expiraEn - MARGEN_MS) {
    return conexion.access_token;
  }

  const tokens = await refreshMlToken(conexion.refresh_token);

  await admin
    .from("ml_conexiones")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("dealer_id", dealerId);

  return tokens.access_token;
}
