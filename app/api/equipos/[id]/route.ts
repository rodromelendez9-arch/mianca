import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase";

const CAMPOS_EDITABLES = ["nombre", "marca", "modelo", "anio", "horas"] as const;

export async function PATCH(
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

  const body = (await req.json()) as Record<string, unknown>;
  const cambios: Record<string, unknown> = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in body) cambios[campo] = body[campo];
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data: equipo, error } = await supabase
    .from("equipos")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ equipo });
}
