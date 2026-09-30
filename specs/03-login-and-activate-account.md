# SPEC 03 — Pantallas de login y activación de cuenta

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-30
> **Objective:** Implementar las pantallas `/login` y `/activate-account` replicando `login.dc.html` y `activar-cuenta.dc.html` a pantalla completa, sin selector de rol y sin autenticación real.

## Scope

**In:**

- Reestructurar rutas con route groups: mover el shell (Sidebar + main) de `app/layout.tsx` a `app/(app)/layout.tsx`, junto con `page.tsx` y `kids/`. El layout raíz conserva solo `html`/`body`/fuentes/globals.
- `app/(auth)/login/page.tsx` + `components/login-form.tsx`: panel promo naranja (logo, titular, "Guardería Sala Soles") + formulario de email/contraseña. **Sin el selector "Personal / Familia"** (decisión explícita del usuario).
- `app/(auth)/activate-account/page.tsx` + `components/activate-account-form.tsx`: logo, "Bienvenida a OpenDayCare", card "Te invitaron a seguir a Mateo · Sala Soles", campos código/email/contraseña, checkbox de autorización.
- Links cruzados: "Activá tu cuenta" → `/activate-account`, "Iniciar sesión" → `/login`.
- Campos controlados con valores prellenados del mockup; ambos formularios navegan a `/` al enviar.
- Responsive: ≤767px se oculta el panel promo del login; sin scroll horizontal a 375px.

**Out of scope (for future specs):**

- Autenticación real, validación de credenciales, sesión, logout.
- Recuperación de contraseña ("¿Olvidaste tu contraseña?" queda en `#`).
- Selector de rol Personal/Familia y el feed de familias (`familia-feed`).
- Nuevos datos o persistencia de cualquier tipo.
- Cambios en `app/globals.css` o las fuentes (ya los hizo SPEC 01).

## Data model

Este feature no introduce datos nuevos. La card de invitación lee de `data/children.ts`:

```ts
getChild("mateo-fernandez")  // → name "Mateo", initial "M", room "Soles"
```

Estado de los formularios (componentes cliente):

```ts
// components/login-form.tsx
const [email, setEmail] = useState("caro@opendaycare.com");
const [password, setPassword] = useState("");   // placeholder "••••••••"

// components/activate-account-form.tsx
const [code, setCode] = useState("7K4P9");
const [email, setEmail] = useState("lucia.fernandez@gmail.com");
const [password, setPassword] = useState("");
const [authorized, setAuthorized] = useState(true);  // mockup: tildada
// ambos onSubmit → router.push("/")
```

## Implementation plan

1. Crear `app/(app)/layout.tsx` con el shell movido de `app/layout.tsx`; mover `app/page.tsx` → `app/(app)/page.tsx` y `app/kids/` → `app/(app)/kids/`; el raíz queda sin Sidebar. Verificación: `npx next typegen && npx tsc --noEmit` pasa; `/` y `/kids` siguen iguales con sidebar.
2. Crear `app/(auth)/login/page.tsx` con panel promo + markup del formulario (sin lógica). Verificación: `/login` renderiza a pantalla completa, sin sidebar.
3. Crear `components/login-form.tsx` (`"use client"`, `useState` + `router.push("/")`). Verificación: el email es editable y el submit llega a `/`.
4. Crear `app/(auth)/activate-account/page.tsx` (resuelve `getChild("mateo-fernandez")` y hace `notFound()` si falta) + `components/activate-account-form.tsx` con checkbox toggleable. Verificación: `/activate-account` muestra a Mateo y el formulario.
5. Wirear links cruzados login ↔ activate-account y "¿Olvidaste tu contraseña?" → `#`. Verificación: navegación ida y vuelta.
6. Pass responsive: panel promo oculto ≤767px, sin scroll horizontal. Verificación: DevTools a 375px y 1440px.
7. Verificación final: `npm run lint` + `npm run build` y comparación lado a lado con los dos `.dc.html` vía Playwright.

## Acceptance criteria

- [ ] `/login` renderiza sin sidebar; `/` y `/kids` conservan el sidebar.
- [ ] `/login` no muestra el selector "Personal / Familia".
- [ ] Email prellenado `caro@opendaycare.com` y editables; al enviar se navega a `/`.
- [ ] "Activá tu cuenta" → `/activate-account` y "Iniciar sesión" → `/login`.
- [ ] "¿Olvidaste tu contraseña?" apunta a `#`.
- [ ] `/activate-account` muestra la card con "Mateo · Sala Soles" y el avatar "M", provenientes de `data/children.ts`.
- [ ] Checkbox de autorización tildada por defecto y con toggle funcional.
- [ ] "Activar mi cuenta" navega a `/`.
- [ ] Ambas pantallas usan el fondo `#FBF4EC`, Fredoka/Nunito y la paleta del mockup.
- [ ] ≤767px no hay panel promo en `/login` ni scroll horizontal a 375px.
- [ ] `npm run lint` y `npm run build` pasan; sin `fetch`, `localStorage` ni `sessionStorage`.

## Decisions

- **Yes:** route groups `(app)` / `(auth)`. El sidebar del raíz no puede acompañar a pantallas full-screen; ocultarlo por `usePathname()` mezclaría nav con layout.
- **Yes:** rutas en inglés `/login` y `/activate-account` (convención del spec 02).
- **Yes:** sin selector de rol → destino único `/`. El mockup bifurcaba a `feed`/`familia-feed`; solo existe el feed del personal.
- **Yes:** "Activar mi cuenta" → `/` en vez de crear un stub de `familia-feed` (fuera de alcance).
- **Yes:** inputs controlados prellenados; checkbox tildada por defecto como en el mockup.
- **Yes:** datos de invitación desde `data/children.ts` (`getChild("mateo-fernandez")`).
- **Yes:** panel promo oculto ≤767px (el mockup no define móvil; un bloque de marketing sobre el form estorba).
- **No:** validación de email/contraseña ni autenticación de ningún tipo.
- **No:** pantalla de recuperación de contraseña → link `#`.
- **No:** tocar `globals.css` ni las fuentes.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Mover `page.tsx` y `kids/` invalida los tipos `PageProps`/`LayoutProps` generados | Regenerar con `npx next typegen` antes de considerar roto el typecheck (paso 1). |
| Comparar inline-styles del mockup contra Tailwind produce desvíos visuales | Igual que spec 01: valores arbitrarios (`bg-[#FBF4EC]`) y comparación Playwright lado a lado. |
| El sidebar ya linkea `/notices` y `/account` inexistentes (preexistente, no de este spec) | No se toca aquí; queda anotado para un spec de esas rutas. |

## What is **not** in this spec

- Autenticación, validación de credenciales, sesión o logout.
- Selector Personal/Familia y el feed de familias.
- Recuperación de contraseña.
- Base de datos, API, persistencia o datos nuevos.
