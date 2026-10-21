# Open Daycare

App de guardería (personal y familias) con Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4 y Supabase SSR.

## Requisitos

- Node.js 20+ y npm (`node --version`, `npm --version`)
- Git
- Cuenta de Supabase con acceso al proyecto (ver abajo)
- Cuenta de Resend (solo para envío de emails)

## Levantar el proyecto

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd 06-open-daycare
npm install

# 2. Variables de entorno
cp .env.template .env.local
# luego edita .env.local con los valores reales

# 3. Dev
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Variables de entorno (`.env.local`)

| Variable | Dónde conseguirla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dashboard Supabase → Project Settings → API Keys (`sb_publishable_...`) |
| `SUPABASE_DB_PASSWORD` | La que se definió al crear el proyecto (solo para `supabase link`, no se usa en la app) |
| `RESEND_API_KEY` | https://resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend (`onboarding@resend.dev` sirve para dev) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` en local |

`.env*` está gitignored. Nunca commitees `.env.local`. Solo `.env.template` (con placeholders) va al repo.

### Scripts

```bash
npm run dev    # next dev (Turbopack por defecto)
npm run build  # next build — incluye typecheck
npm run start  # sirve el build de producción
npm run lint   # eslint plano (next lint ya no existe)
```

Chequeo de tipos sin build completo:

```bash
npx next typegen && npx tsc --noEmit
```

Nota Next 16: `next dev` escribe PID/puerto/URL en `.next/dev/lock`. Un segundo `next dev` muestra el servidor existente en vez de levantar otro. `params`, `searchParams`, `cookies()` y `headers()` son async. El middleware vive en `proxy.ts` (no `middleware.ts`).

## Supabase: MCP vs CLI

Este proyecto usa **dos formas distintas** de hablar con Supabase. No las confundas:

| | MCP de Supabase (el que usa el agente) | CLI de Supabase (para tu terminal) |
|---|---|---|
| Para qué | El agente aplica migraciones DDL (`apply_migration`), consultas (`execute_sql`), logs y advisories directamente sobre el proyecto remoto | Inspeccionar, linkear el proyecto, dumps puntuales, generar tipos. **No se usa para aplicar esquema** |
| Dónde se configura | A nivel usuario en `~/.config/opencode/opencode.jsonc` como MCP remoto (no está en `.opencode/opencode.json` del repo) | Instalado en tu máquina (`supabase` o `npx supabase`) |
| Auth | `opencode mcp auth supabase` (OAuth en el navegador, una vez por máquina) | `supabase login` (browser + access token local) |

### 1. MCP de Supabase (ya configurado)

URL registrada en tu config global de OpenCode:

```
https://mcp.supabase.com/mcp?project_ref=kovcdscqobdqvukboymf&features=docs,account,database,debugging,development,functions,branching
```

- `project_ref` = `kovcdscqobdqvukboymf` (lo ves en la URL del dashboard: `supabase.com/dashboard/project/kovcdscqobdqvukboymf`).
- Validar/autenticar el MCP (OAuth en el navegador). Cada miembro del equipo lo corre **una vez por máquina**:
  ```bash
  opencode mcp auth supabase
  ```
  Verifica con `opencode mcp list` que `supabase` quede autenticado/enabled. Si falla con error de auth, corre de nuevo `opencode mcp auth supabase`, o `opencode mcp logout supabase` y repite el auth.
- No hay tokens que copiar a mano para el MCP remoto.
- Flujo de esquema del proyecto (decisión vigente, spec 07): **no hay `supabase/` local ni stack local**. El historial vive solo en la BD remota (`supabase_migrations.schema_migrations`). El agente aplica DDL con `apply_migration(name, query)` con nombre único en snake_case, y solo lecturas/DML puntual con `execute_sql`. Nunca edites esquema desde el dashboard ni con scripts locales.

### 2. CLI de Supabase: login y link para tu equipo

Cada miembro del equipo hace esto **una vez por máquina**. Sirve para autenticarte y apuntar al mismo proyecto remoto. No levanta nada local en este proyecto.

```bash
# Instalar (elige una)
# Windows con Scoop:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
# o sin instalar, vía npx:
npx supabase --version

# 1. Login (abre el navegador y genera un access token local)
supabase login
# Si usas npx: npx supabase login

# 2. Verificar sesión
supabase projects list

# 3. Linkear este repo al proyecto remoto (te pide el DB password)
supabase link --project-ref kovcdscqobdqvukboymf
```

Notas:

- El token de `supabase login` queda guardado en tu máquina. En CI/headless usa en su lugar la env var `SUPABASE_ACCESS_TOKEN` (Dashboard → Account → Access Tokens) y no hagas `login`.
- Para salir o cambiar de cuenta: `supabase logout` y repite `login`.
- `supabase link` guarda el `project_ref` en el repo local. Cada compañero repite el `link` en su clon con el mismo `--project-ref`.
- Comandos útiles de solo lectura: `supabase projects list`, `supabase migration list` (compara local vs remoto), `supabase db dump --linked` (export puntual).
- **No uses** `supabase start`, `supabase db push` ni `supabase db reset --linked` en este proyecto: no hay stack local y el esquema se aplica vía MCP. `db reset --linked` borra la BD remota.

## Acceso a datos en la app

Todo pasa por `@supabase/supabase-js` + `@supabase/ssr`. No uses `fetch` directo ni otro ORM/cliente.

- `utils/supabase/client.ts` → `createBrowserClient` (solo Client Components).
- `utils/supabase/server.ts` → `createServerClient` (Server Components, Actions, Route Handlers).
- `utils/supabase/proxy.ts` + `proxy.ts` en raíz → refresco de sesión con `getClaims()`. No metas lógica entre `createServerClient` y `getClaims()` ni borres `getClaims()`.

RLS manda: las queries corren como el usuario autenticado. Si algo devuelve vacío inesperado, revisa las policies antes de "arreglar" el código. Nunca uses `service_role` en la app.

## Referencia visual

El producto vive por ahora en `references/pantallas/*.dc.html` (16 mockups, se abren en el navegador). `references/screenshots/*.png` son estados secundarios. Los mockups usan estilos inline con su propia paleta (fondo `#f6ecdf`, etc.) — hay que traducirlos a tokens Tailwind en `app/globals.css`, no copiar el markup.
