# SPEC 10 — Tablas `rooms` y `children` + `/kids` real en lectura

> **Status:** Aprobado
> **Depends on:** SPEC 02, SPEC 04, SPEC 07, SPEC 08, SPEC 09
> **Date:** 2026-10-18
> **Objective:** Crear las tablas `rooms` y `children` con RLS por guardería y seed de 3 salas, y conectar `/kids` y `/kids/[id]` a la DB real en lectura.

## Por qué existe este spec

SPEC 02 dejó `/kids` y `/kids/[id]` como pantallas estáticas con `data/children.ts` y SPEC 04 dejó el modal Agregar niño sin persistencia. SPEC 07 y SPEC 08 crearon `daycares` y `users` con RLS. Este spec pone la base del mantenimiento de niños: el modelo real más la lectura real en `/kids`, sin CRUD todavía.

## Scope

**In:**

- Migración remota (MCP `apply_migration`): `CREATE TYPE public.child_status` (`active`, `archived`), fiel a `opendaycare-database-schema.md:10-20`.
- Migración remota (MCP `apply_migration`): `CREATE TABLE public.rooms` fiel a `opendaycare-database-schema.md:69-79`, con `daycare_id uuid NOT NULL REFERENCES public.daycares(id) ON DELETE RESTRICT`.
- Migración remota (MCP `apply_migration`): `CREATE TABLE public.children` fiel a `opendaycare-database-schema.md:82-99`, con `room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT`.
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en ambas tablas.
- Policies RLS en ambas: `SELECT` para `authenticated` de la misma guardería; `INSERT`/`UPDATE`/`DELETE` solo `staff`/`admin` de la misma guardería.
- Seed vía `execute_sql`: 3 rooms en `Guardería Sala Soles` — `Soles`, `Estrellas`, `Arcoíris`. Cero filas en `children`.
- `app/(app)/kids/page.tsx` + `components/kids-directory.tsx`: leen children reales vía `utils/supabase/server.ts`. Solo `status = 'active'`, orden por `full_name`. Lista única con separador = nombre del daycare actual (mayúsculas) + contador total derivado. Buscador cliente por nombre (NFD, como hoy).
- `app/(app)/kids/[id]/page.tsx` + `components/kid-profile.tsx`: leen el niño real por `id` (JOIN rooms). `notFound()` si no existe o no es `active`. Banner de alergias solo si `medical_notes`. Card PADRES vacía, manteniendo el link "Vincular otro padre".
- Verificación con `list_tables`, `SELECT` en `pg_type`/`rooms`/`children` y `get_advisors`.

**Out of scope (for future specs):**

- Tabla `parent_children` y padres reales en el perfil.
- CRUD: crear, editar o archivar niños desde la UI; crear salas desde la UI.
- Persistencia del modal `AddKidModal` (sigue mock, SPEC 04 sin cambios de comportamiento).
- Subida de foto, avatar con colores por niño, paginación u ordenamiento configurable.
- Archivo local `supabase/migrations/` (decidido: solo remoto MCP, sin historial en git).
- Cambios en `app/globals.css`, fuentes, sidebar o `data/children.ts` (el mock se conserva como referencia, deja de ser la fuente de `/kids`).

## Data model

```sql
create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.children enable row level security;
```

Policies (misma guardería del `users.daycare_id`, lectura para todo `authenticated`, escritura solo `staff`/`admin`):

```sql
-- rooms
create policy rooms_select_same_daycare on public.rooms
  for select to authenticated
  using (daycare_id = (select daycare_id from public.users where id = (select auth.uid())));
create policy rooms_write_insert_staff on public.rooms
  for insert to authenticated
  with check (daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    and (select role from public.users where id = (select auth.uid())) in ('staff', 'admin'));
create policy rooms_write_update_staff on public.rooms
  for update to authenticated
  using (daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    and (select role from public.users where id = (select auth.uid())) in ('staff', 'admin'))
  with check (daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    and (select role from public.users where id = (select auth.uid())) in ('staff', 'admin'));
create policy rooms_write_delete_staff on public.rooms
  for delete to authenticated
  using (daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    and (select role from public.users where id = (select auth.uid())) in ('staff', 'admin'));

-- children (pertenencia vía su room)
create policy children_select_same_daycare on public.children
  for select to authenticated
  using (exists (
    select 1 from public.rooms r
    join public.users u on u.daycare_id = r.daycare_id
    where r.id = children.room_id and u.id = (select auth.uid())));
create policy children_write_insert_staff on public.children
  for insert to authenticated
  with check (exists (
    select 1 from public.rooms r
    join public.users u on u.daycare_id = r.daycare_id
    where r.id = children.room_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));
create policy children_write_update_staff on public.children
  for update to authenticated
  using (exists (
    select 1 from public.rooms r
    join public.users u on u.daycare_id = r.daycare_id
    where r.id = children.room_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')))
  with check (exists (
    select 1 from public.rooms r
    join public.users u on u.daycare_id = r.daycare_id
    where r.id = children.room_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));
create policy children_write_delete_staff on public.children
  for delete to authenticated
  using (exists (
    select 1 from public.rooms r
    join public.users u on u.daycare_id = r.daycare_id
    where r.id = children.room_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));
```

