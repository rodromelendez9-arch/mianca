import { NextRequest, NextResponse } from "next/server";
import { exchangeMlCode, getMlRedirectUri } from "@/lib/mercadolibre";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const dealerId = searchParams.get("state");
  const mlError = searchParams.get("error");

  if (mlError) {
    return NextResponse.redirect(`${origin}/dashboard?ml=rechazado`);
  }

  if (!code || !dealerId) {
    return NextResponse.redirect(`${origin}/dashboard?ml=error`);
  }

  try {
    const redirectUri =
      process.env.NEXT_PUBLIC_ML_REDIRECT_URI ??
      getMlRedirectUri() ??
      `${origin}/api/ml/callback`;

    const tokens = await exchangeMlCode(code, redirectUri);

    const supabaseAdmin = createServerClient();
    const { error } = await supabaseAdmin.from("ml_conexiones").upsert({
      dealer_id: dealerId,
      ml_user_id: String(tokens.user_id),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.redirect(`${origin}/dashboard?ml=conectado`);
  } catch (err) {
    console.error("Error en callback de Mercado Libre:", err);
    return NextResponse.redirect(`${origin}/dashboard?ml=error`);
  }
}
