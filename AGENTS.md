<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

> `CLAUDE.md` es solo `@AGENTS.md`. Este archivo es la única fuente de instrucciones: no dupliques reglas en otro lado.

## Estado del proyecto

Next.js 16.3.6 (App Router, React 19.2, TypeScript strict, Tailwind v4). La app de guardería (personal y familias) **está en construcción con datos reales** (Supabase Auth + BD + Storage): no es el scaffold inicial, pero tampoco estar completa (faltan pantallas de los mockups: resumen del día, avisos, detalle de publicación, etc.).

### Rutas implementadas

- `app/(auth)/login` y `app/(auth)/activate-account` — login real con Supabase Auth (Server Actions: `loginAction`, `signOutAction`) y activación de cuenta por código de invitación (consume `invitations`, crea el padre en `users`/`parent_children`).
- `app/(staff)/staff` — feed real (`getFeedPosts()`), `staff/kids` y `staff/kids/[id]` con Server Actions: agregar niño (INSERT en `children`), vincular padre (invitación con código por email vía Resend), y "Nueva publicación" con fotos (upload al bucket privado desde el browser client + `createPost`).
- `app/(familia)/familia` y `familia/cuenta` — **placeholders mínimos** (SPEC `role-based-panel-access`); el feed familiar real es un change pendiente.
- **No existe `app/page.tsx`**: `/` resuelve rol desde el `proxy` (redirect a `/staff` o `/familia`); usuario autenticado sin rol conocido termina en 404 por diseño, no arreglarlo con un page.

### Estructura

- `components/` — UI del producto (sidebar, `post-card`, `create-post-modal`, `add-kid-modal`, `link-parent-modal`, `activate-account-form`, `kid-*`, etc.).
- `utils/` — capa de dominio + datos: `posts.ts`, `current-daycare.ts`, `post-kinds.ts`, `email/invitations.ts` (Resend), más `supabase/` (ver "Acceso a datos").
- `data/children.ts` — resto del era-mock, hoy solo exporta `allergyColors`/`allergyLabels`/`Allergy` que usa `components/kid-card.tsx`. No crecer desde ahí: datos reales van de la BD.

El `references/` (mockups) sigue siendo la especificación visual para las pantallas pendientes, no la fuente de la existentes (esas ya implementadas viven en specs).

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
- El port del design system ya está hecho: `app/globals.css` tiene los tokens del mockup (Nunito/Fredoka en `@theme inline`, paleta arriba) — agregá tokens nuevos ahí, no colores crudos en componentes.
- `references/screenshots/*.png` son estados alternativos/antiguos de algunas de esas mismas pantallas; usalos como referencia secundaria, el `.dc.html` manda.

## Convenciones

- Alias `@/*` → raíz del repo.
- Tailwind v4 sin `tailwind.config.js`: los tokens se declaran en `app/globals.css` con `@theme inline`.
- `.env*` y `next-env.d.ts` están gitignored. Env vars activas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `NEXT_PUBLIC_APP_URL` (valores reales solo en `.env.local`, nunca commiteado; placeholders en `.env.template`).
- Todo el copy del producto está en **español**; las rutas que deriven de los mockups también.

## Base de datos (Supabase)

- **Estado del esquema** (a 2026-10-25, según specs/database 07-13): 9 tablas en `public` — `daycares`, `users` (enums `user_role`/`user_status`), `rooms`, `children`, `invitations`, `parent_children`, `posts`, `post_children`, `post_media` — más enums de `_kind`/`_status` y el helper `private.is_staff_of_daycare` (SECURITY DEFINER). Bucket **privado** de fotos de publicaciones (upload directo del browser, máx 10 fotos × 4MB por post; URLs servidas por el propio bucket). Toda tabla con RLS habilitado y policies por guardería.
- **Toda manipulación de la base de datos pasa por migración remota vía MCP**: DDL (`CREATE TABLE`, `ALTER`, indexes, etc.) con `apply_migration(name, query)`; solo lecturas/consultas o DML puntual con `execute_sql`. Nunca se edita esquema desde la consola de Supabase ni con scripts locales.
- **No existe `supabase/migrations/` local ni stack local** (decidido en spec 07): el historial de migraciones vive únicamente en la BD remota (`supabase_migrations.schema_migrations`). Por eso el nombre de cada migración debe ser único — re-ejecutar el mismo nombre falla con `42P07: relation already exists`.
- **Antes de crear algo, verificar el estado real**: con `list_tables` / `execute_sql` confirmar si el objeto ya existe (puede venir de una sesión anterior) antes de aplicar una migración. Con `INSERT` de seed, verificar el conteo previo para no duplicar filas.
- **RLS siempre habilitado** en tablas nuevas (`enable row level security`); las policies se definen en specs posteriores, no se omiten por defecto.
- Antes de cambiar esquema: inspeccionar tablas existentes. Para depurar: `query_logs` y `get_advisors` (security/performance) antes de tocar nada. Tras cambios de DDL, correr `get_advisors` de nuevo.
- SQL corre en el servidor: nunca leer archivos del servidor ni ejecutar OS vía SQL (`COPY ... FROM`, `pg_read_file`, `lo_import`, …).

## Acceso a datos (Supabase SSR)

