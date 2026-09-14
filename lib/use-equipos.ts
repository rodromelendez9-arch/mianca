"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type EstadoEquipo = "borrador" | "valuado" | "publicado";

export interface Equipo {
  id: string;
  dealer_id: string;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  horas: number | null;
  estado: EstadoEquipo;
  fotos: string[];
  precio_sugerido_min: number | null;
  precio_sugerido_max: number | null;
  comparables: unknown[];
  titulo_anuncio: string | null;
  descripcion_anuncio: string | null;
  ml_item_id: string | null;
  created_at: string;
}

export function useEquipos(dealerId: string | undefined) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);

  const recargar = useCallback(() => {
    if (!dealerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("equipos")
      .select("*")
      .eq("dealer_id", dealerId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEquipos((data as Equipo[]) ?? []);
        setLoading(false);
      });
  }, [dealerId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { equipos, loading, recargar };
}
