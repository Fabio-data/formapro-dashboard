# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`formapro-dashboard` — the Prueba 2 deliverable for Logali Group. A Next.js app that reads the `pagos` table in Supabase (populated by the Prueba 1 n8n workflow) and renders KPIs, a daily-revenue chart, a top-courses list, and a paginated payments list with client-side filtering, search, and CSV export. This is a standalone git repo that ships to its own GitHub repo and deploys to Vercel.

## Commands

All commands run from this directory.

```
npm install
npm run dev      # next dev on :3000 (Turbopack)
npm run build    # next build
npm run start    # serve the production build
npm run typecheck # tsc --noEmit
npm test         # node --test over tests/*.test.ts (Node >= 22.18 runs .ts natively, no test deps)
```

CI (`.github/workflows/ci.yml`) runs `npm audit --audit-level=high`, typecheck, tests and build on every push/PR. Run typecheck + tests before committing.

To build without a real Supabase project (e.g. CI / sanity check), pass dummy envs:
```
SUPABASE_URL=https://x.supabase.co SUPABASE_ANON_KEY=x npm run build
```

`.env.local` must define `SUPABASE_URL` and `SUPABASE_ANON_KEY` (see `.env.example`); the old `NEXT_PUBLIC_*` names are still accepted as a fallback. `lib/supabase.ts` throws at import time if either is missing, so `next build` fails fast without them. The same two vars must be set in Vercel Project Settings.

## Next.js 16

Runs on **Next.js 16.4 + React 19** with Turbopack as the default bundler. APIs and conventions differ from older Next versions in training data. Before introducing new Next-specific patterns (route handlers, caching directives, `use cache`, server actions), read the relevant guide under `node_modules/next/dist/docs/` and heed deprecation notices.

**Turbopack CSS quirk (Windows):** editing CSS custom properties in `globals.css` is sometimes not picked up by HMR — the served CSS chunk keeps stale token values. If a theme/color change isn't appearing, stop the dev server, `rm -rf .next`, and restart.

## Architecture

- **Server-render-then-hydrate, no API route.** `app/page.tsx` is an async Server Component that calls Supabase directly with the anon key (`force-dynamic` + `revalidate = 0`, no caching), selecting up to 1000 rows ordered by `fecha` desc, and passes the array into `<DashboardClient>`. There is no `/api/*`. Extend `page.tsx` or push work into the client rather than adding one.

- **All filtering, KPI derivation, and CSV export happen client-side** in `components/dashboard-client.tsx` via `useMemo` over the full page-load dataset; the KPI math itself is the pure function `calcularKpis` in `lib/kpis.ts` (unit-tested). The 1000-row `limit(...)` in `getPagos` is the de-facto cap; if you raise it, reconsider whether filtering should move server-side.

- **Revenue is grouped by currency, never summed across currencies.** `calcularKpis` groups by `moneda`; the main "Ingresos completed" KPI shows only the dominant currency (others appear as a hint). Do not add a KPI that sums importes across different `moneda` values.

- **Money/number/date formatting is data-driven and hydration-safe** (`lib/format.ts`). `Intl.NumberFormat`/`DateTimeFormat` use the row's ISO 4217 code — nothing hardcoded. Three details exist specifically to prevent SSR-vs-client hydration mismatches (Node ICU and Chrome ICU format differently): explicit `minimumFractionDigits`/`maximumFractionDigits`, `hourCycle: "h23"` (24h, avoids the AM/PM separator), and `cleanSpaces()` which strips U+202F / U+00A0 to plain spaces. Keep these if you touch formatting.

- **CSV is RFC 4180 + UTF-8 BOM** (`lib/csv.ts`) so Excel reads accents correctly. Preserve the leading BOM and the formula-injection guard (strings starting with `=`, `+`, `-`, `@` get a leading `'`). Export always reflects the currently filtered subset, not the full dataset.

- **Theming is CSS-variable override + an anti-flash script.** All colors are `--color-*` tokens in `globals.css`; `html.dark` redefines those tokens, so components (which reference `var(--color-*)` at runtime) switch instantly with no re-render. `app/layout.tsx` injects an inline `THEME_INIT` script that adds `.dark` before first paint by reading `localStorage.theme` (falling back to `prefers-color-scheme`), with `suppressHydrationWarning` on `<html>`. `components/theme-toggle.tsx` keeps `theme` as `null` until mount to avoid a hydration mismatch. Only `background-color` is transitioned — `color` is intentionally not, because Chromium leaves var()-driven text color frozen mid-transition (invisible text on toggle).

- **The chart is hand-rolled SVG** (`components/chart-ingresos.tsx`): smooth cubic path + area fill + hover crosshair, sized via a `ResizeObserver`. No chart library.

## Security constraints

- The anon key is the only Supabase credential in this repo. `lib/supabase.ts` imports `server-only`: Supabase is queried only from Server Components, so neither URL nor key reach the browser, and the CSP is `connect-src 'self'`. Do not import `lib/supabase.ts` from a client component or reintroduce `NEXT_PUBLIC_*` Supabase vars. Read access is still governed by RLS.
- Never add `SUPABASE_SERVICE_ROLE_KEY` / the secret key to any `NEXT_PUBLIC_*` var. If privileged access is ever needed, create a separate server-only client.
- `tools/simulador.html` is a local-only demo tool. Keep it out of `public/` and never hardcode the n8n webhook URL in the repo.
- Database errors are logged server-side; the page shows only a generic message.
