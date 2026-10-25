# Proposal

## Why

La app tiene un único grupo de rutas (`app/(app)/`) que actúa como panel staff de facto, y el proxy solo valida sesión, no rol. Cualquier usuario autenticado con `role = 'parent'` puede hoy navegar todo el panel del staff (niños, invitaciones, crear publicaciones). Los mockups (`references/pantallas/login` y `familia-*`) ya definen dos paneles separados por rol; conviene pautar la separación antes de construir el panel familia encima de las rutas actuales.

## What Changes

- **BREAKING**: Las URLs del panel staff pasan de `/` y `/kids/*` a `/staff` y `/staff/kids/*`; `/` se convierte en resolutor de rol (redirect a `/staff` o `/familia` según `users.role`).
- El proxy (`utils/supabase/proxy.ts` / `proxy.ts`) valida el rol en cada request leyendo `users.role` de la BD (fuente única de verdad): rutas `/staff/*` bloqueadas para `role ≠ 'staff'` y rutas `/familia/*` bloqueadas para `role ≠ 'parent'`.
- Route groups reorganizados: `app/(app)/` → `app/(staff)/` (guard de rol defensivo en el layout) y nuevo `app/(familia)/` (guard de rol + layout propio).
- Se crea el panel familia como placeholder mínimo (`/familia`, `/familia/cuenta` placeholder contenido): solo control de acceso, sin funcionalidad real.
- El rol queda esperado como **mutable** (un staff puede pasar a padre); el pipeline de autorización lo tolera por diseño (rol leído de BD por request, no por claim). La UI/mecanismo para cambiar el rol es otra spec futura — no forma parte de este change.
- `loginAction` sigue redirigiendo a `/`; el resolutor decide el panel según rol.

## Capabilities

### New Capabilities

- `role-based-panel-access`: Control de acceso basado en rol de los dos paneles de la app — resolutor de `/` por rol, guard de rol en el proxy por URL, guards defensivos en los layouts de cada panel, y redirect post-login por rol. No incluye RLS de base de datos (specs posteriores) ni el contenido funcional del panel familia.

### Modified Capabilities

Ninguno.

## Impact

- **Código**: `proxy.ts`, `utils/supabase/proxy.ts` (guard de rol), `app/(app)/*` (renombrado a `app/(staff)/*` + prefijo `/staff` en URLs), `app/(auth)/login/actions.ts` (sin cambios funcionales, conserva redirect a `/`), `components/sidebar.tsx` y `components/create-post-modal.tsx` (hrefs y `revalidatePath` al nuevo prefijo).
- **BD**: solo lectura de `users.role` (columna existente). Sin migraciones, sin policies (RLS en specs posteriores), sin cambios de esquema.
- **No funcional**: sin cambios al flujo de `activate-account` (cierra sesión y va a `/login?activated=1`); refresco de sesión `getClaims()` permanece intacto según las reglas del proyecto.
