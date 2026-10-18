# SPEC 08 — Tabla `users` + enums y staff seed

> **Status:** Implementado
> **Depends on:** SPEC 07
> **Date:** 2026-10-16
> **Objective:** Crear los enums `user_role`/`user_status` y la tabla `users` (1-N obligatoria contra `daycares`) con RLS y policy de lectura propia, más un usuario staff seed en Sala Soles.

## Scope

**In:**

- Migración remota (MCP `apply_migration`): `CREATE TYPE public.user_role` (`staff`, `parent`, `admin`) y `CREATE TYPE public.user_status` (`pending`, `active`), fieles a `opendaycare-database-schema.md:10-20`.
- Migración remota (MCP `apply_migration`): `CREATE TABLE public.users` fiel a `opendaycare-database-schema.md:49-65`, con `daycare_id uuid NOT NULL REFERENCES public.daycares(id) ON DELETE RESTRICT` (un usuario pertenece a un daycare; un daycare tiene muchos usuarios).
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + 1 policy: `users_select_own` (`FOR SELECT TO authenticated USING (auth.uid() = id)`).
- Seed vía `execute_sql`: 1 fila staff (`Juan Carlos`, `role='staff'`, `status='active'`, `daycare` = `Guardería Sala Soles`, `id` = UUID del auth user creado a mano).
- Verificación con `list_tables`, `SELECT` en `pg_type`/`users` y `get_advisors`.

**Out of scope (for future specs):**

- Trigger `AFTER INSERT` en `auth.users` que auto-crea la fila en `public.users`.
- Resto de policies (escritura, roles staff/admin) y resto de tablas del esquema (`rooms`, `children`, `posts`, …).
- Los otros 4 enums del esquema (`relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Archivo local `supabase/migrations/` (decidido: solo remoto MCP, sin historial en git).
- Cambios en `app/`, `components/`, `data/` o mockups.

## Data model

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.users enable row level security;

create policy users_select_own on public.users
  for select to authenticated using (auth.uid() = id);

-- seed (el UUID <uuid-juan-carlos> viene del Dashboard de Supabase)
insert into public.users (id, daycare_id, role, status, full_name)
select '<uuid-juan-carlos>', d.id, 'staff', 'active', 'Juan Carlos'
from public.daycares d where d.name = 'Guardería Sala Soles';
```

- Convención de idioma: inglés en el código (`users`, `role`, `full_name`); etiquetas en español solo en UI.
- Sin `email` ni `password_hash`: viven en `auth.users`; esta tabla solo guarda datos de dominio.
- El estado previo al signup se modela en `invitations` (otro spec), no con `status='pending'` aquí.

## Implementation plan

1. Verificar estado real: `list_tables(public)` muestra solo `daycares`; `SELECT` en `pg_type` confirma que `user_role`/`user_status` no existen; `SELECT count(*) FROM daycares` = 4 con `Guardería Sala Soles`. Deja el punto de partida confirmado.
2. `apply_migration("create_user_enums")` con los 2 `CREATE TYPE`. Deja los enums creados, sin tablas nuevas.
3. `apply_migration("create_users_table")` con `CREATE TABLE` + `ENABLE ROW LEVEL SECURITY` + policy `users_select_own`. Deja la tabla creada, vacía y con 1 policy.
4. Crear el auth user a mano en el Dashboard de Supabase (Authentication > Add user): `juancarlos@google.com` / `Abc123456@`, copiar su UUID. Deja el `auth.users` listo para el seed.
5. `execute_sql` con el `INSERT` del staff (verificando conteo previo de `users` para no duplicar). Deja 1 fila: Juan Carlos, staff, Sala Soles.
6. Verificación: `list_tables(public, verbose)` muestra `users` con RLS; `SELECT` con `JOIN daycares` trae a Juan Carlos en Sala Soles; `get_advisors(security)` sin alertas nuevas atribuibles a `users`.

## Acceptance criteria

- [x] Los tipos `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`) existen y ningún otro enum nuevo fue creado.
- [x] `public.users` existe con `id uuid PK FK → auth.users(id) ON DELETE CASCADE`, `daycare_id uuid NOT NULL FK → daycares(id) ON DELETE RESTRICT`, `role NOT NULL`, `status NOT NULL DEFAULT 'active'`, `full_name NOT NULL`, `avatar_url` nullable, `notify_on_post`/`daily_summary_enabled` `NOT NULL DEFAULT true`, `created_at`/`updated_at` `NOT NULL DEFAULT now()`.
- [x] RLS habilitado y exactamente 1 policy (`users_select_own`, solo `SELECT` de la propia fila para `authenticated`).
- [x] `SELECT` del seed devuelve 1 fila: `Juan Carlos`, `staff`/`active`, `daycare` = `Guardería Sala Soles`, `id` igual al UUID del auth user.
- [x] `public` no contiene otra tabla nueva (solo `daycares` + `users`).
- [x] `get_advisors(security)` no reporta alertas nuevas atribuibles a `users` (verificado 2026-10-17; los 2 avisos de performance se aceptan como riesgos conocidos, ver tabla).

## Decisions

