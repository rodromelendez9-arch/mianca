"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useMlConnection(dealerId: string | undefined) {
  const [conectado, setConectado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealerId) {
      setLoading(false);
      return;
    }

    supabase
      .from("ml_conexiones")
      .select("dealer_id")
      .eq("dealer_id", dealerId)
      .maybeSingle()
      .then(({ data }) => {
        setConectado(Boolean(data));
        setLoading(false);
      });
  }, [dealerId]);

  return { conectado, loading };
}
