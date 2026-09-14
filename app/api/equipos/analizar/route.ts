import { NextRequest, NextResponse } from "next/server";
import { analizarFotosEquipo } from "@/lib/anthropic";
import { createUserClient } from "@/lib/supabase";
import { valuarEquipo } from "@/lib/valuacion";

export async function POST(req: NextRequest) {
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

  const { fotos, video } = (await req.json()) as {
    fotos?: string[];
    video?: string | null;
  };
  if (!fotos || fotos.length === 0) {
    return NextResponse.json(
      { error: "Sube al menos una foto" },
      { status: 400 }
    );
  }

  try {
    // El video (si lo hay) solo se guarda como evidencia adicional para el
    // comprador — Claude no analiza video, solo las fotos.
    const analisis = await analizarFotosEquipo(fotos);

    const { data: equipo, error } = await supabase
      .from("equipos")
      .insert({
        dealer_id: user.id,
        nombre: analisis.nombre,
        marca: analisis.marca,
        modelo: analisis.modelo,
        anio: analisis.anio,
        horas: analisis.horas,
        estado_visible: analisis.estado_visible,
        fotos,
        video_url: video ?? null,
        estado: "borrador",
      })
      .select()
      .single();

    if (error) throw error;

    // Buscar comparables es best-effort: si falla (o el dealer no ha
    // conectado Mercado Libre todavía, o la IA no identificó marca/modelo),
    // el equipo se queda creado en borrador con los specs de la IA, y se
    // puede reintentar después (botón "Recalcular precio").
    try {
      const resultado = await valuarEquipo(
        supabase,
        user.id,
        equipo.id,
        analisis.marca,
        analisis.modelo
      );
      if (resultado.ok) {
        return NextResponse.json({ equipo: resultado.equipo, analisis });
      }
      console.log("Equipo creado sin valuar:", resultado.motivo);
    } catch (comparablesError) {
      console.error("No se pudieron buscar comparables:", comparablesError);
    }

    return NextResponse.json({ equipo, analisis });
  } catch (err) {
    console.error("Error analizando equipo:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
