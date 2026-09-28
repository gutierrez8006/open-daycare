<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

> `CLAUDE.md` es solo `@AGENTS.md`. Este archivo es la única fuente de instrucciones: no dupliques reglas en otro lado.

## Estado del proyecto

Next.js 16.3.6 (App Router, React 19.2, TypeScript strict, Tailwind v4) scaffolteado con `create-next-app` y **prácticamente sin construir**: `app/page.tsx` sigue siendo el boilerplate de CNA y no hay rutas, componentes, tests ni capa de datos. `app/layout.tsx` es lo único modificado (ya usa `LayoutProps<"/">`).

El producto (app de guardería: personal y familias) **solo existe como mockups** en `references/`. Empieza por ahí, no por el código.

## Comandos

```bash
npm run dev     # next dev (Turbopack por defecto, sin flag --turbo)
npm run build   # next build — incluye typecheck
npm run start
npm run lint    # eslint plano (next lint ya no existe)
```

- **No hay script de typecheck ni de tests.** Para un chequeo de tipos sin build completo: `npx next typegen && npx tsc --noEmit`.
- `next dev` escribe PID/puerto/URL en `.next/dev/lock`; un segundo `next dev` imprime el servidor existente en vez de levantar otro.
- `next.config.ts` está vacío; no asumas adapters, cacheComponents, typedRoutes ni CSP.

## Next 16: lo que tu training data no sabe

- **Helpers de tipos por ruta son globales, sin import**: `PageProps<'/ruta'>`, `LayoutProps<'/ruta'>`, `RouteContext<'/ruta'>`. Los genera `next dev` / `next build` / `next typegen` (ver `app/layout.tsx:20`). Si un tipo no resuelve, corré `next typegen` antes de "arreglarlo".
- **APIs de request son async**: `params`, `searchParams`, `cookies()`, `headers()` devuelven Promises.
- **`middleware.ts` → `proxy.ts`** (renombrado en 16).
- Turbopack es el bundler por defecto en dev y build; la config de Turbopack vive en `next.config.ts`.
- ESLint usa flat config (`eslint.config.mjs`) con `eslint-config-next` 16.
- Antes de usar cualquier API nueva de Next o de una librería, leé `node_modules/next/dist/docs/` (o Context7) — la doc versionada está ahí y manda sobre tu memoria.

## `references/` es la especificación visual

- `references/pantallas/*.dc.html` — **16 mockups** de las pantallas: `login`, `activar-cuenta`, `index`, `feed`, `ninos`, `perfil-nino`, `agregar-nino`, `avisos`, `crear-publicacion`, `detalle-publicacion`, `resumen-dia`, `foto`, `mi-cuenta`, `familia-feed`, `familia-cuenta`, `vincular-padre`. Se abren en el navegador (o vía Playwright MCP), no se compilan.
- `references/pantallas/support.js` es un runtime **generado** (`GENERATED from dc-runtime/src/*.ts — do not edit`). No lo toques.
- Los mockups traen **estilos inline y su propia paleta**, no clases de Tailwind: Nunito (cuerpo) + Fredoka (display) por Google Fonts, fondo `#f6ecdf`, texto `#3f362e`, card `#fffdf9`, borde `#ece0d0`, acentos `#f2937a` / `#d9583c` / `#2e89a6`. Paratailwindear hay que **traducir** esos valores, no copiar markup.
- `app/globals.css` todavía tiene la paleta zinc y Geist del scaffold → el port del design system está pendiente.
- `references/screenshots/*.png` son estados alternativos/antiguos de algunas de esas mismas pantallas; usalos como referencia secundaria, el `.dc.html` manda.

## Convenciones

- Alias `@/*` → raíz del repo.
- Tailwind v4 sin `tailwind.config.js`: los tokens se declaran en `app/globals.css` con `@theme inline`.
- `.env*` y `next-env.d.ts` están gitignored. Hoy no se usa ninguna env var.
- Todo el copy del producto está en **español**; las rutas que deriven de los mockups también.

## Spec-driven development

- `/spec <descripción>` escribe `specs/NN-slug.md` (estructura en `.agents/skills/spec/template.md`). `specs/` todavía no existe; la skill lo crea junto con `specs/.spec-config.yml` (`AutoCreateBranch: true` por default).
- `/spec-impl NN-slug` exige que el estado del spec signifique **"Approved"/"Aprobado"**; si no, se detiene. Crea la rama `spec-NN-slug` e implementa paso a paso, pausando para revisar el diff.
- Nunca commitees automáticamente: el commit es decisión del usuario. Terminada la implementación, se verifica la lista de criterios de aceptación y recién ahí se cambia el estado a "Implemented".
- Ambas skills están pineadas en `skills-lock.json` (origen `klerith/fernando-skills`); no las edites a mano.
- `/spec` exige responder en el mismo idioma del prompt inicial.

## Agents

- **spec-verifier** (`.opencode/agents/spec-verifier.md`): verifica, corrige y marca los criterios de aceptación de `specs/*.md`. Usa Context7 para APIs de Next.js y Playwright para verificación visual. Corre `npm run lint` y `npm run build`, compara screenshots contra mockups, y actualiza los checkboxes del spec con evidencia concreta. No commitea.

## MCPs

- **Playwright** (`.opencode/opencode.json`, `@playwright/mcp@latest`): todo artefacto suyo — screenshots, snapshots, console logs — va en `.playwright-mcp/` (ya está en `.gitignore`).
- **Context7**: para traer la documentación actualizada del framework/librerías.


## Reglas de código
- Usar código limpio, nombres, funciones, variables, etc. en inglés

