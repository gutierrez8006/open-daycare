# SPEC 07 — Tabla `daycares` + seed

> **Status:** Aprobado
> **Depends on:** ninguna (primera tabla real de negocio; `public` vacío al iniciar)
> **Date:** 2026-10-13
> **Objective:** Crear la tabla raíz `daycares` en Supabase vía migración remota con RLS habilitado y 4 filas seed, incluyendo `Guardería Sala Soles`.

## Scope

**In:**

- Migración remota (MCP `apply_migration`): `CREATE TABLE public.daycares` fiel a `07-DB-Schema/opendaycare-database-schema.md:37-45`.
- `ALTER TABLE ... ENABLE ROW LEVEL security`, sin policies (tabla cerrada hasta el spec de `users`/auth).
- Seed de 4 filas con `INSERT`: `Guardería Sala Soles` + 3 propuestas: `Guardería Arcoíris`, `Guardería Pequeños Pasos`, `Guardería Los Almendros`.
- Verificación con `list_tables`, `SELECT count(*)` y `get_advisors`.

**Out of scope (for future specs):**

- Resto de tablas del esquema (`users`, `rooms`, `children`, `posts`, …).
- Policies RLS sobre `daycares`, trigger de creación de `users` desde `auth.users`, Storage, API o capa de datos en Next.js.
- Archivo local `supabase/migrations/` (decidido: solo remoto MCP, sin historial en git).
- Cambios en `app/`, `components/`, `data/` o mockups.

## Data model

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.daycares enable row level security;

insert into public.daycares (name) values
  ('Guardería Sala Soles'),
  ('Guardería Arcoíris'),
  ('Guardería Pequeños Pasos'),
  ('Guardería Los Almendros');
```

- Convención de idioma: inglés en el código (`daycares`, `name`); etiquetas en español solo en UI.
- `pgcrypto 1.3` verificado instalado en el esquema `extensions`, por lo que `gen_random_uuid()` resuelve.
- Sin `updated_at`: la referencia `opendaycare-database-schema.md:37-45` no lo incluye para esta tabla.

## Implementation plan

1. `apply_migration("create_daycares_table")` con el `CREATE TABLE` + `ENABLE ROW LEVEL SECURITY`. Deja la tabla creada, vacía, con RLS.
2. `execute_sql` con el `INSERT` de las 4 filas del seed. Deja la tabla con 4 rows.
3. Verificación: `list_tables(public)` muestra `daycares`; `SELECT count(*) = 4`; `get_advisors(security)` sin alertas nuevas atribuibles a la tabla.
4. Guardar este spec en `specs/07-daycares-table.md` en estado `Borrador` (el `specs/.spec-config.yml` ya existe y se deja intacto).

## Acceptance criteria

- [x] `public.daycares` existe con columnas `id uuid PK default gen_random_uuid()`, `name text NOT NULL`, `created_at timestamptz NOT NULL default now()`.
- [x] RLS habilitado y cero policies en `daycares`.
- [x] `SELECT count(*) FROM public.daycares` = 4, incluyendo `Guardería Sala Soles`.
- [x] `public` no contiene ninguna otra tabla nueva.
- [x] Spec guardado en `specs/07-daycares-table.md` en estado `Borrador`.

## Verification log

| # | Criterio | Veredicto | Evidencia |
|---|----------|-----------|-----------|
| 1 | Columnas y defaults correctos | ✅ | `list_tables(verbose)`: `id uuid` PK default `gen_random_uuid()`, `name text`, `created_at timestamptz` default `now()` |
| 2 | RLS habilitado, cero policies | ✅ | `rls_enabled: true`; advisor `rls_enabled_no_policy` = INFO (esperado, tabla cerrada hasta auth) |
| 3 | 4 filas seed | ✅ | `SELECT`: Sala Soles (`72b16041…`), Arcoíris, Pequeños Pasos, Los Almendros; `rows: 4` |
| 4 | Sin otras tablas nuevas en public | ✅ | `list_tables(public)` devuelve solo `public.daycares` |

## Decisions

- **Yes:** DDL fiel a la referencia, más `NOT NULL` en `name` y `created_at` (elegido por el usuario).
- **Yes:** RLS sin policies. Descarta lectura `TO authenticated (true)`: la tabla raíz queda cerrada hasta el spec de auth.
- **Yes:** solo remoto MCP (`apply_migration` + `execute_sql`). Descarta `supabase/migrations/` local: el repo no tiene stack local ni carpeta `supabase/`.
- **Yes:** seed de 4 filas, con `Guardería Sala Soles` como principal; los otros 3 nombres propuestos por el agente y confirmados.
- **No:** resto de tablas del esquema, policies, triggers ni código de Next.js.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `gen_random_uuid()` no resuelve por `search_path` | `pgcrypto` confirmado instalado; si falla, usar `extensions.gen_random_uuid()`. |
| Seed duplica filas si la migración se re-ejecuta | El `INSERT` corre una sola vez; verificar conteo previo antes de reintentar. |

## What is **not** in this spec

- Tablas `users`, `rooms`, `children`, `posts` y el resto del esquema de referencia.
- Policies RLS y trigger de creación de `users` desde `auth.users`.
- Migraciones locales en git ni integración con la app Next.js.
