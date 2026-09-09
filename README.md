# Mianca

Herramienta de **valuación y generación de anuncios asistida por IA** para equipo (construcción, industrial, agrícola, etc.). En vez de competir como marketplace de dos lados, Mianca resuelve un dolor puntual: la gente sub-precia o sobre-precia su equipo por falta de buenos comparables, y luego pierde tiempo armando un anuncio decente.

## Problema

Quien vende maquinaria/equipo usado (excavadoras, compresores, generadores, herramienta pesada, etc.) típicamente:
- No sabe qué es un precio justo — no hay un "Kelley Blue Book" confiable para este nicho en español/LatAm.
- Toma fotos/video mediocres y escribe descripciones pobres, lo que baja conversión.
- Publica en Facebook Marketplace o Mercado Libre manualmente, sin optimizar el anuncio para esas plataformas.

## Solución (lo que ya validamos manualmente contigo)

1. **Input**: el usuario sube fotos y/o video de su equipo.
2. **Análisis con IA**: se identifica marca, modelo, año aproximado, horas/kilometraje si es visible, estado/desgaste visible, accesorios incluidos.
3. **Comparables reales**: se buscan listados similares (activos y vendidos) en Mercado Libre, Facebook Marketplace, y otras fuentes relevantes, para anclar un rango de precio defendible.
4. **Precio sugerido**: rango justo con justificación ("basado en 6 comparables, ajustado por horas de uso y estado").
5. **Anuncio optimizado**: título, descripción y bullets generados y adaptados al formato/algoritmo de cada plataforma destino.
6. **Publicación empujada**: el anuncio ya armado se sube (o se deja listo para un click) a Facebook Marketplace / Mercado Libre — Mianca no aloja la transacción ni compite por liquidez de compradores.

## Por qué esto y no "otro marketplace" (como Constructa)

- Producto más delgado: no depende de resolver el problema de liquidez de dos lados (compradores Y vendedores) — se apalanca en la liquidez que ya existe en FB Marketplace / ML.
- Ciclo de venta más corto: el usuario obtiene valor en una sesión (sube fotos → recibe precio + anuncio), no requiere que se forme una comunidad.
- Se puede construir y validar mucho más rápido que un marketplace.

## Consideraciones técnicas importantes (a resolver)

- **Mercado Libre** tiene API pública de publicación (OAuth, `POST /items`) — factible automatizar 100%.
- **Facebook Marketplace** NO tiene API pública de creación de listings para terceros — la meta "push automático" ahí probablemente se traduce en: anuncio pre-armado + flujo asistido (usuario pega/copia, o extensión de navegador que autocompleta el formulario), no una publicación 100% automática vía API. Esto hay que validarlo antes de prometerlo.
- **Fuentes de comparables**: scraping de ML/FB tiene fricción legal/técnica (ToS, rate limits, anti-bot). Vale la pena evaluar si existen datasets/APIs de terceros para precios de maquinaria usada antes de construir un scraper propio.
- **Visión por IA**: extraer marca/modelo/horas de fotos es factible con modelos multimodales actuales, pero conviene validar precisión con equipo real del nicho antes de prometer autodetección perfecta.

## Estado

Idea en etapa de concepto — carpeta creada para arrancar el desarrollo. Próximo paso: acotar el MVP (ver preguntas abiertas abajo).

## Preguntas abiertas para el MVP

- ¿Vertical inicial? (mismo nicho que Constructa — equipo de construcción — o más amplio)
- ¿Primer canal de publicación a integrar de verdad? (Mercado Libre vía API es lo más realista para un MVP; Facebook Marketplace probablemente empieza como "anuncio listo para copiar/pegar")
- ¿Modelo de negocio? (fee fijo por valuación/anuncio, suscripción, % si se vende, freemium)
- ¿Quién es el usuario objetivo? (vendedor particular ocasional vs. dealer/flotilla que vende equipo seguido — este segundo tiene mucho más LTV y volumen)
