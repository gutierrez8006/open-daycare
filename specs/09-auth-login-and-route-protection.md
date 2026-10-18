# SPEC 09 — Login real y protección de rutas

> **Status:** Aprobado
> **Depends on:** SPEC 03, SPEC 08
> **Date:** 2026-10-18
> **Objective:** Conectar `/login` a Supabase Auth con email y password mediante Server Action y proteger las rutas con el `proxy` para que sin sesión se redirija a `/login` y con sesión no se pueda volver a `(auth)`.

## Por qué existe este spec

SPEC 03 dejó `/login` como mock que navega a `/` sin credenciales y SPEC 08 dejó el usuario staff `Juan Carlos` en `public.users` con su contraparte en `auth.users`. Este spec cierra el hueco entre ambos: la app pasa de demo navegable a app con sesión real, usando el patrón oficial de Supabase SSR para Next.js 16 (`proxy.ts` + `getUser` como gate) documentado vía Context7.

## Scope

**In:**

- `app/(auth)/login/actions.ts` nuevo con `loginAction` (Server Action): `signInWithPassword({ email, password })` con el cliente server (`utils/supabase/server.ts`), `revalidatePath("/", "layout")` y `redirect("/")` en éxito; retorna mensaje de error en español en fallo sin lanzar.
- `components/login-form.tsx` conectado a `loginAction` con `useActionState`: error inline en español, estado `pending` con botón deshabilitado (`Ingresando…`), validación HTML (`required`, `type="email"`, `minLength` en password). Mantiene diseño, panel promo y link a `/activate-account`.
- `utils/supabase/proxy.ts`: `updateSession` pasa de solo refrescar (`getClaims`) a gatear con `getUser` (patrón oficial Supabase vía Context7): sin `user` y en ruta `(app)` o `/` → `redirect` a `/login` (preservando `next` si se quiere); con `user` y en `/login` o `/activate-account` → `redirect` a `/`. Devuelve siempre el `supabaseResponse` con cookies copiadas.
- Logout real: el botón "Cerrar sesión" de `components/sidebar.tsx` (hoy solo `onNavigate`) ejecuta `signOutAction` (`supabase.auth.signOut()` + `redirect("/login")`), en desktop y drawer móvil.
- `proxy.ts` raíz sin cambios de lógica (delega en `updateSession`); se verifica que el `matcher` excluye `_next/static`, `_next/image`, `favicon.ico` y ficheros de imagen.

**Out of scope (for future specs):**

- Activación real de cuentas (`/activate-account` sigue mock; su `push("/")` sin sesión termina en `/login` por el guard, comportamiento aceptado).
- Recuperación de contraseña (link sigue en `#`), cambio de password, signup público, OAuth o magic links.
- Roles (`staff`/`parent`/`admin`) y autorización por rol: este spec solo distingue anónimo vs autenticado.
- Policies RLS nuevas, triggers en `auth.users`, tablas nuevas o cambios de seed.
- Defensa en profundidad en layouts Server Components (doble check `getUser` en `app/(app)/layout.tsx`); el guard vive solo en el `proxy`.

## Data model

Este feature no crea tablas ni enums. Reutiliza `auth.users` (Supabase Auth) y la fila seed de SPEC 08:

```ts
// public.users (SPEC 08) — sin cambios
// id uuid PK FK → auth.users(id), daycare_id → daycares(id), role 'staff', status 'active'
// seed: full_name 'Juan Carlos', email auth juancarlos@google.com
```

Estado efímero del formulario (Client Component con `useActionState`):

```ts
// components/login-form.tsx ("use client")
// type LoginState = { error?: string }; // { error: "Credenciales inválidas. Revisá tu email y contraseña." }
// const [state, formAction, pending] = useActionState(loginAction, {});
// <form action={formAction}> — inputs con name="email" / name="password" (requerido para Server Action)
```

Convenciones:

- Código en inglés (`loginAction`, `signOutAction`, `pending`); copy de UI y errores en español.
- Sin `email`/`password` en `public.users`: viven en `auth.users`.

## Implementation plan

1. Extender `utils/supabase/proxy.ts`: tras `createServerClient`, llamar `supabase.auth.getUser()` (no borrar el aviso de no intercalar lógica entre cliente y check); si `!user` y el pathname no empieza con `/login`, `/activate-account` ni `/auth` → `NextResponse.redirect(/login)`; si `user` y el pathname es `/login` o `/activate-account` → redirect a `/`; devolver `supabaseResponse` con cookies copiadas. Verificación: `npx tsc --noEmit` pasa.
2. Crear `app/(auth)/login/actions.ts` (`"use server"`): `loginAction(_prev, formData)` lee `email`/`password`, valida no vacíos, `createClient().auth.signInWithPassword`, en error retorna `{ error }` en español, en éxito `revalidatePath` + `redirect("/")`. Verificación: importar desde un Server Component compila.
3. Conectar `components/login-form.tsx` a `loginAction` con `useActionState`: `name` en inputs, error inline `role="alert"`, botón deshabilitado en `pending` con texto `Ingresando…`, quita el `router.push("/")` mock. Verificación: `/login` con credenciales malas muestra error y no navega; con buenas navega a `/`.
4. Wirear logout en `components/sidebar.tsx`: el botón con `title="Cerrar sesión"` ejecuta `signOutAction` (misma `actions.ts` o `app/(auth)/actions.ts` si el import cruzado de grupos molesta) y cierra el drawer móvil tras el click. Verificación: click cierra sesión y cae en `/login`; recargar `/` redirige a `/login`.
5. Verificación de guards: sin sesión, `/`, `/kids`, `/kids/[id]` redirigen a `/login`; con sesión, `/login` y `/activate-account` redirigen a `/`; `/activate-account` intacta visualmente. Verificación: Playwright con el usuario seed `juancarlos@google.com`.
6. Pass final: `npm run lint` + `npm run build` y comparación visual de `/login` contra `login.dc.html` (sin regresión de diseño). Verificación: ambos pasan.