- **Yes:** solo los 2 enums de `users`. Los otros 4 se crean con sus respectivas tablas.
- **Yes:** `daycare_id NOT NULL` + `ON DELETE RESTRICT`. Cada usuario pertenece obligatoriamente a un daycare; no se puede borrar una guardería con usuarios.
- **Yes:** declarar la FK `id REFERENCES auth.users(id) ON DELETE CASCADE`. Fidelidad al esquema; si la migración falla por permisos sobre `auth`, el fallback es crear la tabla sin esa FK y documentarlo.
- **Yes:** RLS con solo lectura propia. La escritura y los tratos por rol van en un spec de auth posterior.
- **Yes:** auth user creado a mano en el Dashboard. El MCP no puede crear filas en `auth.users`.
- **Yes:** seed staff `Juan Carlos` en `Guardería Sala Soles` con `staff`/`active`. Es la guardería principal del seed de SPEC 07.
- **Yes:** credenciales de prueba `juancarlos@google.com` / `Abc123456@` (elegidas por el usuario). Se rotan tras la prueba y no se commitean.
- **No:** trigger de auto-creación desde `auth.users`. Va en otro spec.
- **No:** código Next.js, `supabase/migrations/` local ni cambios en mockups.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `REFERENCES auth.users` sin permiso desde la migración | La migración la aceptó sin problemas (verificado: `users_id_fkey → auth.users(id)` existe); no hizo falta el fallback. |
| Re-ejecutar el mismo nombre de migración falla (`42P07`) | Nombres únicos (`create_user_enums`, `create_users_table`); verificar `pg_type`/`list_tables` antes de reintentar. |
| Seed duplica filas o el UUID no coincide con `auth.users` | Verificar `SELECT count(*)` previo y copiar el UUID exacto del Dashboard. |
| `ON DELETE RESTRICT` bloquea borrar un daycare con usuarios | Comportamiento buscado; borrar usuarios primero si alguna vez hace falta. |
| Credenciales de prueba expuestas | Rotar el password tras probar; nunca commitearlas (ya están en `.env`, gitignored). |
| `users_daycare_id_fkey` sin índice (performance INFO `unindexed_foreign_keys`, 2026-10-17) | Riesgo aceptado por el usuario: tabla pequeña, acceso por PK/RLS; crear el índice en un spec posterior si el volumen lo pide. |
| Policy `users_select_own` re-evalúa `auth.uid()` por fila (performance WARN `auth_rls_initplan`, 2026-10-17) | Riesgo aceptado por el usuario: reescribir con `(select auth.uid())` en un spec posterior; no afecta la corrección. |

## What is **not** in this spec

- Trigger `AFTER INSERT` en `auth.users` ni creación automática de filas en `public.users`.
- Policies de escritura, roles staff/admin o autenticación en la app Next.js.
- Tablas `rooms`, `children`, `parent_children`, `invitations`, `posts` y el resto del esquema de referencia.
- Migraciones locales en git ni integración con la app Next.js.

## Verification log

Verificado 2026-10-18 contra Supabase remoto (MCP).

| # | Criterio | Veredicto | Evidencia |
|---|----------|-----------|-----------|
| 1 | Enums `user_role` y `user_status` existen con valores correctos, sin otros enums nuevos | ✅ | `SELECT typname, enumlabel FROM pg_type JOIN pg_enum` → `user_role` (staff, parent, admin), `user_status` (pending, active). Solo 2 enums en `public`. |
| 2 | `public.users` con columnas, tipos, nullabilidad, defaults y FKs según spec | ✅ | `information_schema.columns` + `pg_constraint`: `id uuid PK FK→auth.users(id) ON DELETE CASCADE`, `daycare_id uuid NOT NULL FK→daycares(id) ON DELETE RESTRICT`, `role user_role NOT NULL`, `status user_status NOT NULL DEFAULT 'active'`, `full_name text NOT NULL`, `avatar_url text NULL`, `notify_on_post bool NOT NULL DEFAULT true`, `daily_summary_enabled bool NOT NULL DEFAULT true`, `created_at/updated_at timestamptz NOT NULL DEFAULT now()`. |
| 3 | RLS habilitado + exactamente 1 policy `users_select_own` (SELECT para authenticated) | ✅ | `pg_class.relrowsecurity=true`. `pg_policy`: 1 policy `users_select_own`, `polcmd='r'` (SELECT), `polroles=[16481]` (rol `authenticated`), `using_expr=(auth.uid() = id)`. |
| 4 | Seed devuelve 1 fila: Juan Carlos, staff/active, Guardería Sala Soles, UUID coincide con auth.users | ✅ | `SELECT ... FROM users JOIN daycares` → 1 fila: `id=8848f267-9799-40e6-a6e1-93703fba88fc`, `full_name=Juan Carlos`, `role=staff`, `status=active`, `daycare_name=Guardería Sala Soles`. `auth.users` confirma UUID existe con `email=juancarlos@google.com`. |
| 5 | `public` no contiene otra tabla nueva (solo `daycares` + `users`) | ✅ | `SELECT tablename FROM pg_tables WHERE schemaname='public'` → `daycares`, `users`. Sin otras tablas. |
| 6 | `get_advisors(security)` no reporta alertas nuevas atribuibles a `users` | ✅ | Security advisors: `rls_enabled_no_policy` en `daycares` (spec 07, no `users`), `anon/authenticated_security_definer_function_executable` en `rls_auto_enable()` (función pre-existente, no creada en migraciones de spec 08), `auth_leaked_password_protection` (config Auth, no relacionado). Performance advisors: `unindexed_foreign_keys` en `users_daycare_id_fkey` y `auth_rls_initplan` en `users_select_own` (ambos documentados como riesgos aceptados en sección Risks). |
