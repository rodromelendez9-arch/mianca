import Anthropic from "@anthropic-ai/sdk";

export interface AnalisisEquipo {
  nombre: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  horas: number | null;
  estado_visible: string;
}

const SYSTEM_PROMPT = `Eres un tasador experto de maquinaria y equipo industrial/de construcción usado.
Se te dan fotos de un equipo. Identifica lo que puedas de forma conservadora — si algo no es
visible o no estás seguro, usa null en vez de adivinar.

Responde ÚNICAMENTE con un objeto JSON (sin texto antes ni después, sin markdown) con esta forma exacta:
{
  "nombre": string,           // nombre corto y claro del equipo, ej. "Excavadora CAT 320"
  "marca": string | null,
  "modelo": string | null,
  "anio": number | null,      // año aproximado si es identificable por el diseño/placa
  "horas": number | null,     // horas u odómetro SOLO si se ve un horómetro/tablero en la foto
  "estado_visible": string    // 1-2 frases sobre el estado/desgaste visible (óxido, golpes, llantas, etc.)
}`;

export async function analizarFotosEquipo(
  fotoUrls: string[]
): Promise<AnalisisEquipo> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...fotoUrls.map((url) => ({
            type: "image" as const,
            source: { type: "url" as const, url },
          })),
          {
            type: "text" as const,
            text: "Analiza estas fotos del equipo y responde con el JSON pedido.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("La IA no devolvió una respuesta de texto");
  }

  try {
    return JSON.parse(textBlock.text) as AnalisisEquipo;
  } catch {
    throw new Error(
      `La IA no devolvió JSON válido: ${textBlock.text.slice(0, 200)}`
    );
  }
}

export interface DatosEquipoParaAnuncio {
  nombre: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  horas: number | null;
  estadoVisible: string | null;
  precioMin: number | null;
  precioMax: number | null;
}

export interface AnuncioGenerado {
  titulo: string;
  descripcion: string;
}

const ANUNCIO_SYSTEM_PROMPT = `Eres copywriter experto en anuncios de maquinaria/equipo usado para Mercado Libre.
Escribe para convertir: claro, concreto, sin inventar datos que no se te dieron.

Responde ÚNICAMENTE con un objeto JSON (sin texto antes ni después, sin markdown):
{
  "titulo": string,       // máximo 60 caracteres, con marca+modelo+dato clave (año u horas si los hay)
  "descripcion": string   // 3-5 párrafos cortos o bullets: qué es, specs conocidas, estado, para qué sirve, por qué comprarlo. Sin emojis, sin inventar garantías/financiamiento.
}`;

export async function generarAnuncio(
  datos: DatosEquipoParaAnuncio
): Promise<AnuncioGenerado> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: ANUNCIO_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Datos del equipo:\n${JSON.stringify(datos, null, 2)}\n\nRedacta el anuncio.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("La IA no devolvió una respuesta de texto");
  }

  try {
    return JSON.parse(textBlock.text) as AnuncioGenerado;
  } catch {
    throw new Error(
      `La IA no devolvió JSON válido: ${textBlock.text.slice(0, 200)}`
    );
  }
}
