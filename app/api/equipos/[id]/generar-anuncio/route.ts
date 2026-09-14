import { NextRequest, NextResponse } from "next/server";
import { generarAnuncio } from "@/lib/anthropic";
import { createUserClient } from "@/lib/supabase";

export async function POST(
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
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !equipo) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }

  try {
    const anuncio = await generarAnuncio({
      nombre: equipo.nombre,
      marca: equipo.marca,
      modelo: equipo.modelo,
      anio: equipo.anio,
      horas: equipo.horas,
      estadoVisible: equipo.estado_visible,
      precioMin: equipo.precio_sugerido_min,
      precioMax: equipo.precio_sugerido_max,
    });

    const { data: equipoActualizado, error } = await supabase
      .from("equipos")
      .update({
        titulo_anuncio: anuncio.titulo,
        descripcion_anuncio: anuncio.descripcion,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ equipo: equipoActualizado });
  } catch (err) {
    console.error("Error generando anuncio:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