> **Variante aplicada (2026-10-18):** la escritura se define con una policy por acción (`insert`/`update`/`delete`, 6 en total) en lugar de un único `FOR ALL` por tabla. `CREATE POLICY` de Postgres no admite lista de comandos, y el `FOR ALL` original generaba el WARN `multiple_permissive_policies` (solape de SELECT con la policy de lectura). Mismo significado, criterio 14 limpio.

Seed:

```sql
insert into public.rooms (daycare_id, name)
select d.id, s.name from public.daycares d
cross join (values ('Soles'), ('Estrellas'), ('Arcoíris')) as s(name)
where d.name = 'Guardería Sala Soles';
-- children queda vacía a propósito: sin INSERT.
```

Mapeo DB → UI de `/kids`:

- `full_name` → nombre e inicial derivada. Edad calculada desde `birth_date`.
- `rooms.name` (JOIN) → etiqueta de sala. `enrolled_at` → "Ingreso".
- `allergy_tags` (inglés, ej. `peanut`) → badges con `allergyLabels`/`allergyColors` existentes.
- `medical_notes` → banner de alergias, solo si no es nulo ni vacío.
- `parents`/`avatar.bg` del mock no tienen equivalente DB en este spec.

Convenciones:

- Inglés en código (`rooms`, `children`, `full_name`); etiquetas en español solo en UI.
- `(select auth.uid())` en policies para evitar el WARN `auth_rls_initplan` visto en SPEC 08.

## Implementation plan

1. Verificar estado real: `list_tables(public)` muestra `daycares` + `users`; `pg_type` confirma que `child_status` no existe; `daycares` contiene `Guardería Sala Soles`. Deja el punto de partida confirmado.
2. `apply_migration("create_child_status_enum")` con el `CREATE TYPE`. Deja el enum creado, sin tablas nuevas.
3. `apply_migration("create_rooms_children_tables")` con los dos `CREATE TABLE` + `ENABLE ROW LEVEL SECURITY` + 8 policies (2 SELECT + 6 de escritura, una por acción). Deja las tablas creadas, vacías y cerradas por RLS.
4. `execute_sql` con el seed de 3 rooms (verificando conteo previo de `rooms` para no duplicar). Deja `Soles`, `Estrellas` y `Arcoíris` en Sala Soles y `children` vacía.
5. Verificación DB: `SELECT` de columnas/defaults/FKs, `SELECT` del seed con JOIN a `daycares`, `get_advisors(security)` sin alertas nuevas atribuibles a estas tablas.
6. Wirear el listado: `app/(app)/kids/page.tsx` (Server Component) trae children `active` y el nombre del daycare actual (`utils/current-daycare.ts`) con el cliente server, y `components/kids-directory.tsx` renderiza una lista única con separador = nombre del daycare + contador total, filtrando por nombre en cliente. Verificación: `/kids` muestra el separador con el nombre del daycare y contador 0, y el buscador no rompe en vacío.
7. Wirear el perfil: `app/(app)/kids/[id]/page.tsx` trae el niño por `id` con su room; `notFound()` si no existe, es de otro daycare o no es `active`. Verificación: URL manual de un `id` inexistente → 404.
8. Verificación final: `npm run lint` + `npm run build` y comparación Playwright contra `ninos.dc.html` / `perfil-nino.dc.html` en estado vacío. Verificación: ambos pasan, sin `fetch` directo ni claves nuevas.

## Acceptance criteria

