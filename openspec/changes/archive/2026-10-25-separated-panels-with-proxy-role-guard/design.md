# Design

## Context

El proxy actual (`utils/supabase/proxy.ts`) refresca la sesión (` getUser()`) y redirige rutas públicas/privadas, pero no conoce el rol. El grupo `app/(app)/` aloja el panel staff en URLs `/` y `/kids/*`, y su layout ya consulta `users.role` (solo para el UI del sidebar). El panel familia existe solo como mockups (`familia-feed`, `familia-cuenta`) o placeholder. Restricción de proyecto: no insertar lógica entre `createServerClient` y `getClaims()`/consulta del proxy en `utils/supabase/proxy.ts`, y no borrar el refresco de sesión (causa logouts aleatorios). El copy y las rutas en español; el mockup manda sobre el código.

## Goals / Non-Goals

**Goals:**
- Un usuario `parent` nunca interactúa con rutas staff ni viceversa, ni siquiera por URL escrita a mano.
- Fuente única de verdad para autorizar: `users.role` en BD, leída por request en el proxy (compatible con rol mutable: un staff que pasa a padre es enrutado al request siguiente, sin re-emitir claims ni logout forzado).
- Simetría de URLs con prefijo explícito: `/staff/*` y `/familia/*`, con `/` como resolutor de rol.

**Non-Goals:**
- RLS de base de datos (specs posteriores según convención del proyecto).
- Contenido funcional del panel familia (otro change; aquí solo placeholders de contenido).
- Mecanismo/UI para cambiar el rol de un usuario (otra spec futura, requiere definir quién autoriza).
- `role` en JWT/app_metadata (descartado, ver Decisiones).

## Decisions

1. **Rol leído de la BD por request en el proxy** (en vez de guardarlo en app_metadata y leerlo del claim). Alternativa descartada: claims JWT — cero queries por request, pero requiere trigger que mantenga claim y tabla sincronizados y mecanismo de re-emisión/cache-invalidation al mutar el rol. La mutabilidad del rol (staff → padre) rompe esa coherencia; una query por request en una app de guardería es despreciable, y el layout ya consulta el perfil en cada request. Consecuencia aceptada (ver Riesgos): proxy y layout hacen dos consultas separadas al perfil; no hay `React.cache()` fuera del árbol React.

2. **URLs con prefijo simétrico + `/` resolutor (Opción B)**, en vez de staff en `/` y familia bajo `/familia` (Opción A). El resolutor vive en el proxy: cuando existe sesión y `pathname` es `/`, redirect a `/staff` o `/familia` reutilizando ya el rol obtenido para el guard misma request (sin query extra). Alternativa A requiere un refactor asimétrico más tarde cuando familia también necesite URLs propias; el costo hoy de B es restringir hrefs del sidebar y `revalidatePath`.

3. **Estructura de carpetas**: `app/(staff)/staff/...` y `app/(familia)/familia/...` — los route groups reservan el layout propio de cada panel sin tocar las URLs. `app/(app)/` se elimina (renombrado). `Metadata`/`LayoutProps` de cada página se actualizan al tipo de ruta que corresponde (`/staff`, `/familia`).

4. **Guard de rol en dos capas** (defense-in-depth):
   - Proxy (1ª línea): bloquea/redirige antes de resolver secciones. Redirige a `/` para el panel opuesto (el resolutor decide), o a `/login` si no hay sesión.
   - Layout de cada panel (2ª línea): si el rol no corresponde, `redirect(...)` sin renderizar hijos. El layout de `(staff)` reutiliza la consulta de perfil que ya hace (le extiende la selección a `role`), no agrega una query.

5. **Panel familia como placeholder mínimo**: `/familia` y `/familia/cuenta` muestran contenido estry re-cortado (layout con bottom-nav 2 tabs del mockup) sin funcionalidad. Solo para que el flujo redirect → panel familia de parent sea comprobable; el feed real es otro change.

6. **Flujo post-login sin cambios de lógica**: `loginAction` sigue con `redirect('/')` y el resolutor (proxy) decide el panel. No se pasa rol por la URL ni se consulta en la action. `activate-account` no cambia (se logout y va a `/login?activated=1`).

## Risks / Trade-offs

- [Query de rol extra por request (proxy ≠ layout, sin cache React fuera del árbol)] → Aceptada por diseño: escala trivial para guardería, y la claridad (una fuente de verdad) pesa más. Si más adelante se midiera el costo, se evaluaría cache en cookie de sesión, no antes.
- [`revalidatePath`/`router.push`/hrefs desfasados tras el renombrado] → task específica de auditoría: buscar todas las cadenas de rutas (`"/"`, `"/kids"`, `revalidatePath("/", "layout")`) y actualizarlas; el cambio de URLs es **BREAKING** para bookmarks, pero es app de dominio móvil y no hay URLs publicadas.
- [El proxy debe correr en runtime Node (necesita cliente Supabase)] → Next 16 con Turbopack: el middleware corre como `proxy.ts` en Node por defecto en este proyecto; no se agrega config sin necesidad.
- [Un rol cambiado en BD mientras hay sesión con permisos cacheados en layout Server Component] → No hay cache de rol en componente; cada request re-resuelve. No existe el riesgo de staleness más allá del request en vuelo.
