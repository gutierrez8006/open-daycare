# SPEC 12 — Vinculación real de padre: invitaciones por email y registro con código

> **Status:** Borrador
> **Depends on:** SPEC 07, SPEC 08, SPEC 09, SPEC 10, SPEC 11
> **Date:** 2026-10-19
> **Objective:** Crear la vinculación real de un padre con un niño: invitación con código enviada con Resend desde el modal de `/kids/[id]`, tablas `invitations`/`parent_children` con RLS, y registro del padre en `/activate-account?code=…` que consume la invitación.

## Por qué existe este spec

SPEC 05 dejó el modal "Vincular padre" como mock en memoria (padre `pending` agregado a un array, código generado en el cliente, sin email) y SPEC 10/11 dejaron `children`/`rooms` reales, el modal Agregar niño persistido y la card PADRES vacía. Este spec cierra el ciclo de la familia: el staff invita de verdad, sale un correo de verdad, y el padre se registra consumiendo esa invitación. Es también el spec del trigger en `auth.users` que SPEC 08 dejó explícitamente para después, y obliga a corregir la policy de lectura de `children` porque a partir de acá existen usuarios con rol `parent`.

## Scope

**In:**

- Migración remota (MCP `apply_migration`): `CREATE TYPE public.relationship_type` (`father`, `mother`, `guardian`) y `CREATE TYPE public.invitation_status` (`pending`, `accepted`, `expired`, `cancelled`), fieles a `opendaycare-database-schema.md:10-20`.
- Migración remota: `CREATE TABLE public.invitations` y `CREATE TABLE public.parent_children` fieles a `opendaycare-database-schema.md:103-134`, con FKs `ON DELETE RESTRICT` (misma convención que SPEC 10) y `UNIQUE (parent_id, child_id)`.
- `ENABLE ROW LEVEL SECURITY` + policies: `invitations` (SELECT/INSERT/UPDATE para `staff`/`admin` del mismo daycare; sin DELETE) y `parent_children` (SELECT para el propio padre o `staff`/`admin` del daycare; sin policies de escritura: el vínculo lo crea la RPC `SECURITY DEFINER`).
- Índices: `invitations (child_id)`, `invitations (email)`, índice parcial `invitations (child_id, email) WHERE status = 'pending'`, `parent_children (parent_id)`, `parent_children (child_id)`.
- Reemplazo de la policy de lectura de `children` del SPEC 10: `staff`/`admin` siguen viendo todos los niños de su daycare; un `parent` ve solo los niños vinculados en `parent_children`. Ídem `rooms`.
- RPC `public.get_invitation_preview(p_code text)` (`SECURITY DEFINER`, `grant execute to anon`): devuelve `child_name`, `room_name`, `daycare_name`, `email`, `expires_at` solo si el código está `pending` y sin vencer. RPC `public.accept_invitation(p_code text)` (`SECURITY DEFINER`, `grant execute to authenticated`): valida código vigente + email del JWT, crea el vínculo e invalida la invitación.
- Trigger `AFTER INSERT` en `auth.users` (`handle_new_parent_user`, `SECURITY DEFINER`): si el signup trae `invitation_code` en `raw_user_meta_data`, valida la invitación pendiente vigente con email coincidente y crea la fila en `public.users` (`role='parent'`, `daycare_id` derivado del niño, `full_name` de la invitación) o falla atómicamente si el código no sirve. El rol nunca se toma de metadata.
- Dependencia `resend` + `utils/email/invitations.ts`: cliente Resend (lazy) y `sendInvitationEmail({ to, parentName, childName, code, expiresAt, activationUrl })` con plantilla HTML de la paleta de la app y fallback de texto plano.
- `app/(app)/kids/[id]/actions.ts` (`"use server"`): `createInvitation({ childId, fullName, email, relationship })` → valida, exige `staff`/`admin`, cancela invitaciones pendientes previas del mismo `child_id`+`email`, genera código único de 5 caracteres, inserta la invitación, envía el email y, si el envío falla, marca `cancelled` y devuelve error.
- `components/link-parent-modal.tsx`: pasa a flujo servidor (`useTransition` + `router.refresh()`), deja de generar el código en el cliente y muestra el código real en un estado de éxito.
- `components/kid-parents-card.tsx`: deja de importar `data/children.ts`; recibe `parents` reales y `canInvite` por props.
- `app/(app)/kids/[id]/page.tsx`: lee `parent_children` + `users` (vinculados, `ACTIVA`) y `invitations` pendientes del niño (`PENDIENTE`), resuelve el rol del usuario y pasa `canInvite`.
- `app/(auth)/activate-account/page.tsx` + `components/activate-account-form.tsx` + `app/(auth)/activate-account/actions.ts`: `/activate-account?code=XXXXX` real, con estado inválido/vencido, email prellenado y `activateAccountAction`.
- Aviso de éxito en `/login?activated=1`.
- `.env.template`: placeholders `RESEND_API_KEY` y `RESEND_FROM_EMAIL`.

