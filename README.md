# FormaPro — Dashboard de pagos

Dashboard de la Prueba 2 de Logali Group. Lee la tabla `pagos` de Supabase (que llené con el workflow de n8n de la Prueba 1) y muestra KPIs, un chart de ingresos y una lista filtrable y exportable.

**Demo en vivo:** https://formapro-dashboard-bice.vercel.app (datos de prueba, no son clientes reales)

[![CI](https://github.com/Fabio-data/formapro-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Fabio-data/formapro-dashboard/actions/workflows/ci.yml)

## Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript**
- **Tailwind v4**
- **Supabase JS** con la anon key, solo desde el servidor (la service_role NUNCA toca el repo)
- **Chart en SVG propio**, sin librería de gráficos
- **Lucide** para iconos

No uso ORM, ni capa de API intermedia, ni librería de estado. Para 1000 filas máximo no hace falta.

## Qué muestra

**KPIs filtrables** sobre el subset visible:
- Ingresos `completed` en la moneda dominante (si hay varias, se muestra la principal y el resto queda en la card aparte; no se suman peras con manzanas).
- Total de pagos.
- Ticket medio en la moneda dominante.
- Refunds (cuenta y porcentaje).

**Chart**: ingresos por día (solo `completed`).

**Tabla** de pagos con paginación.

**Top de cursos** por número de pagos.

**Filtros**: estado (todos / completed / refunded / failed), moneda, rango de fechas, búsqueda libre por `id_pago`, nombre, email o curso.

**Export CSV** del subset filtrado, con BOM UTF-8 para que Excel respete los acentos.

**Tema claro / oscuro** con toggle, persistido en `localStorage` y respetando el `prefers-color-scheme` del sistema en la primera visita. Un script inline aplica el tema antes del primer paint para evitar el flash de tema equivocado.

## Decisiones que tomé

### Server Component lee Supabase, sin API route

`app/page.tsx` es `async`, llama a Supabase con la anon key y pasa los datos al `DashboardClient`. `force-dynamic` + `revalidate = 0` para no cachear y siempre traer datos frescos. No hay endpoint `/api/*` porque para un dashboard de lectura no aporta nada — duplicaría el trabajo.

Consecuencia: el filtrado, el cálculo de KPIs y el export viven en cliente, sobre los datos ya traídos por el server. Con el `limit(1000)` actual es trivial. Si en algún momento la tabla crece, hay que mover filtros a la query de Supabase.

### Solo anon key, RLS en la base

En este repo nunca aparece la `service_role`. Las únicas envs son `SUPABASE_URL` y `SUPABASE_ANON_KEY`, sin prefijo `NEXT_PUBLIC_`: `lib/supabase.ts` importa `server-only`, así que el build falla si un componente cliente intenta usarlo y ni la URL ni la key llegan al navegador. Aun así, la seguridad real vive en las policies RLS de la tabla `pagos`.

En Supabase confirmé:
- RLS habilitado en `pagos`.
- Policy de `SELECT` para `anon`.
- No hay `INSERT` / `UPDATE` / `DELETE` accesibles con anon key.

### Endurecimiento de cabeceras HTTP

`next.config.ts` añade defensa en profundidad por encima de RLS:
- `Content-Security-Policy` restrictiva (`default-src 'self'`, sin `unsafe-eval` en producción, `connect-src 'self'`: el navegador no habla con Supabase).
- `X-Frame-Options: DENY` + `frame-ancestors 'none'` (no embebible).
- `Strict-Transport-Security` con preload.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` apagando APIs sensibles que el dashboard no usa.
- `X-Content-Type-Options: nosniff`.

### Validación del entorno

`lib/supabase.ts` verifica al arrancar que `SUPABASE_URL` es https y apunta a `*.supabase.co`. Si alguien pega un dominio raro por error, falla rápido en build/start en vez de hablar con un servidor extraño.

### Moneda formateada desde los datos, no hardcodeada

`lib/format.ts` usa `Intl.NumberFormat` con el código ISO 4217 que viene en cada fila. Nada de `'$'`, `'€'` o `'COP'` en código. Si llega un código desconocido, cae al locale sin símbolo y muestra el código al lado.

Y los ingresos se agrupan por moneda en `dashboard-client.tsx`: si hay `COP + USD + EUR` mezclados, no los sumo a ciegas — muestro la moneda dominante en la KPI principal y las demás como pista.

Además, solo anexo el código ISO cuando el símbolo es ambiguo: `$` es genérico (COP/USD/MXN…) así que muestro `$ 120.000,00 COP`, pero `US$` ya identifica la moneda, así que no escribo `US$ 1.500 USD` redundante.

### CSV decente

`lib/csv.ts`: RFC 4180 (escape de comillas duplicadas, salto `\r\n`) y BOM UTF-8 al inicio. Probado en Excel con acentos y comas en nombres.

Como los datos entran por un webhook, los textos que empiezan por `=`, `+`, `-` o `@` se exportan con un apóstrofo delante para que Excel no los ejecute como fórmula (inyección CSV).

### Errores sin detalles internos

Si la query a Supabase falla, el detalle va a los logs del servidor y el visitante solo ve un mensaje genérico.

## Cómo correrlo en local

```bash
cp .env.example .env.local
# editar .env.local con la URL y la anon key reales
npm install
npm run dev
```

Abre `http://localhost:3000`.

Comprobaciones (las mismas que corre el CI en cada push):

```bash
npm run typecheck   # tsc --noEmit
npm test            # tests de KPIs, CSV y formato (node --test, sin dependencias)
npm run build
```

### Simulador de pagos (solo local)

`tools/simulador.html` dispara pagos de prueba al webhook de n8n (duplicados, reembolsos, datos sucios, 10 en paralelo). Se abre directamente en el navegador y pide la URL del webhook: no se despliega ni trae ninguna URL escrita, porque un webhook público sin autenticación deja que cualquiera inserte pagos.

## Cómo lo desplegué en Vercel

1. Push del repo a GitHub.
2. En Vercel: Import Project → seleccionar el repo.
3. Project Settings → Environment Variables → añadir `SUPABASE_URL` y `SUPABASE_ANON_KEY`. **Las envs viven solo en Vercel, no en git.**
4. Deploy.

## Estructura

```
app/
  layout.tsx       fuentes Inter + JetBrains Mono, html shell
  page.tsx         Server Component, lee Supabase y pasa data al cliente
  globals.css      tokens OKLCH, primitives (card, mono, label-eyebrow)
components/
  dashboard-client.tsx  estado de filtros, derivación de KPIs
  kpi-card.tsx          card de métrica
  chart-ingresos.tsx    chart de ingresos en SVG propio
  live-refresh.tsx      auto-refresco de datos (pausable)
  pagos-list.tsx        tabla con paginación
  cursos-list.tsx       top cursos con barra de progreso
  filtros.tsx           chips estado, select moneda, dates, search
  boton-export.tsx      trigger CSV
lib/
  supabase.ts      cliente solo-servidor + validación de URL
  kpis.ts          cálculo de KPIs agrupado por moneda
  format.ts        money, number, date
  csv.ts           serialización RFC 4180 + BOM
  types.ts         Pago, KpiData, FiltrosState
tests/             tests unitarios de lib/
tools/             simulador de pagos (no se despliega)
next.config.ts     security headers
```

## Sobre la IA en este proyecto

Usé un asistente de código para:
- Generar el scaffold inicial de componentes.
- Discutir tradeoffs (Server Component vs client-fetch, agrupar ingresos por moneda vs sumar).
- Redactar el primer borrador de este README.

Lo que corregí / decidí yo:
- El agrupamiento por moneda (la primera versión sumaba todas las monedas al "Ingresos totales" — mal).
- El formato de moneda redundante ("US$ 1.500 USD"): ahora solo anexa el código cuando el símbolo es ambiguo.
- Los security headers de `next.config.ts` y la validación de URL en `lib/supabase.ts`.
- El control sobre qué va y qué no va al `.env.example`.
- Que el filtrado fuera 100% client-side sobre los datos del server, sin API route.
- En el dark mode: el `color` del body NO se transiciona porque Chromium lo congela cuando depende de un `var()` que cambia (dejaba el texto invisible al alternar tema).
- El tono de este README.