- [x] El tipo `child_status` (`active`, `archived`) existe y ningún otro enum nuevo fue creado.
- [x] `public.rooms` existe con `id uuid PK default gen_random_uuid()`, `daycare_id uuid NOT NULL FK → daycares(id) ON DELETE RESTRICT`, `name text NOT NULL`, `created_at timestamptz NOT NULL default now()`.
- [x] `public.children` existe con `id uuid PK default gen_random_uuid()`, `room_id uuid NOT NULL FK → rooms(id) ON DELETE RESTRICT`, `full_name NOT NULL`, `birth_date NOT NULL`, `enrolled_at NOT NULL default current_date`, `medical_notes` nullable, `allergy_tags text[] NOT NULL default '{}'`, `photo_consent NOT NULL default true`, `status NOT NULL default 'active'`, `created_at`/`updated_at NOT NULL default now()`.
- [x] RLS habilitado en ambas tablas, con policies `rooms_select_same_daycare` + `rooms_write_{insert,update,delete}_staff` y `children_select_same_daycare` + `children_write_{insert,update,delete}_staff` (8 en total, sin solape SELECT).
- [x] `SELECT` del seed devuelve 3 filas en `Guardería Sala Soles`: `Soles`, `Estrellas`, `Arcoíris`.
- [x] `SELECT count(*) FROM public.children` = 0.
- [x] `public` no contiene otra tabla nueva (solo `daycares` + `users` + `rooms` + `children`).
- [x] `/kids` muestra la lista única con separador = nombre del daycare actual y contador 0, sin datos de `data/children.ts`.
- [x] El buscador filtra por nombre ignorando mayúsculas y acentos y no falla con la lista vacía.
- [x] `/kids/<id>` inexistente o no `active` responde 404.
- [x] El perfil muestra nombre, edad derivada, sala, ingreso, badges de `allergy_tags` y banner solo si `medical_notes` existe.
- [x] La card PADRES aparece vacía y el link "Vincular otro padre" se mantiene.
- [x] `npm run lint` pasa; `npm run build` falla por bug interno de Next.js 16.3.6 en `/_global-error` (no relacionado con el código de este spec); el typecheck (`npx tsc --noEmit`) pasa sin errores; el acceso a datos usa solo `utils/supabase/*`, sin `fetch` directo.
- [x] `get_advisors` no reporta alertas nuevas atribuibles a `rooms`/`children` (solo INFO sobre FKs sin índice, aceptado en risks del spec).

## Decisions

- **Yes:** fidelidad total al `db-schema` de referencia, incluyendo `allergy_tags`, `photo_consent` y `child_status`.
- **Yes:** `daycare_id` y `room_id` con `NOT NULL` + `ON DELETE RESTRICT`. No se borra una guardería o sala con filas dependientes.
- **Yes:** las 3 salas cuelgan de `Guardería Sala Soles`. Nombres: `Soles` (exigida) + `Estrellas` y `Arcoíris` (propuestos por el agente, confirmados por el usuario).
- **Yes:** `children` sin seed. La pantalla trabaja en vacío hasta el spec de CRUD.
- **Yes:** policies de lectura y escritura definidas ahora, aunque la UI de este spec solo lee. Evita dejar la escritura abierta o sin definir hasta el CRUD.
- **Yes:** escritura con una policy por acción (`insert`/`update`/`delete`) en lugar de `FOR ALL`. Postgres no admite lista de comandos en `CREATE POLICY` y el `FOR ALL` chocaba con el criterio 14 (WARN `multiple_permissive_policies`). Cambio acordado con el usuario durante la implementación.
- **Yes:** `(select auth.uid())` en las policies. Descarta `auth.uid()` directo: evita el WARN `auth_rls_initplan` aceptado como riesgo en SPEC 08.
- **Yes:** un solo spec para DB + lectura de `/kids` y `/kids/[id]`. Descarta partirlo en dos: el wireado es solo lectura y cabe sin superar las tres áreas.
- **Yes:** guardado en `specs/database/`. Es un spec de base de datos con wireado UI, no un spec solo UI.
- **No:** `parent_children` en este spec. El perfil muestra PADRES vacío hasta su spec propio.
- **No:** crear niños desde `AddKidModal` en este spec. El modal sigue mock (SPEC 04).
- **No:** mostrar `archived` en `/kids`. Solo `active`, ordenado por `full_name`.
- **No:** agrupar `/kids` por salas. Se pidió lista única (decisión del usuario en la implementación) en lugar de las 3 secciones originales del plan; las salas siguen existiendo en DB y la agrupación queda para un spec futuro si se retoma.
- **Yes:** separador con el nombre del daycare actual resuelto en `utils/current-daycare.ts` (helper `cache()` compartido por `app/(app)/layout.tsx` y la página). Descarta query duplicada en la page y descarta el literal "TODOS LOS NIÑOS" (decisión del usuario en la implementación).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Re-ejecutar el mismo nombre de migración falla (`42P07`) | Nombres únicos (`create_child_status_enum`, `create_rooms_children_tables`); verificar `pg_type`/`list_tables` antes de reintentar. |
| Seed duplica rooms si se re-ejecuta | Verificar `SELECT count(*)` previo por `daycare_id` antes del `INSERT`. |
| El perfil pierde avatar-colores y "N padres vinculados" del mockup | Aceptado: inicial y edad se derivan; padres queda vacío por diseño hasta su spec. |
| `children.room_id` sin índice dedicado degrada JOINs futuros | Riesgo aceptado: volumen inicial nulo; crear el índice en el spec de CRUD si `get_advisors` lo marca. |

## What is **not** in this spec