**Out of scope (for future specs):**

- Feed de familia (`/familia-feed`), panel de padres y cualquier UI de rol `parent`: tras activar, el padre inicia sesión y cae en el `/` actual.
- Reenvío de invitación, listado de invitaciones, cancelación manual desde la UI y renovación de códigos vencidos (se genera una invitación nueva desde el modal).
- Marcado automático de `status='expired'` (sin cron): el vencimiento se evalúa por `expires_at`.
- Recuperación/cambio de contraseña, OAuth, magic links y alta pública sin invitación.
- Editar o desvincular padres ya vinculados.
- Adjuntos, imágenes o branding dinámico en el email más allá de la plantilla fija.
- Entregabilidad real (dominio verificado, DKIM/SPF), cola de reintentos de email.
- Cambios en `data/children.ts`, `app/globals.css`, fuentes o sidebar.

## Data model

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  invited_by uuid not null references public.users(id) on delete restrict,
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete restrict,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);
```

Policies:

```sql
-- invitations: solo staff/admin del daycare del niño
create policy invitations_select_staff on public.invitations
  for select to authenticated
  using (exists (
    select 1 from public.children c
    join public.rooms r on r.id = c.room_id
    join public.users u on u.daycare_id = r.daycare_id
    where c.id = invitations.child_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));
create policy invitations_insert_staff on public.invitations
  for insert to authenticated
  with check (invited_by = (select auth.uid()) and exists (
    select 1 from public.children c
    join public.rooms r on r.id = c.room_id
    join public.users u on u.daycare_id = r.daycare_id
    where c.id = invitations.child_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));
create policy invitations_update_staff on public.invitations
  for update to authenticated
  using (exists (
    select 1 from public.children c
    join public.rooms r on r.id = c.room_id
    join public.users u on u.daycare_id = r.daycare_id
    where c.id = invitations.child_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')))
  with check (exists (
    select 1 from public.children c
    join public.rooms r on r.id = c.room_id
    join public.users u on u.daycare_id = r.daycare_id
    where c.id = invitations.child_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));

-- parent_children: el padre se ve a sí mismo, staff/admin ven todo su daycare
create policy parent_children_select_own_or_staff on public.parent_children
  for select to authenticated
  using (
    parent_id = (select auth.uid())
    or exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = parent_children.child_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));

-- children: se reemplaza children_select_same_daycare del SPEC 10
drop policy children_select_same_daycare on public.children;
create policy children_select_staff_or_own_parent on public.children
  for select to authenticated
  using (
    exists (select 1 from public.parent_children pc
            where pc.child_id = children.id and pc.parent_id = (select auth.uid()))
    or exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id and u.id = (select auth.uid()) and u.role in ('staff', 'admin')));

-- rooms: se reemplaza rooms_select_same_daycare del SPEC 10
drop policy rooms_select_same_daycare on public.rooms;
create policy rooms_select_staff_or_own_parent on public.rooms
  for select to authenticated
  using (
    exists (select 1 from public.users u
            where u.id = (select auth.uid()) and u.daycare_id = rooms.daycare_id and u.role in ('staff', 'admin'))
    or exists (
      select 1 from public.parent_children pc
      join public.children c on c.id = pc.child_id
      where c.room_id = rooms.id and pc.parent_id = (select auth.uid())));
