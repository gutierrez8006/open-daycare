# SPEC 05 — Modal "Vincular padre" en `/kids/[id]`

> **Status:** Implementado
> **Depends on:** SPEC 02
> **Date:** 2026-10-03
> **Objective:** Abrir el formulario de `vincular-padre.dc.html` como modal en `/kids/[id]` al pulsar "Vincular otro padre", con validación de nombre y email, y al enviar agregar un padre "pendiente" al mock del niño.

## Scope

**In:**

- Extraer la sección "PADRES VINCULADOS" de `components/kid-profile.tsx` (líneas 92-144) a un nuevo client component `components/kid-parents-card.tsx` que reciba el nombre del niño y la lista inicial de padres, y maneje estado local + modal.
- Nuevo `components/link-parent-modal.tsx` (`"use client"`): réplica visual del mockup `vincular-padre.dc.html` — cabecera "Vincular padre / a [nombre del niño]" con botón X, banner informativo azul, campos Nombre y Email, pills de parentesco (Mamá/Papá/Tutor/a), caja de código de invitación (5 chars alfabéticos aleatorios al abrir), botón "Enviar invitación".
- Formulario controlado con `useState`; validación nombre no vacío y email con regex básico (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`); "Enviar invitación" valida y solo entonces agrega el padre al mock y cierra.
- Al enviar con datos válidos: mutar el array `children` de `data/children.ts` agregando un `ChildParent` con `status: "pending"`, el `relation` seleccionado y un `id` derivado del nombre; el `KidParentsCard` refleja el nuevo padre inmediatamente.
- Cierres: botón X, clic en backdrop y tecla `Esc` cierran sin agregar nada. Scroll del fondo bloqueado mientras el modal está abierto.
- Solo Tailwind con valores arbitrarios de la paleta existente; no se tocan `app/globals.css` ni fuentes.

**Out of scope (for future specs):**

- Envío real de email, API o backend de ningún tipo.
- Persistencia entre recargas; al refrescar la página el padre agregado se pierde (es mock en memoria).
- Intercepting routes, parallel routes `@modal`, ni rutas nuevas.
- Activación real de la cuenta del padre, login del padre, ni feed familiar.
- Edición o eliminación de padres ya vinculados.
- Cambio de `status` de "pending" a "active".

## Data model

Extiende el tipo existente en `data/children.ts`:

```ts
// data/children.ts — cambio en ChildParent
export type ChildParent = {
  id: string;
  name: string;
  relation: "mother" | "father" | "tutor";  // antes solo "mother" | "father"
  status: ParentStatus;
};
```

Estado efímero del modal:

```ts
// components/link-parent-modal.tsx ("use client")
type LinkParentForm = {
  name: string;     // "" inicial, placeholder "Ej. Diego Fernández"
  email: string;    // "" inicial, placeholder "correo@ejemplo.com"
  relation: "mother" | "father" | "tutor"; // default "mother"
};
// const [form, setForm] = useState<LinkParentForm>({...});
// const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
// const [inviteCode, setInviteCode] = useState(generateCode()); // 5 chars alfabéticos uppercase
// generateCode(): Array.from({length: 5}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[random]).join("")
// válido si name.trim() !== "" y email matchea /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// id del nuevo padre: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")
```

## Implementation plan

1. Extender `ChildParent.relation` en `data/children.ts` para incluir `"tutor"`. Agregar helper `generateInviteCode()` que produce 5 chars alfabéticos uppercase. Verificación: `npm run build` pasa sin errores de tipo.
2. Crear `components/kid-parents-card.tsx` (`"use client"`): extraer la sección "PADRES VINCULADOS" de `kid-profile.tsx` (líneas 92-144) a este componente. Recibe `childName: string` y `initialParents: ChildParent[]`. Mantiene estado local `parents` inicializado con `initialParents`. Renderiza la lista y el link "Vincular otro padre". Verificación: `/kids/[id]` se ve igual que antes con los padres existentes.
3. Crear `components/link-parent-modal.tsx` (`"use client"`): modal con backdrop, card `max-w-[480px]`, cabecera "Vincular padre / a [childName]" con X, banner azul informativo, inputs Nombre y Email, pills Mamá/Papá/Tutor/a, caja código invitación con borde dashed, botón "Enviar invitación". Genera código al abrir. Verificación: comparación lado a lado con `vincular-padre.dc.html` en desktop.
4. Wirear validación: nombre no vacío, email regex. Errores inline. "Enviar invitación" con datos válidos: genera `id` a partir del nombre, pushea nuevo `ChildParent` con `status: "pending"` al array `children` de `data/children.ts`, actualiza estado local de `KidParentsCard`, cierra modal y resetea formulario. Verificación: enviar válido agrega padre a la lista con badge "PENDIENTE"; enviar inválido muestra errores.
5. Wirear `KidParentsCard` en `components/kid-profile.tsx`: reemplazar la sección extraída por `<KidParentsCard childName={child.name} initialParents={child.parents} />`. Verificación: la página se ve idéntica; "Vincular otro padre" abre el modal.
6. Cierres: X cierra, backdrop `onClick` cierra, `Esc` cierra (listener con cleanup), scroll del fondo bloqueado (`overflow hidden` en `body` mientras abierto). Verificación: cada vía cierra sin agregar padre.
7. Actualizar `relationLabel` para manejar `"tutor"` → "Tutor/a". Verificación: padre tutor muestra "Tutor/a · pendiente".
8. Verificación final: `npm run lint` + `npm run build` y comparación Playwright contra el `.dc.html`. Verificación: ambos pasan, sin `fetch`/`localStorage`.

## Acceptance criteria

- [x] En `/kids/[id]`, "Vincular otro padre" abre el modal sin cambiar la URL.
- [x] El modal replica el mockup: cabecera "Vincular padre / a [nombre]", card `#FBF4EC` `max-w-[480px]`, banner azul informativo, inputs Nombre y Email con placeholders, pills Mamá/Papá/Tutor/a, caja código dashed con 5 chars, botón "Enviar invitación" gradiente.
- [x] "Enviar invitación" con nombre vacío muestra error inline y no cierra.
- [x] "Enviar invitación" con email inválido (sin `@` o sin dominio) muestra error inline y no cierra.
- [x] "Enviar invitación" con nombre + email válidos agrega un `ChildParent` con `status: "pending"` y el `relation` seleccionado al mock, y la lista de padres refleja el nuevo entry con badge "PENDIENTE".
- [x] El código de invitación es de 5 caracteres alfabéticos y cambia cada vez que se abre el modal.
- [x] Botón X, clic en backdrop y `Esc` cierran el modal sin agregar ningún padre.
- [x] Scroll del fondo bloqueado mientras el modal está abierto.
- [x] `ChildParent.relation` soporta `"tutor"` y se muestra como "Tutor/a" en la lista.
- [x] `npm run lint` y `npm run build` pasan; sin `fetch`, `localStorage` ni `sessionStorage`.

## Decisions

- **Yes:** extender `ChildParent.relation` a `"mother" | "father" | "tutor"`. Descarta mapear tutor a mother: pierde información y el mockup muestra los tres como opciones distintas.
- **Yes:** extraer sección padres a `KidParentsCard` (client component). Descarta convertir `KidProfile` completo a client: mínima superficie de cambio, el resto de la página sigue siendo server component.
- **Yes:** validación email con regex básico (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Descarta validación HTML5 `type="email"` sola: insuficiente para errores inline con estilo. Descarta regex RFC 5322: overengineering para mock.
- **Yes:** código de invitación random (5 chars alfabéticos) al abrir modal. Descarta código estático "7K4P9": cada apertura debe sentirse como una invitación nueva.
- **Yes:** mutar array `children` en memoria al enviar. Descarta callback a server component o re-fetch: no hay DB ni API, y el mock ya es mutable (mismo patrón que `add-kid-modal.tsx`).
- **Yes:** solo visual/mock — sin envío real de email, sin delay de loading. Descarta simular envío con `setTimeout`: agrega complejidad sin valor para un mock.
- **No:** tocar `app/globals.css`, fuentes, sidebar, ni ninguna otra ruta.
- **No:** intercepting routes, parallel routes `@modal`, ni rutas nuevas.
- **No:** persistencia entre recargas, activación real de cuenta, ni cambio de status "pending" → "active".

## What is **not** in this spec

- Base de datos, API, envío real de email o persistencia.
- Activación de cuenta del padre, login, ni feed familiar.
- Edición o eliminación de padres vinculados.
- Intercepting routes ni páginas nuevas.
- Cambios en `globals.css`, fuentes, sidebar o cualquier otra ruta.

## Verification log

| # | Criterio | Veredicto | Evidencia |
|---|----------|-----------|-----------|
| 1 | "Vincular otro padre" abre modal sin cambiar URL | ✅ | URL permaneció `http://localhost:3000/kids/mateo-fernandez` tras clic. `components/kid-parents-card.tsx:89` usa `setOpen(true)` (estado cliente, sin routing). |
| 2 | Modal replica mockup visualmente | ✅ | `components/link-parent-modal.tsx:112` — card `bg-[#FBF4EC] max-w-[480px]`; `:145` — banner azul `bg-[#E3ECFB]`; `:168-187` — inputs con placeholders; `:194-211` — pills Mamá/Papá/Tutor/a; `:215` — caja código `border-dashed`; `:230` — botón gradiente. Screenshots `.playwright-mcp/05-app-modal-desktop.png` vs `.playwright-mcp/05-mockup-desktop.png`. |
| 3 | Nombre vacío → error inline, no cierra | ✅ | Snapshot muestra "Ingresa el nombre del padre/madre", input `[invalid]`, modal permanece abierto. |
| 4 | Email inválido → error inline, no cierra | ✅ | Probado con "invalidemail" (sin @) y "user@nodomain" (sin dominio): ambos muestran "Ingresa un email válido", input `[invalid]`, modal abierto. `link-parent-modal.tsx:30` — regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. |
| 5 | Submit válido agrega padre con badge PENDIENTE | ✅ | Tras enviar "Roberto Gómez" + "roberto@example.com", snapshot muestra nuevo entry "Roberto Gómez" con "Mamá · invitación enviada" y badge "PENDIENTE". `kid-parents-card.tsx:40-44` — push al array `children` + update estado local. |
| 6 | Código 5 chars, cambia al reabrir | ✅ | Códigos observados: 4A2PK → SV8KL → 87QYN → 8RF5X (todos distintos, 5 chars). `data/children.ts:30-35` — `generateInviteCode()` con `useState(generateInviteCode)` (lazy initializer, se ejecuta en cada mount). Nota: el alfabeto incluye dígitos (23456789), coincidiendo con el data model del spec. |
| 7 | X, backdrop y Esc cierran sin agregar padre | ✅ | X: `link-parent-modal.tsx:125`; backdrop onClick: `:107`; Esc listener: `:59-61`. Los tres mecanismos probados y confirmados — modal cierra, ningún padre agregado. |
| 8 | Scroll del fondo bloqueado | ✅ | `document.body.style.overflow` retorna `"hidden"` con modal abierto (`link-parent-modal.tsx:65`). Se restaura en unmount (`:69`). |
| 9 | relation "tutor" → "Tutor/a" en lista | ✅ | `data/children.ts:19` — `ParentRelation` incluye `"tutor"`. `kid-parents-card.tsx:17` — `relationLabel` retorna "Tutor/a". Tras enviar con "Tutor/a" seleccionado, snapshot muestra "Ana López" con "Tutor/a · invitación enviada" + badge "PENDIENTE". |
| 10 | lint + build pasan; sin fetch/localStorage | ✅ | `npm run lint` → "ESLint: No issues found". `npm run build` → "✓ Compiled successfully". `grep` para fetch/localStorage/sessionStorage → "No files found". |
