import { NextRequest, NextResponse } from "next/server";
import { obtenerMetricasMl } from "@/lib/mercadolibre";
import { getValidMlAccessToken } from "@/lib/ml-token";
import { createUserClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: equipo, error: fetchError } = await supabase
    .from("equipos")
    .select("ml_item_id")
    .eq("id", id)
    .single();

  if (fetchError || !equipo?.ml_item_id) {
    return NextResponse.json(
      { error: "Este equipo no está publicado en Mercado Libre" },
      { status: 400 }
    );
  }

  const mlToken = await getValidMlAccessToken(user.id);
  if (!mlToken) {
    return NextResponse.json(
      { error: "Conecta tu cuenta de Mercado Libre" },
      { status: 400 }
    );
  }

  try {
    const metricas = await obtenerMetricasMl(equipo.ml_item_id, mlToken);
    return NextResponse.json(metricas);
  } catch (err) {
    console.error("Error obteniendo métricas de ML:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
