export interface Comparable {
  id: string;
  title: string;
  price: number;
  permalink: string;
}

export interface RangoPrecio {
  min: number;
  max: number;
  comparables: Comparable[];
  justificacion: string;
}

/** Calcula un rango de precio defendible a partir de comparables activos.
 *  Recorta el 15% superior/inferior como outliers cuando hay suficientes
 *  datos (6+); con pocos comparables usa el rango completo tal cual.
 *  `comparables` en el resultado son justo los que se usaron para el rango
 *  (ya sin los recortados), no una muestra aparte. */
export function calcularRangoPrecio(
  listados: Comparable[]
): RangoPrecio | null {
  const validos = listados
    .filter((l) => typeof l.price === "number" && l.price > 0)
    .sort((a, b) => a.price - b.price);

  if (validos.length < 2) return null;

  const recorte = validos.length >= 6 ? Math.floor(validos.length * 0.15) : 0;
  const recortados = validos.slice(recorte, validos.length - recorte);

  const justificacion =
    recorte > 0
      ? `Basado en ${validos.length} publicaciones activas similares en Mercado Libre — se usaron las ${recortados.length} de precio más representativo, descartando las más altas y más bajas como posibles atípicos.`
      : `Basado en ${validos.length} publicación${validos.length === 1 ? "" : "es"} activa${validos.length === 1 ? "" : "s"} similar${validos.length === 1 ? "" : "es"} en Mercado Libre.`;

  return {
    min: Math.round(recortados[0].price),
    max: Math.round(recortados[recortados.length - 1].price),
    comparables: recortados,
    justificacion,
  };
}