## Acceptance criteria

- [ ] Sin sesión, visitar `/` redirige a `/login`.
- [ ] Sin sesión, visitar `/kids` y `/kids/[id]` redirige a `/login`.
- [ ] Con credenciales inválidas, `/login` muestra error inline en español y no navega.
- [ ] Con `juancarlos@google.com` + password válido, `/login` navega a `/` y recargar `/` mantiene la sesión.
- [ ] Con sesión, visitar `/login` redirige a `/`.
- [ ] Con sesión, visitar `/activate-account` redirige a `/`.
- [ ] El botón "Cerrar sesión" del sidebar cierra la sesión y deja al usuario en `/login` (desktop y drawer móvil).
- [ ] Tras logout, `/` vuelve a redirigir a `/login`.
- [ ] El botón de submit se deshabilita mientras ingresa (`Ingresando…`) y los inputs exigen `email`/`password` no vacíos.
- [ ] `/activate-account` no cambia visual ni funcionalmente (salvo heredar los rebotes del guard).
- [ ] `npm run lint` y `npm run build` pasan; sin `fetch` directo a la API de Supabase, sin `service_role`, sin `localStorage`/`sessionStorage` para la sesión.

## Decisions

- **Yes:** Server Action (`loginAction` en `app/(auth)/login/actions.ts`) con cliente server. Descarta `signInWithPassword` desde el browser: las cookies SSR quedan en manos del servidor y el `proxy` las refresca.
- **Yes:** `getUser()` en `utils/supabase/proxy.ts` como gate (patrón oficial Supabase vía Context7: `const { data: { user } } = await supabase.auth.getUser()` + redirect). Descarta mantener solo `getClaims()`: el JWT local no confirma la sesión contra el servidor Auth.
- **Yes:** rebote doble: anónimos → `/login`, autenticados fuera de `(auth)` → `/`. Descarta solo proteger `(app)`: un logueado viendo `/login` es estado incoherente.
- **Yes:** `/activate-account` intacta y siempre "pública" a nivel de proxy, pero su `push("/")` sin sesión termina en `/login`. Descarta tocarla aquí: su flujo real (invitaciones) es otro spec.
- **Yes:** logout en el botón existente del sidebar (desktop + drawer). Descarta página `/logout` o ruta dedicada: el seam ya existe y es donde el usuario lo busca.
- **Yes:** verificar con el seed `juancarlos@google.com` (SPEC 08). Descarta crear otro usuario: el password nunca se commitea y ya hay un staff activo en Sala Soles.
- **Yes:** errores inline en español + `pending` explícito. Descarta toast o `?error=` en URL: el mockup no tiene ese patrón y el form ya es el lugar del error.
- **No:** `service_role`, clientes Supabase nuevos fuera de `utils/supabase/`, ni lógica entre `createServerClient` y el check de sesión (advertencia del template oficial: provoca logouts aleatorios).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `getUser()` suma una llamada Auth por request en el `proxy` | Patrón oficial Supabase; latencia aceptada por corrección. Si mide mal, otro spec evalúa caché o `getClaims` + refresh selectivo. |
| Refresh concurrente con tokens de un solo uso (dos tabs a la vez) | El `proxy` corre una vez por navegación; en paralelo manejar `session: null` con reintento. Limitación documentada de `@supabase/ssr`. |
| Email prellenado `caro@opendaycare.com` ya no existe en Auth | Se mantiene como placeholder del mockup pero el login exige credenciales reales; si confunde, se vacía en implementación. |
| RLS de `users` solo permite `SELECT` propio (SPEC 08) | Post-login, leer otras filas devuelve vacío por policy, no por bug de sesión; revisar policies antes de "arreglar" queries. |
| `/notices` y `/account` no existen (preexistente SPEC 03) | El guard los redirigirá igual si no hay sesión; con sesión darán 404 como hoy. No se crean aquí. |
| Credencial de prueba expuesta en logs/screenshots | Nunca commitear el password; rotarlo tras la verificación (deuda heredada de SPEC 08). |

## What is **not** in this spec

- Signup, invitaciones, `/activate-account` real, recuperación o cambio de contraseña.
- Roles, autorización por rol y policies RLS nuevas.
- Doble check de sesión en `app/(app)/layout.tsx` u otras capas.
- Nuevas rutas, páginas de error dedicadas o toasts globales.
- Cambios en `app/globals.css`, fuentes, `data/` o mockups.
