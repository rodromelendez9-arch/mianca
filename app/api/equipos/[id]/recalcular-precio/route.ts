import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase";
import { MENSAJE_SIN_VALUAR, valuarEquipo } from "@/lib/valuacion";

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
    const resultado = await valuarEquipo(
      supabase,
      user.id,
      id,
      equipo.marca,
      equipo.modelo
    );

    if (!resultado.ok) {
      return NextResponse.json(
        { error: MENSAJE_SIN_VALUAR[resultado.motivo] },
        { status: 400 }
      );
    }

    return NextResponse.json({ equipo: resultado.equipo });
  } catch (err) {
    console.error("Error recalculando precio:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
