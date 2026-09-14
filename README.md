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

## Alcance del MVP (decidido)

- **Vertical**: nicho amplio de equipo/maquinaria usada (no solo construcción) — no nos limitamos a lo que ya cubre Constructa.
- **Usuario objetivo**: dealers / flotillas que venden equipo seguido, no el vendedor particular ocasional. Esto implica que el MVP necesita, desde el inicio:
  - Un dashboard que maneje **varios anuncios a la vez** (no solo un flujo de un solo equipo).
  - Carga por lote (subir fotos/video de varios equipos en una sesión).
  - Historial de valuaciones y anuncios generados por cuenta.
- **Canal de publicación real (v1)**: **Mercado Libre**, vía su API pública de publicación (OAuth + `POST /items`). Es la única integración que puede automatizarse de punta a punta en el MVP.
- **Facebook Marketplace**: fase 2. Como no hay API pública de creación de listings para terceros, el output ahí es un anuncio "listo para copiar/pegar" (título, descripción, fotos ordenadas) — no publicación automática — hasta que se evalúe una vía viable (extensión de navegador, etc.).

## Flujo del MVP

1. Dealer se registra / conecta su cuenta de Mercado Libre (OAuth).
2. Sube fotos/video de uno o varios equipos (carga por lote).
3. Por cada equipo: IA extrae marca, modelo, año aprox., horas/uso visible, estado, accesorios.
4. Se buscan comparables activos en Mercado Libre (API pública de búsqueda) para ese modelo/categoría.
5. Se calcula un rango de precio sugerido con justificación.
6. Se genera título + descripción optimizados para el algoritmo de ML.
7. Dealer revisa/edita y publica directo a Mercado Libre desde el dashboard (1 click por equipo, o publicación masiva).
8. Para equipos que también quiera poner en Facebook Marketplace: se le entrega el anuncio ya armado, listo para pegar.

## Pendiente por definir

- Modelo de negocio (fee por valuación/anuncio, suscripción mensual por dealer, % si se vende, freemium con límite de anuncios/mes).
- Fuente de datos para comparables "vendidos" (ML no siempre expone histórico de vendidos vía API pública — puede requerir estimarlo solo con activos + ajuste, al menos en v1).
- Qué modelo multimodal usar para la extracción de specs desde fotos/video, y validar precisión con equipo real antes de prometer autodetección.

## Estado del desarrollo

Construyendo en el orden natural: **auth → carga/valuación con IA → comparables → generación y publicación de anuncio**.