- **Todo acceso a la BD desde la app pasa por los paquetes oficiales `@supabase/supabase-js` + `@supabase/ssr`**. No usar `fetch` directo a la API, ni ORMs, ni otro cliente.
- Helpers (alias `@/*`):
  - `utils/supabase/client.ts` → `createBrowserClient` — solo Client Components (`"use client"`).
  - `utils/supabase/server.ts` → `createServerClient` (async, con `await cookies()`) — Server Components, Server Actions y Route Handlers.
  - `utils/supabase/proxy.ts` (`updateSession`) + `proxy.ts` en raíz — resolución de sesión y guard de rol en cada request. No añadir lógica entre `createServerClient` y `supabase.auth.getUser()` (ver comentario en el archivo), y no borrar esa llamada (provoca logouts aleatorios).
- No crear nuevos helpers de cliente Supabase fuera de `utils/supabase/`. No usar `service_role` en código de la app.
- La **fuente de verdad de autorizaciones es `users.role` en la BD** (leída por request; el rol es mutable: un staff puede pasar a parent). El guard de rol vive en `utils/supabase/proxy.ts` (`updateSession`): `/` redirige a `/staff` o `/familia` según rol, y una ruta ajena al rol vuelve a `/`. Los layouts de cada panel re-verifican el rol antes de renderizar. No añadir lógica entre `createServerClient` y `getUser()` (comentario en el archivo), ni borrar ese refresco de sesión (provoca logouts aleatorios).
- Emails de invitación se envían desde `utils/email/invitations.ts` con Resend (`RESEND_API_KEY`); no mandar emails por otro lado ni hacer fetch directo a la API de Resend.
- RLS manda: las queries se ejecutan como el usuario autenticado; si una query devuelve vacío inesperado, revisar policies antes de "arreglar" el código.

## Spec-driven development

- `/spec <descripción>` escribe `specs/NN-slug.md` (estructura en `.agents/skills/spec/template.md`). Si el spec es de base de datos (tablas, enums, migraciones, RLS, seeds), va en `specs/database/NN-slug.md`. La numeración `NN` es global y correlativa en todo `specs/`.
- `/spec` y `/spec-impl` resuelven el slug en `specs/` o `specs/database/` (p. ej. `/spec-impl 08-users-table` encuentra `specs/database/08-users-table.md` sin necesidad de prefijo).
- `/spec-impl NN-slug` exige que el estado del spec signifique **"Approved"/"Aprobado"**; si no, se detiene. Crea la rama `spec-NN-slug` e implementa paso a paso, pausando para revisar el diff.
- Nunca commitees automáticamente: el commit es decisión del usuario. Terminada la implementación, se verifica la lista de criterios de aceptación y recién ahí se cambia el estado a "Implemented".
- Ambas skills están pineadas en `skills-lock.json` (origen `klerith/fernando-skills`); no las edites a mano.
- `/spec` exige responder en el mismo idioma del prompt inicial.
- **Estado de los specs** (a 2026-10-25): Implemented/Implementado 01, 02, 05, 06, 07, 08, 11, 12, 13; Aprobado (pendientes de implementar): 03, 04, 09, 10 — verificar el header de cada spec antes de confiar (03/04 describen pantallas con mock data que luego fueron reemplazadas por specs DB). La referencia del esquema previsto está en `references/db-schema` (carpeta externa `D:\udemy\OpenCode\07-DB-Schema`); no está implementado en la BD, es solo referencia.

## OpenSpec (flujo paralelo)

- Existe un segundo sistema de spec-driven con la CLI `openspec`: carpeta `openspec/` con `config.yaml` (contexto del proyecto) y specs consolidados en `openspec/specs/` (changes archivados en `openspec/changes/archive/YYYY-MM-DD-<slug>/` con `proposal.md`, `design.md`, `tasks.md` y delta de spec).
- El spec `role-based-panel-access` define el guard de rol actual (proxy + `/` por rol + re-verificación en layouts) — es el spec de referencia para cómo se autoriza por panel.
- No mezclar artefactos: `/spec` escribe en `specs/`; openspec en `openspec/`. Si el usuario habla de "openspec"/changes, usar ese flujo (CLI `openspec`).

## Agents

- **spec-verifier** (`.opencode/agents/spec-verifier.md`): verifica, corrige y marca los criterios de aceptación de `specs/**/*.md` (incluye `specs/database/`). Usa Context7 para APIs de Next.js y Playwright para verificación visual. Corre `npm run lint` y `npm run build`, compara screenshots contra mockups, y actualiza los checkboxes del spec con evidencia concreta. No commitea.
- **db-security-auditor** (`.opencode/agents/db-security-auditor.md`): audita RLS/policies Supabase para prevenir fugas entre niños/padres + buenas prácticas Postgres/Supabase. Solo lectura: no aplica migraciones ni edita código; entrega tabla de hallazgos con severidad, evidencia y SQL propuesto.

## MCPs

- **Playwright** (`.opencode/opencode.json`, `@playwright/mcp@latest`): todo artefacto suyo — screenshots, snapshots, console logs — va en `.playwright-mcp/` (ya está en `.gitignore`).
- **Context7**: para traer la documentación actualizada del framework/librerías.
- **Supabase** (remote MCP): para todo lo de base de datos — ver sección "Base de datos (Supabase)".


## Reglas de código
- Usar código limpio, nombres, funciones, variables, etc. en inglés

