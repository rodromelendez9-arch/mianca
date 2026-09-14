import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cliente de navegador — usa la sesión del usuario logueado. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Cliente de servidor con service role — solo en route handlers / server actions. */
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/** Cliente de servidor que actúa COMO el dealer autenticado (respeta RLS),
 *  a partir del access_token que el cliente manda en el header Authorization. */
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