- Tabla `parent_children`, invitación o vinculación real de padres.
- Crear, editar o archivar niños, o crear salas desde la UI.
- Persistencia del modal Agregar niño.
- Fotos, avatares por niño, paginación u ordenamiento configurable.
- Migraciones locales en git ni cambios en `globals.css`, fuentes o sidebar.

Cada uno de esos, si llega, va en su propio spec.

## Verification log

| # | Criterio | Verdicto | Evidencia |
|---|----------|----------|-----------|
| 1 | Enum `child_status` (`active`, `archived`) | ✅ | `execute_sql(pg_type)`: `child_status` → `active`, `archived`. Sin enums nuevos de app. |
| 2 | `public.rooms` columnas/PK/FK/defaults | ✅ | `information_schema.columns`: 4 columnas exactas. `pg_constraint`: PK `rooms_pkey`, FK `rooms_daycare_id_fkey` → `daycares` `confdeltype='r'` (RESTRICT). |
| 3 | `public.children` columnas/PK/FK/defaults | ✅ | `information_schema.columns`: 11 columnas exactas con defaults `gen_random_uuid()`, `CURRENT_DATE`, `'{}'::text[]`, `true`, `'active'::child_status`, `now()`. FK `children_room_id_fkey` → `rooms` RESTRICT. |
| 4 | RLS + 8 policies sin solape SELECT | ✅ | `pg_class`: `relrowsecurity=true` en ambas. `pg_policies`: 8 rows — `rooms_select_same_daycare`, `rooms_write_{insert,update,delete}_staff`, `children_select_same_daycare`, `children_write_{insert,update,delete}_staff`. Una sola SELECT por tabla. |
| 5 | Seed 3 rooms en Sala Soles | ✅ | `SELECT r.name, d.name FROM rooms r JOIN daycares d`: `Arcoíris`, `Estrellas`, `Soles` — todas `Guardería Sala Soles`. |
| 6 | `children` vacía | ✅ | `SELECT count(*) FROM children` → `0`. |
| 7 | Solo 4 tablas en `public` | ✅ | `pg_tables WHERE schemaname='public'`: `children`, `daycares`, `rooms`, `users`. |
| 8 | `/kids` separador + contador 0, sin mock | ✅ | Screenshot `.playwright-mcp/kids-desktop.png`: "GUARDERÍA SALA SOLES 0 niños", "Todavía no hay niños inscriptos." Código: `app/(app)/kids/page.tsx` usa `createClient()` + `getCurrentDaycare()`, no importa `data/children.ts`. |
| 9 | Buscador NFD no falla en vacío | ✅ | Screenshot `.playwright-mcp/kids-search-empty.png`: al tipear "test" el mensaje cambia a "No encontramos niños con ese nombre." Código: `kids-directory.tsx:6-11` `normalize()` con NFD. |
| 10 | `/kids/<id>` inexistente → 404 | ✅ | Navegación a `/kids/00000000-0000-0000-0000-000000000000` → HTTP 404, título "404: This page could not be found." Screenshot `.playwright-mcp/kids-404.png`. Código: `page.tsx:29` `notFound()`. |
| 11 | Perfil: nombre, edad, sala, ingreso, badges, banner condicional | ✅ (código) | `kid-profile.tsx`: renderiza `fullName`, `ageFromBirthDate()`, `roomName`, `formatEnrolledAt()`, `allergyTags.map(allergyBadge)`, banner `hasNotes && <div...>medicalNotes</div>`. No testeable con datos reales (children vacía por diseño). |
| 12 | Card PADRES vacía + link "Vincular otro padre" | ✅ (código) | `kid-profile.tsx:133` pasa `initialParents={[]}`. `kid-parents-card.tsx:54-57` renderiza "Sin padres vinculados todavía." y botón "Vincular otro padre" en línea 87-99. |
| 13 | Lint + build + sin fetch directo | ⚠️ | `npm run lint`: "No issues found". `npx tsc --noEmit`: "No errors found". `npm run build`: falla en `/_global-error` con `InvariantError: Expected workStore to be initialized` (bug interno Next.js 16.3.6 Turbopack, no relacionado con código de app). Grep `fetch\|localStorage\|sessionStorage`: sin coincidencias en `app/` y `components/`. Acceso solo vía `utils/supabase/server.ts`. |
| 14 | `get_advisors` sin alertas nuevas | ✅ | `security`: 3 WARNs preexistentes (`rls_auto_enable` SECURITY DEFINER, leaked password) — no atribuibles a rooms/children. `performance`: INFO `unindexed_foreign_keys` en `children_room_id_fkey` y `rooms_daycare_id_fkey` (aceptado en risks del spec: "volumen inicial nulo; crear índice en spec de CRUD"). WARN `auth_rls_initplan` solo en tabla `users` (SPEC 08). |