- [x] Landing page + dashboard skeleton (datos de ejemplo).
- [x] Auth de dealers (registro/login con Supabase Auth) — [app/(auth)/login](app/(auth)/login/page.tsx), [app/(auth)/registro](app/(auth)/registro/page.tsx), guard de sesión en [app/dashboard/layout.tsx](app/dashboard/layout.tsx).
- [x] Conexión OAuth con Mercado Libre por dealer — botón "Conectar" en el dashboard ([components/ml-connect-card.tsx](components/ml-connect-card.tsx)), callback que canjea el `code` y guarda tokens ([app/api/ml/callback/route.ts](app/api/ml/callback/route.ts)), helpers en [lib/mercadolibre.ts](lib/mercadolibre.ts).
- [x] Schema de base de datos: `dealers`, `equipos`, `ml_conexiones` ([supabase/migrations/001_schema.sql](supabase/migrations/001_schema.sql)), con RLS para que cada dealer solo vea lo suyo.
- [x] Carga de fotos + extracción de specs con IA — [app/dashboard/nuevo](app/dashboard/nuevo/page.tsx) sube a Supabase Storage (bucket `equipos`, [supabase/migrations/002_storage.sql](supabase/migrations/002_storage.sql)) y llama a [app/api/equipos/analizar](app/api/equipos/analizar/route.ts), que usa Claude (`claude-opus-5`, [lib/anthropic.ts](lib/anthropic.ts)) para sacar marca/modelo/año/horas y crea el registro en `equipos`. El dashboard ya lee equipos reales de Supabase ([lib/use-equipos.ts](lib/use-equipos.ts)) — se quitó `lib/mock-data.ts`.
- [x] Búsqueda de comparables reales en Mercado Libre y cálculo del rango de precio — [lib/pricing.ts](lib/pricing.ts). **Hallazgo importante:** ML ahora exige un access_token de usuario real (no anónimo, no de app vía `client_credentials`) incluso para buscar. [lib/ml-token.ts](lib/ml-token.ts) obtiene/refresca el token del dealer conectado; si el dealer no ha conectado ML, el equipo se queda en `borrador` sin tronar.
- [x] Generación del anuncio y publicación vía `POST /items` de ML — [app/api/equipos/[id]/generar-anuncio](app/api/equipos/[id]/generar-anuncio/route.ts) y [app/api/equipos/[id]/publicar](app/api/equipos/[id]/publicar/route.ts), botones en las tarjetas del dashboard ([components/equipo-card.tsx](components/equipo-card.tsx)). **Sin probar de punta a punta todavía** — necesita crédito de Anthropic; además la creación de items en ML casi siempre requiere iterar una vez que veamos los 400 reales de una categoría específica (atributos obligatorios que no podemos adivinar de antemano).
- [x] Conexión OAuth con ML probada de punta a punta — requería PKCE (`code_challenge`/`code_verifier`, ver [lib/mercadolibre.ts](lib/mercadolibre.ts)), el app quedó configurada así en ML Developers.
- [x] Transparencia de la valuación — cada tarjeta puede expandir la lista real de comparables usados (título, precio, link a la publicación de ML) y muestra una justificación en texto del rango (`precio_justificacion`), no solo el número. Avisa cuando la IA no identificó marca/modelo con certeza.
- [x] Edición manual — marca/modelo/año/horas/nombre se pueden corregir a mano desde la tarjeta (`PATCH /api/equipos/[id]`) cuando la IA no los leyó bien de la foto, y un botón "Recalcular precio" (`POST /api/equipos/[id]/recalcular-precio`) reintenta la búsqueda de comparables con los datos corregidos.
- [x] Carga por lote — [app/dashboard/nuevo](app/dashboard/nuevo/page.tsx) sube varios equipos en una sesión, cada uno con sus propias fotos, procesados y reportados de forma independiente.
- [ ] Salida "copiar/pegar" para Facebook Marketplace (fase 2).

## Producción

Desplegado en Vercel: **https://mianca.vercel.app** (proyecto `melenci/mianca`). Las variables de entorno se manejan en el dashboard de Vercel (Project Settings → Environment Variables), no en este repo. Después de cambiar variables hay que redesplegar: `npx vercel --prod`.

## Cómo correrlo localmente

1. `npm install`
2. Crea un proyecto en [Supabase](https://supabase.com) y corre, en orden, el SQL de `supabase/migrations/`: [001_schema.sql](supabase/migrations/001_schema.sql), [002_storage.sql](supabase/migrations/002_storage.sql), [003_estado_visible.sql](supabase/migrations/003_estado_visible.sql), [004_precio_justificacion.sql](supabase/migrations/004_precio_justificacion.sql).
3. Crea una app en [Mercado Libre Developers](https://developers.mercadolibre.com.mx/) con Authorization Code + PKCE + Refresh Token habilitados.
4. Copia `.env.local.example` a `.env.local` y llena las variables reales: URL/anon key/service role key de Supabase (Project Settings → API en el dashboard de Supabase) y el client id/secret de tu app de ML.
5. `npm run dev` y entra a `/registro` para crear tu primer dealer.

**Sobre probar la conexión con Mercado Libre en local:** ML exige que el Redirect URI sea `https://` y además rechaza `localhost` como dominio (aunque sea con https) — no lo pudimos hacer funcionar en local. Lo que sí funciona: hay un `npm run dev:https` con certificado autofirmado en `certificates/` por si ML llegara a aceptarlo en tu caso, pero en la práctica terminamos probando el flujo de ML directo contra el deploy de Vercel (dominio real). Si necesitas probarlo en local de verdad, usa un túnel (ngrok/cloudflared) y registra esa URL pública como Redirect URI.

> Si el certificado en `certificates/` expira o lo borras, regenéralo con:
> `openssl req -x509 -newkey rsa:2048 -keyout certificates/localhost-key.pem -out certificates/localhost.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`
> (en Git Bash antepón `MSYS_NO_PATHCONV=1` al comando para que no reescriba la ruta `/CN=localhost`).
