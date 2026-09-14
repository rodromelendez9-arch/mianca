import { NextRequest, NextResponse } from "next/server";
import { analizarFotosEquipo } from "@/lib/anthropic";
import { createUserClient } from "@/lib/supabase";

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

  const { fotos } = (await req.json()) as { fotos?: string[] };
  if (!fotos || fotos.length === 0) {
    return NextResponse.json(
      { error: "Sube al menos una foto" },
      { status: 400 }
    );
  }

  try {
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
        fotos,
        estado: "borrador",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ equipo, analisis });
  } catch (err) {
    console.error("Error analizando equipo:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
