import { NextRequest, NextResponse } from "next/server";
import {
  agregarDescripcionMl,
  construirAtributosMl,
  crearPublicacionMl,
  predecirCategoriaMl,
} from "@/lib/mercadolibre";
import { getValidMlAccessToken } from "@/lib/ml-token";
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

  if (!equipo.titulo_anuncio || !equipo.descripcion_anuncio) {
    return NextResponse.json(
      { error: "Primero genera el anuncio (título y descripción)" },
      { status: 400 }
    );
  }
  if (!equipo.precio_sugerido_min || !equipo.precio_sugerido_max) {
    return NextResponse.json(
      { error: "Este equipo todavía no tiene un precio sugerido" },
      { status: 400 }
    );
  }
  if (!equipo.fotos || equipo.fotos.length === 0) {
    return NextResponse.json(
      { error: "El equipo no tiene fotos" },
      { status: 400 }
    );
  }

  try {
    const mlToken = await getValidMlAccessToken(user.id);
    if (!mlToken) {
      return NextResponse.json(
        { error: "Conecta tu cuenta de Mercado Libre antes de publicar" },
        { status: 400 }
      );
    }

    const categoryId = await predecirCategoriaMl(equipo.titulo_anuncio);
    if (!categoryId) {
      return NextResponse.json(
        { error: "No se pudo determinar la categoría en Mercado Libre" },
        { status: 500 }
      );
    }

    const atributos = await construirAtributosMl(categoryId, {
      marca: equipo.marca,
      modelo: equipo.modelo,
    });

    const precio = Math.round(
      (equipo.precio_sugerido_min + equipo.precio_sugerido_max) / 2
    );

    const item = await crearPublicacionMl({
      accessToken: mlToken,
      categoryId,
      titulo: equipo.titulo_anuncio,
      precio,
      fotos: equipo.fotos,
      atributos,
    });

    await agregarDescripcionMl(item.id, mlToken, equipo.descripcion_anuncio);

    const { data: equipoActualizado, error } = await supabase
      .from("equipos")
      .update({ ml_item_id: item.id, estado: "publicado" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      equipo: equipoActualizado,
      permalink: item.permalink,
    });
  } catch (err) {
    console.error("Error publicando en Mercado Libre:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