```

RPCs y trigger:

```sql
-- Preview anónimo: solo campos necesarios para la pantalla, nunca el estado interno
create or replace function public.get_invitation_preview(p_code text)
returns table (child_name text, room_name text, daycare_name text, email text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.full_name, r.name, d.name, i.email, i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  join public.daycares d on d.id = r.daycare_id
  where i.code = upper(trim(p_code)) and i.status = 'pending' and i.expires_at > now();
$$;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;

-- Aceptación: devuelve el nombre del niño, o NULL si no se pudo
create or replace function public.accept_invitation(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_inv public.invitations; v_uid uuid := auth.uid();
begin
  if v_uid is null then return null; end if;
  select * into v_inv from public.invitations
    where code = upper(trim(p_code)) and status = 'pending' and expires_at > now()
    for update;
  if v_inv is null then return null; end if;
  if lower(v_inv.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then return null; end if;
  insert into public.parent_children (parent_id, child_id, relationship)
  values (v_uid, v_inv.child_id, v_inv.relationship)
  on conflict (parent_id, child_id) do update set relationship = excluded.relationship;
  update public.invitations set status = 'accepted', accepted_at = now() where id = v_inv.id;
  return (select c.full_name from public.children c where c.id = v_inv.child_id);
end; $$;
grant execute on function public.accept_invitation(text) to authenticated;

-- Alta del perfil: solo actúa si el signup trae código de invitación
create or replace function public.handle_new_parent_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_inv public.invitations; v_daycare uuid;
begin
  if not (new.raw_user_meta_data ? 'invitation_code') then
    return new;  -- alta manual (staff) como en SPEC 08
  end if;
  select * into v_inv from public.invitations
    where code = upper(trim(new.raw_user_meta_data ->> 'invitation_code'))
      and status = 'pending' and expires_at > now()
      and lower(email) = lower(new.email);
  if v_inv is null then
    raise exception 'invalid_invitation';
  end if;
  select r.daycare_id into v_daycare
    from public.children c join public.rooms r on r.id = c.room_id where c.id = v_inv.child_id;
  if v_daycare is null then raise exception 'invalid_invitation'; end if;
  insert into public.users (id, daycare_id, role, status, full_name)
  values (new.id, v_daycare, 'parent', 'active', v_inv.full_name);
  return new;
end; $$;

create trigger on_auth_user_created_parent
  after insert on auth.users
  for each row execute function public.handle_new_parent_user();
```

Estado y payloads de la app:

```ts
// utils/email/invitations.ts (server only)
type InvitationEmail = {
  to: string;            // email de la invitación
  parentName: string;    // invitations.full_name
  childName: string;     // children.full_name
  code: string;          // 5 chars [A-Z2-9] sin ambiguos
  expiresAt: Date;       // +7 días
  activationUrl: string; // `${origin}/activate-account?code=${code}`
};
// sendInvitationEmail(payload): Promise<{ ok: true } | { ok: false; error: string }>

// app/(app)/kids/[id]/actions.ts ("use server")
type CreateInvitationInput = {
  childId: string;       // uuid
  fullName: string;      // trim no vacío
  email: string;         // regex básico, se normaliza a minúsculas
  relationship: "mother" | "father" | "guardian"; // valores DB; labels en español
};
type CreateInvitationResult =
  | { ok: true; code: string; email: string }
  | { ok: false; error: string };  // español, sin detalles internos

// app/(app)/kids/[id]/page.tsx → props de la card
type KidParentEntry = {
  id: string;                                 // parent_children.id o invitations.id
  name: string;
  relationship: "mother" | "father" | "guardian";
  status: "active" | "pending";
};

// app/(auth)/activate-account/actions.ts ("use server")
type ActivateState = { error?: string };
// inputs del form: code (hidden/readonly), email, password, authorized (checkbox)
```

Convenciones: código en inglés, copy en español; los valores de `relationship` son los del enum de Postgres y la traducción (`Mamá`/`Papá`/`Tutor/a`) vive en la UI; `data/children.ts` deja de ser la fuente de padres y se conserva como referencia.

## Implementation plan

1. Prerequisitos manuales (fuera del repo): cuenta Resend con API key y remitente `onboarding@resend.dev`; en el Dashboard de Supabase, Auth → "Confirm email" desactivado y password mínimo 6. Verificación: un signup manual de prueba con email+password devuelve sesión inmediata sin correo de Supabase.
2. `npm install resend` y `.env.template`: `RESEND_API_KEY=` y `RESEND_FROM_EMAIL=onboarding@resend.dev` (valores reales en `.env`, gitignored). Verificación: `npx tsc --noEmit` sin cambios de comportamiento.
3. Verificar estado real en la DB: `list_tables` (4 tablas), `pg_type` sin `relationship_type`/`invitation_status`, `pg_trigger` sin triggers en `public`/`auth`. Verificación: punto de partida confirmado.
4. `apply_migration("create_invitation_enums")` con los 2 `CREATE TYPE`. Verificación: `pg_enum` muestra los 2 enums nuevos y ningún otro.
5. `apply_migration("create_invitations_parent_children")` con las 2 tablas + `ENABLE ROW LEVEL SECURITY` + 4 policies + índices. Verificación: `list_tables` = 6 tablas; `pg_policies` sin solape de SELECT.
6. `apply_migration("invitation_rpcs_and_auth_trigger")` con `get_invitation_preview`, `accept_invitation`, `handle_new_parent_user` y el trigger, más los `grant execute`. Verificación: `execute_sql` prueba `get_invitation_preview('AAAAA')` → 0 filas sin error.
7. `apply_migration("restrict_parent_child_room_visibility")`: reemplazo de `children_select_same_daycare` y `rooms_select_same_daycare`. Verificación: `get_advisors` sin alertas nuevas; consultas de staff siguen devolviendo lo mismo.
8. `utils/email/invitations.ts`: cliente Resend lazy (error claro si falta `RESEND_API_KEY`) + `sendInvitationEmail`. Verificación: envío manual con un código dummy a la casilla dueña de Resend → el correo llega y el HTML renderiza código, vencimiento y botón.
9. `app/(app)/kids/[id]/actions.ts`: `createInvitation` (rol, validaciones, cancelar pendientes previas, código único con reintento ante `23505`, insert, email, cancelación si el envío falla, `revalidatePath`). Verificación: `npx next typegen && npx tsc --noEmit`; insertar una invitación desde el server y ver la fila y el email.
10. `components/link-parent-modal.tsx`: `useTransition`, errores inline en español, caja de código con placeholder antes de enviar y código real en el estado de éxito; llama `onInvited()` para refrescar. Verificación: E2E con un niño real → fila nueva en `invitations` e email recibido.
11. `components/kid-parents-card.tsx` + `app/(app)/kids/[id]/page.tsx` + `components/kid-profile.tsx`: props reales (`parents`, `canInvite`), sin import de `data/children.ts`, `router.refresh()` tras invitar, botón oculto si el rol no es `staff`/`admin`. Verificación: el perfil muestra el padre `PENDIENTE` recién invitado y los vinculados como `ACTIVA`.
12. `app/(auth)/activate-account/page.tsx` + `components/activate-account-form.tsx`: lee `searchParams.code`, llama `get_invitation_preview` con el cliente server (anon), estados "código inválido/vencido" (link a `/login`) y formulario con email prellenado, password + checkbox; deja de usar `getChild("mateo-fernandez")`. Verificación: `?code=` válido muestra el niño real; código inexistente muestra el estado de error.
13. `app/(auth)/activate-account/actions.ts`: `activateAccountAction` — valida password (≥6) y checkbox, revalida el código contra `get_invitation_preview` (el email debe coincidir), `signUp` con `options.data = { invitation_code, full_name }`, si el email ya existe hace `signInWithPassword` y continúa, luego `rpc("accept_invitation")`, `signOut()` y `redirect("/login?activated=1")`; cualquier fallo → error inline en español. Verificación E2E: activar con código válido crea `public.users` + `parent_children`, la invitación queda `accepted` y cae en `/login` con aviso; email distinto al de la invitación → error y sin cuenta.
14. `/login` muestra el aviso de cuenta activada cuando llega `?activated=1` (banner chico, sin tocar el diseño base). Verificación: tras activar, el aviso se ve y desaparece al navegar.
15. Verificación final: `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm run build`; RLS probada con `execute_sql` (padre ve solo su niño; staff ve todos); `get_advisors` (security/performance) sin alertas nuevas atribuibles a este spec; Playwright comparando el modal contra `references/pantallas/vincular-padre.dc.html` (desktop y 375px).

## Acceptance criteria

- [ ] Los enums `relationship_type` (`father`, `mother`, `guardian`) e `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) existen y ningún otro enum nuevo fue creado.
- [ ] `public.invitations` y `public.parent_children` existen con las columnas, defaults, FKs y `UNIQUE (parent_id, child_id)` del spec; `public` pasa a tener 6 tablas.
- [ ] RLS habilitado en ambas tablas nuevas, con las 4 policies del spec y sin policies de escritura en `parent_children`.
- [ ] La policy de lectura de `children` (y `rooms`) ya no expone todos los niños a un `parent`: con `execute_sql` simulando un padre, solo se ve su niño; el staff sigue viendo todos los de su daycare.
- [ ] `get_invitation_preview('CODIGO')` devuelve niño, sala, daycare, email y vencimiento solo si la invitación está `pending` y sin vencer; con un código inexistente, vencido o `accepted` devuelve 0 filas y no expone datos.
- [ ] `createInvitation` con datos válidos inserta una fila en `invitations` (`invited_by` = usuario actual, `code` de 5 caracteres único, `expires_at` = +7 días, `status='pending'`) y devuelve el código.
- [ ] El email de invitación llega a la casilla de pruebas con el nombre del niño, el código y el link `/activate-account?code=…`; sin `RESEND_API_KEY` o con Resend caído, la invitación queda `cancelled`, no hay código muerto y el modal muestra error inline en español.
- [ ] Invitar dos veces al mismo email para el mismo niño deja la anterior `cancelled` y una sola invitación `pending` vigente.
- [ ] El modal ya no genera el código en el cliente: antes de enviar la caja muestra un placeholder y, tras el envío exitoso, el código real que se envió por email.
- [ ] El botón "Vincular otro padre" no se renderiza si el rol del usuario no es `staff` ni `admin`; con `staff` sí, y el insert lo autoriza RLS.
- [ ] El perfil del niño lista los padres reales: vinculados como `ACTIVA` y pendientes como `PENDIENTE`, incluyendo la invitación recién enviada tras el `router.refresh()`.
- [ ] `/activate-account?code=…` con código válido muestra el nombre real del niño y el email prellenado; con código inválido, vencido o ausente muestra el estado de error con link a `/login`.
- [ ] Activar con el email correcto crea la fila en `public.users` (`role='parent'`, `daycare_id` del niño), el vínculo en `parent_children`, marca la invitación `accepted` con `accepted_at`, y redirige a `/login?activated=1` con el aviso visible.
- [ ] Activar con un email distinto al de la invitación (o con código vencido) muestra error inline y no crea usuario ni vínculo.
- [ ] Un signup con código inválido/vencido no deja usuario en `auth.users` (el trigger falla y revierte).
- [ ] Un padre ya registrado puede aceptar una segunda invitación usando su email y contraseña actuales (login + `accept_invitation`), sin duplicar su fila en `users`.
- [ ] `npm run lint` y `npx next typegen && npx tsc --noEmit` pasan; el acceso a datos usa solo `utils/supabase/*` y el email solo se envía desde el servidor con `resend`, sin `service_role` y sin `fetch` directo a la API de Supabase.
- [ ] `get_advisors` no reporta alertas nuevas atribuibles a este spec.

## Decisions

- **Yes:** un solo spec para DB + email + modal + activación. Decisión del usuario, aceptando que es más grande que los specs previos.
- **Yes:** el email de invitación es la verificación del padre. Se desactiva la confirmación de email de Supabase Auth (prerequisite del paso 1) y `signUp` deja sesión inmediata; un solo correo en lugar de dos.
- **Yes:** remitente `onboarding@resend.dev` (pruebas). Descarta dominio verificado: no hay dominio propio en el proyecto.
- **Yes:** email HTML con la paleta de la app, código y botón al link de activación, con fallback de texto plano.
- **Yes:** el código se genera en el servidor al enviar y el modal muestra el código real en el estado de éxito. Descarta el preview del cliente: garantiza que lo mostrado sea lo guardado y enviado.
- **Yes:** `relationship_type` usa los valores del esquema (`guardian` para Tutor/a) y la UI traduce. Descarta mantener `"tutor"` en la capa de datos: evita un mapeo en cada lectura.
- **Yes:** alta de `public.users` por trigger `AFTER INSERT` en `auth.users`, con `role='parent'` y `daycare_id` derivados de la invitación. Nunca se toma `role`/`daycare_id` de `raw_user_meta_data`.
- **Yes:** el trigger solo actúa cuando el signup trae `invitation_code`; el resto de altas (staff manual, como SPEC 08) sigue su camino actual.
- **Yes:** lectura anónima del código por RPC `SECURITY DEFINER` acotada a campos no sensibles. Descarta una policy de SELECT para `anon`: expondría emails de todas las invitaciones pendientes.
- **Yes:** aceptación por RPC `accept_invitation` que valida código vigente + email del JWT y hace el vínculo marcando `accepted`. Descarta insertar `parent_children` desde el Server Action con el cliente del usuario: la escritura quedaría gobernada por policies más amplias.
- **Yes:** invitación duplicada cancela la anterior y genera código nuevo. Evita dos códigos válidos para el mismo par email+niño.
- **Yes:** si Resend falla, la invitación se marca `cancelled` y el modal avisa inline. No quedan códigos vigentes que nadie recibió.
- **Yes:** tras activar, `signOut` y `redirect("/login?activated=1")` con aviso. Decisión del usuario; el feed de familia no existe todavía.
- **Yes:** si el email ya está registrado, `activateAccountAction` hace `signInWithPassword` con la contraseña ingresada y luego `accept_invitation`. Resuelve el caso de un padre que recibe una segunda invitación (hermanos).
- **Yes:** reemplazo de las policies de SELECT de `children` y `rooms` para que un `parent` solo vea lo vinculado. Sin esto, el rol `parent` vería todos los niños del daycare.
- **Yes:** `ON DELETE RESTRICT` en `invitations.child_id`/`invited_by` y `parent_children.child_id`, `CASCADE` en `parent_children.parent_id`. Consistente con SPEC 10: nada se borra de la DB; el vínculo cae con el usuario.
- **Yes:** estados `expired` sin cron: el vencimiento se evalúa con `expires_at > now()`.
- **Yes:** hooks nuevos en `app/(auth)/activate-account/actions.ts` y `app/(app)/kids/[id]/actions.ts` (`"use server"`), siguiendo el patrón de SPEC 11.
- **Yes:** `data/children.ts` se conserva sin cambios como referencia (badges de alergias), pero deja de alimentar la card de padres.
- **Yes:** el spec va en `specs/database/` y no en `specs/`: crea tablas, enums, policies, RPCs y un trigger. La numeración `12` es global en todo `specs/`.
- **No:** `service_role` en la app, reenvío de invitaciones, panel de invitaciones, feed de familia, cambio de contraseña, borrar/editar vínculos.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al email dueño de la cuenta Resend | Suficiente para dev y verificación; el paso 1 documenta que la entrega real requiere dominio verificado (fuera de alcance). |
| `get_invitation_preview` devuelve el email de la invitación y es llamable por `anon` | Código de 5 caracteres alfanuméricos (≈39M combinaciones) y solo devuelve invitaciones `pending` vigentes; riesgo de enumeración aceptado y anotado. Si molesta, otro spec agrega rate limiting o email enmascarado. |
| Fallo entre `signUp` y `accept_invitation` deja un `auth.users` + `public.users` sin vínculo | El action reintenta aceptar en el mismo request; si igual falla, el usuario puede iniciar sesión con su contraseña y volver a activar con el código (el `parent_children` es idempotente vía `ON CONFLICT`). |
| Confirmaciones de email de Supabase reactivadas por error | El flujo asume sesión inmediata; queda documentado como prerequisite. Si se reactivan, el signup no devuelve sesión y `accept_invitation` falla: mensaje genérico y sin vínculos creados. |
| El build de Next 16.3.6 falla en `/_global-error` (`InvariantError: Expected workStore to be initialized`) | Bug preexistente desde SPEC 10/11, ajeno a este spec. Gates reales: `lint` + `tsc --noEmit` + Playwright. |
| La RLS endurecida rompe consultas existentes de `/kids` | Los specs 10/11 usan usuarios `staff`; la rama staff de las policies nuevas es equivalente a la anterior. Se verifica con `execute_sql` y E2E antes de cerrar. |
| Brute force del código contra `accept_invitation` | La RPC exige sesión autenticada y email coincidente; sin código vigente no hay creación de vínculos. |
| Trigger `SECURITY DEFINER` sobre `auth.users` | `search_path` fijo a `public`, solo actúa con `invitation_code` presente y no otorga permisos extra; se verifica con `get_advisors` y un signup inválido de prueba. |
| El email del remitente puede caer en spam | Riesgo de entregabilidad aceptado en este spec (dev). |

## What is **not** in this spec

- Feed de familia, panel de padres y cualquier ruta para el rol `parent`.
- Reenvío/cancelación manual de invitaciones desde la UI y limpieza de códigos vencidos.
- Alta pública sin invitación, OAuth, magic links, recuperación o cambio de contraseña.
- Desvincular o editar padres ya vinculados.
- Dominio propio verificado, deliverability, reintentos y cola de emails.
- `data/children.ts`, `globals.css`, fuentes, sidebar u otras rutas.

Cada uno de esos, si llega, va en su propio spec.
