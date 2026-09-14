import { NextRequest, NextResponse } from "next/server";
import { analizarFotosEquipo } from "@/lib/anthropic";
import { buscarComparablesMl } from "@/lib/mercadolibre";
import { getValidMlAccessToken } from "@/lib/ml-token";
import { calcularRangoPrecio } from "@/lib/pricing";
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
        estado_visible: analisis.estado_visible,
        fotos,
        estado: "borrador",
      })
      .select()
      .single();

    if (error) throw error;

    // Buscar comparables es best-effort: si falla (o el dealer no ha
    // conectado Mercado Libre todavía — ML exige token de usuario incluso
    // para buscar), el equipo se queda creado en borrador con los specs de
    // la IA, y se puede reintentar después.
    const query = [analisis.marca, analisis.modelo].filter(Boolean).join(" ");
    if (query) {
      try {
        const mlToken = await getValidMlAccessToken(user.id);
        if (!mlToken) {
          console.log(
            "Dealer sin conexión a Mercado Libre — se omite búsqueda de comparables"
          );
          return NextResponse.json({ equipo, analisis });
        }

        const listados = await buscarComparablesMl(query, mlToken);
        const rango = calcularRangoPrecio(listados);

        if (rango) {
          const { data: equipoActualizado } = await supabase
            .from("equipos")
            .update({
              precio_sugerido_min: rango.min,
              precio_sugerido_max: rango.max,
              comparables: rango.comparables,
              estado: "valuado",
            })
            .eq("id", equipo.id)
            .select()
            .single();

          if (equipoActualizado) {
            return NextResponse.json({ equipo: equipoActualizado, analisis });
          }
        }
      } catch (comparablesError) {
        console.error("No se pudieron buscar comparables:", comparablesError);
      }
    }

    return NextResponse.json({ equipo, analisis });
  } catch (err) {
    console.error("Error analizando equipo:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
