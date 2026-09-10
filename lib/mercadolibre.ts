/** Helpers para la integración OAuth con la API de Mercado Libre. */

const ML_AUTH_URL = "https://auth.mercadolibre.com.mx/authorization";
const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

export function getMlRedirectUri() {
  if (process.env.NEXT_PUBLIC_ML_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_ML_REDIRECT_URI;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/ml/callback`;
  }
  return "";
}

/** Construye la URL a la que se manda al dealer para autorizar Mianca en su cuenta de ML.
 *  `state` debe identificar al dealer (usamos su user id de Supabase) para poder
 *  asociar los tokens al volver del callback. */
export function buildMlAuthorizeUrl(state: string) {
  const clientId = process.env.NEXT_PUBLIC_ML_CLIENT_ID;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId ?? "",
    redirect_uri: getMlRedirectUri(),
    state,
  });
  return `${ML_AUTH_URL}?${params.toString()}`;
}

interface MlTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user_id: number;
}

/** Intercambia el `code` del callback por tokens de acceso. Solo server-side. */
export async function exchangeMlCode(
  code: string,
  redirectUri: string
): Promise<MlTokenResponse> {
  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NEXT_PUBLIC_ML_CLIENT_ID ?? "",
      client_secret: process.env.ML_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`No se pudo canjear el código de Mercado Libre: ${detalle}`);
  }

  return res.json();
}

/** Busca publicaciones activas similares en Mercado Libre para usar como comparables. */
export async function buscarComparablesMl(query: string, siteId = "MLM") {
  const params = new URLSearchParams({ q: query, limit: "20" });
  const res = await fetch(
    `https://api.mercadolibre.com/sites/${siteId}/search?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error("No se pudo buscar comparables en Mercado Libre");
  }

  const data = await res.json();
  return (data.results ?? []) as Array<{
    id: string;
    title: string;
    price: number;
    permalink: string;
    condition: string;
  }>;
}
