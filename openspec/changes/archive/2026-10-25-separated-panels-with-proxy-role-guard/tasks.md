# Tasks

## 1. Renombrado del panel staff a prefijo `/staff`

- [x] 1.1 Renombrar `app/(app)/` → `app/(staff)/staff/` (feed, kids, kids/[id]) con las URLs `/staff`, `/staff/kids`, `/staff/kids/[id]`; actualizar `LayoutProps`/tipos de ruta con `npx next typegen && npx tsc --noEmit`
- [x] 1.2 Actualizar hrefs internos del panel (`components/sidebar.tsx`, enlaces de `kids/[id]`, botón "nueva publicación" de `page.tsx`) a `/staff/*`; verificar navegación visual con `npm run dev` + Playwright
- [x] 1.3 Auditar y actualizar referencias de rutas encima del prefijo: `revalidatePath` en actions (`app/(app)/actions.ts`, `app/(app)/kids/[id]/actions.ts`), `redirect` de `loginAction`/`signOutAction` y `router.push`/`navigate` en componentes client; verificar con `npm run lint && npm run build`

## 2. Guard de rol en el proxy

- [x] 2.1 Extender `utils/supabase/proxy.ts`: tras la resolución de sesión, consultar `users.role` del usuario autenticado y registrar reglas — `/staff/*` solo `staff`, y redirect a `/` (re-enruta) o `/login` según corresponda; preservar intacto el refresco de sesión existente (sin código entre `createServerClient` y la resolución de sesión)
- [x] 2.2 Añadir al mismo guard la redirección por rol de `/`: autenticado → `/staff` o `/familia` según `users.role`; anónimo → `/login` (verificar que no agrega una segunda consulta de rol en la misma request)
- [x] 2.3 Verificar el guard con login real de un `staff` y un `parent` seeds: parent no accede a `/staff/*`, staff no accede a `/familia/*`, `/` re-rutearía a cada uno (evidencia en la dev server con Playwright)

## 3. Panel familia placeholder + guard del layout

- [x] 3.1 Crear `app/(familia)/familia/layout.tsx` con guard defensivo (rol `parent` requerido, redirect a `/staff` si no corresponde) y bottom-nav placeholder de 2 tabs (Feed, Mi cuenta) encima del mockup `familia-feed.dc.html` (solo shell visual, sin datos)
- [x] 3.2 Crear `/familia` (feed placeholder) y `/familia/cuenta` (cuenta placeholder) con contenido mínimo estático y `LayoutProps` correcto; verificar tsc
- [x] 3.3 Agregar guard defensivo equivalente al layout de `(staff)`: rol `staff` requerido, redirect a `/` si no corresponde, sin query extra (reutiliza el select de perfil existente
- [x] 3.4 Verificar flujo completo e2e manual con Playwright: login staff → `/staff`, login parent → `/familia`, staff a `/staff/feed` panel familia OK, parent a staff redirect, sesión vencida refresco + guard intacto

## Verificación final

- [ ] 4.1 `npm run lint` + `npm run build` + `npx tsc --noEmit` limpios
  > Estado parcial (2026-10-25): `npm run lint` ✓ y `npx tsc --noEmit` ✓ pasan; `npm run build` falla en `/_global-error` con `Invariant: Expected workStore to be initialized` — bug **preexistente** verificado en baseline (build falla igual con los cambios del change en stash). No es causado por este change.
- [x] 4.2 Recorrer los escenarios del spec `role-based-panel-access` en el navegador y contradictories en las respuestas (root resolver, guards por rol, post-login, mutabilidad de rol en seeds)
