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

function base64url(bytes: Uint8Array): string {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDeTexto(texto: string): string {
  return base64url(new TextEncoder().encode(texto));
}

function textoDeBase64url(valor: string): string {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

/** La app de ML quedó configurada con PKCE obligatorio (Authorization Code + PKCE),
 *  así que armamos code_verifier/code_challenge nosotros. El code_verifier viaja
 *  metido en `state` (junto con el dealer_id) porque el callback es un request
 *  server-side distinto al que inició el flujo — no hay sesión/cookie que compartir. */
export async function buildMlAuthorizeUrl(dealerId: string): Promise<string> {
  const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier)
  );
  const codeChallenge = base64url(new Uint8Array(hash));

  const state = base64urlDeTexto(JSON.stringify({ dealerId, codeVerifier }));

  const clientId = process.env.NEXT_PUBLIC_ML_CLIENT_ID;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId ?? "",
    redirect_uri: getMlRedirectUri(),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${ML_AUTH_URL}?${params.toString()}`;
}

/** Decodifica el `state` que arma buildMlAuthorizeUrl. */
export function parseMlState(state: string): {
  dealerId: string;
  codeVerifier: string;
} {
  return JSON.parse(textoDeBase64url(state));
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
  redirectUri: string,
  codeVerifier: string
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
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`No se pudo canjear el código de Mercado Libre: ${detalle}`);
  }

  return res.json();
}

/** Refresca un access_token vencido usando el refresh_token guardado. */
export async function refreshMlToken(
  refreshToken: string
): Promise<MlTokenResponse> {
  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.NEXT_PUBLIC_ML_CLIENT_ID ?? "",
      client_secret: process.env.ML_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`No se pudo refrescar el token de Mercado Libre: ${detalle}`);
  }

  return res.json();
}

/** Busca publicaciones activas similares en Mercado Libre para usar como comparables.
 *  ML exige un access_token de usuario real (no de app) incluso para buscar —
 *  se usa el token del dealer que conectó su cuenta. */
export async function buscarComparablesMl(
  query: string,
  accessToken: string,
  siteId = "MLM"
) {
  const params = new URLSearchParams({ q: query, limit: "20" });
  const res = await fetch(
    `https://api.mercadolibre.com/sites/${siteId}/search?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
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

/** Predice la categoría de ML más probable para un texto (título del anuncio). */
export async function predecirCategoriaMl(
  texto: string,
  siteId = "MLM"
): Promise<string | null> {
  const params = new URLSearchParams({ q: texto, limit: "1" });
  const res = await fetch(
    `https://api.mercadolibre.com/sites/${siteId}/domain_discovery/search?${params.toString()}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ category_id: string }>;
  return data[0]?.category_id ?? null;
}

interface AtributoCategoria {
  id: string;
  tags?: { required?: boolean };
}

/** Arma los atributos obligatorios que sabemos llenar (marca/modelo/condición);
 *  el resto de obligatorios que no podamos deducir los deja fuera — ML los
 *  reportará como faltantes en la respuesta si aplica. */
export async function construirAtributosMl(
  categoryId: string,
  datos: { marca?: string | null; modelo?: string | null }
): Promise<Array<{ id: string; value_name: string }>> {
  const res = await fetch(
    `https://api.mercadolibre.com/categories/${categoryId}/attributes`
  );
  if (!res.ok) return [];
  const atributos = (await res.json()) as AtributoCategoria[];

  const valoresConocidos: Record<string, string | null | undefined> = {
    BRAND: datos.marca,
    MODEL: datos.modelo,
    ITEM_CONDITION: "Usado",
  };

  return atributos
    .filter((a) => a.tags?.required && valoresConocidos[a.id])
    .map((a) => ({ id: a.id, value_name: valoresConocidos[a.id] as string }));
}

interface PublicarMlInput {
  accessToken: string;
  categoryId: string;
  titulo: string;
  precio: number;
  fotos: string[];
  atributos: Array<{ id: string; value_name: string }>;
}

/** Crea la publicación en Mercado Libre. Primer intento real de integración:
 *  categorías con atributos obligatorios que no cubrimos arriba devolverán
 *  400 listando justo lo que falta — es esperable iterar sobre esto. */
export async function crearPublicacionMl(input: PublicarMlInput) {
  const res = await fetch("https://api.mercadolibre.com/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      title: input.titulo.slice(0, 60),
      category_id: input.categoryId,
      price: input.precio,
      currency_id: "MXN",
      available_quantity: 1,
      buying_mode: "buy_it_now",
      condition: "used",
      listing_type_id: "gold_special",
      pictures: input.fotos.map((url) => ({ source: url })),
      attributes: input.atributos,
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Mercado Libre rechazó la publicación: ${JSON.stringify(body)}`);
  }
  return body as { id: string; permalink: string };
}

export async function agregarDescripcionMl(
  itemId: string,
  accessToken: string,
  descripcion: string
) {
  const res = await fetch(
    `https://api.mercadolibre.com/items/${itemId}/description`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ plain_text: descripcion }),
    }
  );
  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`No se pudo guardar la descripción: ${detalle}`);
  }
}
