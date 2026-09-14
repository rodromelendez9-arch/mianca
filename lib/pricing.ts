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
}

/** Calcula un rango de precio defendible a partir de comparables activos.
 *  Recorta el 15% superior/inferior como outliers cuando hay suficientes
 *  datos (6+); con pocos comparables usa el rango completo tal cual. */
export function calcularRangoPrecio(
  listados: Comparable[]
): RangoPrecio | null {
  const validos = listados
    .filter((l) => typeof l.price === "number" && l.price > 0)
    .sort((a, b) => a.price - b.price);

  if (validos.length < 2) return null;

  const recorte = validos.length >= 6 ? Math.floor(validos.length * 0.15) : 0;
  const recortados = validos.slice(recorte, validos.length - recorte);

  return {
    min: Math.round(recortados[0].price),
    max: Math.round(recortados[recortados.length - 1].price),
    comparables: validos.slice(0, 10),
  };
}
