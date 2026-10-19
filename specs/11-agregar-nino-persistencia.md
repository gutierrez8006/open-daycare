# SPEC 11 — Persistencia del modal "Agregar niño" (INSERT real en `children`)

> **Status:** Draft
> **Depends on:** SPEC 04, SPEC 10
> **Date:** 2026-10-18
> **Objective:** Conectar el modal "Agregar niño" de `/kids` a la DB real: salas desde `rooms` y guardado del niño en `children` vía Server Action.

## Por qué existe este spec

SPEC 04 dejó el modal `AddKidModal` como formulario cliente sin persistencia (cerraba sin guardar nada) y sus opciones de Sala derivaban de `data/children.ts`. SPEC 10 creó `rooms` y `children` con RLS y dejó `/kids` leyendo la DB, con escritura polida pero sin UI que la use. Este spec cierra ese ciclo: el primer CRUD real de niños (solo INSERT), con el catálogo de salas real.

## Scope

**In:**

- `app/(app)/kids/page.tsx`: fetch server de las `rooms` del daycare actual (ya resuelto por `utils/current-daycare.ts`) vía `utils/supabase/server.ts`, y chequeo de `users.role` para ocultar el botón "Agregar niño" cuando el rol no es `staff` ni `admin`.
- Nuevo `app/(app)/kids/actions.ts` con `"use server"`: Server Action `createKid` que valida, normaliza y hace `INSERT` en `public.children`.
- Conversión de fecha: `dd/mm/aaaa` (validación de calendario real) → `YYYY-MM-DD` para `birth_date`.
- `allergy_tags`: texto libre del input, `split(",")` + `trim()` por ítem, vacío → `'{}'`. Sin mapeo a catálogo.
- `medical_notes`: `""` → `NULL` al insertar.
- Defaults de DB sin enviar: `enrolled_at = current_date`, `photo_consent = true`, `status = 'active'`.
- `components/add-kid-modal.tsx`: recibe `rooms: { id: string; name: string }[]` como prop; el `<select>` de Sala usa esas opciones (default: la primera de la lista, que es "Soles" en el seed); llama al Server Action; muestra error inline en español si falla (modal abierto, reintentable); cierra y refresca la lista solo si el insert ok (`revalidatePath("/kids")`).
- Eliminar del modal la dependencia de `data/children.ts` para las opciones de Sala (el archivo sigue existiendo como referencia de alergias/colores en el listado y perfil, según SPEC 10).
- Verificación E2E: crear un niño real, verlo en `/kids` y en `/kids/[id]`; caso de error (room inválida) muestra inline.

**Out of scope (for future specs):**

- Editar o archivar niños (`UPDATE`/`DELETE` de `children`).
- Crear, editar o eliminar salas desde la UI.
- Subida de foto y `photo_consent` como campo editable del formulario.
- `enrolled_at` editable (queda el default `current_date`).
- Vinculación de padres (`parent_children`), spec propio.
- Mapeo de alergias a catálogo enum ni select múltiple de alergias.
- Toasts/notifications globales; paginación u ordenamiento configurable.
- Cambios en `app/globals.css`, fuentes, sidebar, `data/children.ts` o `utils/supabase/*`.

## Data model

No se crea ni modifica esquema: se escribe en las tablas existentes del SPEC 10. Estado y payload nuevos:

```ts
// components/add-kid-modal.tsx ("use client")
type AddKidForm = {
  fullName: string;    // trim() no vacío
  birthDate: string;   // "dd/mm/aaaa", calendario real, no futura
  roomId: string;      // uuid; default = rooms[0].id
  allergies: string;   // texto libre, "Ej. Maní, Lactosa"
  medicalNotes: string;// "" inicial
};
// props nuevas: rooms: { id: string; name: string }[]
// se elimina: const rooms = [...new Set(children.map(c => c.room))]

// app/(app)/kids/actions.ts ("use server")
type CreateKidInput = {
  fullName: string;
  birthDate: string;   // "dd/mm/aaaa" — se convierte a "YYYY-MM-DD" en el action
  roomId: string;
  allergies: string;
  medicalNotes: string;
};
type CreateKidResult =
  | { ok: true; id: string }
  | { ok: false; error: string };  // mensaje en español, sin filtrar detalles internos de RLS

// INSERT en public.children (columnas enviadas)
{
  full_name: trimmed,
  birth_date: "YYYY-MM-DD",
  room_id: roomId,
  medical_notes: trimmed === "" ? null : trimmed,
  allergy_tags: allergies.split(",").map(t => t.trim()).filter(Boolean)
  // enrolled_at, photo_consent, status: defaults de la tabla
}
```

Convenciones: código en inglés, copy en español. El Server Action corre con el cliente del usuario autenticado (`utils/supabase/server.ts`), por lo que RLS (`children_write_insert_staff`) decide si el INSERT pasa.

## Implementation plan

1. `app/(app)/kids/page.tsx`: traer `rooms` del daycare actual (JOIN con `daycares` ya resuelto en `getCurrentDaycare()` o query propia con `createServerClient`) y el `role` del usuario; pasar `rooms` al componente que monta el modal y ocultar el botón "Agregar niño" si `role ∉ {staff, admin}`. Verificación: con usuario staff el botón se ve; rooms llegan al cliente (log temporal o React DevTools).
2. Crear `app/(app)/kids/actions.ts` con `createKid`: validación (nombre trim no vacío, fecha `dd/mm/aaaa` con `Date` real y no futura, `roomId` no vacío), conversión a `YYYY-MM-DD`, `insert(...).select("id")`, `revalidatePath("/kids")`, resultado tipado `CreateKidResult`; errores de cualquier origen → `{ ok: false, error: "No pudimos guardar el niño. Revisá los datos e intentá de nuevo." }`. Verificación: `npx tsc --noEmit` pasa.
3. `components/add-kid-modal.tsx`: prop `rooms`, select poblado con `rooms.map(r => <option value={r.id}>{r.name}</option>)`, default `rooms[0].id`; quitar import de `data/children.ts`. Verificación: el select lista Soles/Estrellas/Arcoíris.
4. `components/add-kid-modal.tsx`: "Guardar" valida con las reglas nuevas (calendario real + no futura, mensajes inline en español), en `pending` deshabilita Guardar, llama `createKid`; `ok:false` muestra error inline y no cierra; `ok:true` cierra y la lista ya muestra el niño (por `revalidatePath`). Verificación E2E en dev: crear "Zeta Prueba" en Estrellas → aparece en `/kids` ordenada por nombre y su perfil renderiza.
5. Verificación final: `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm run build`, y Playwright comparando el modal contra `references/pantallas/agregar-nino.dc.html` (desktop y 375px) más los casos: fecha futura rechazada, error inline con room inválida, botón oculto según rol. Verificación: todo pasa, sin `fetch` directo ni `localStorage`.

## Acceptance criteria

- [ ] El `<select>` de Sala lista las rooms reales del daycare desde la DB (Soles, Estrellas, Arcoíris) sin importar `data/children.ts`.
- [ ] "Guardar" válido crea una fila en `children` con `full_name`, `birth_date` (fecha real convertida), `room_id`, `medical_notes` (NULL si vacío) y `allergy_tags` (split por coma + trim; `'{}'` si vacío).
- [ ] El insert NO envía `enrolled_at`, `photo_consent` ni `status`; la fila queda con `current_date`, `true` y `'active'`.
- [ ] Nombre vacío (solo espacios) muestra error inline y no inserta.
- [ ] Fecha fuera de `dd/mm/aaaa`, inexistente en el calendario (ej. `31/02/2022`) o futura muestra error inline y no inserta.
- [ ] Tras guardar exitoso el modal cierra y `/kids` muestra el niño nuevo en el orden por `full_name`, y su tarjeta linkea a un perfil que renderiza.
- [ ] Si el INSERT falla (ej. `room_id` ajeno a la guardería o RLS denegado), el modal queda abierto con error inline en español y no se crea fila.
- [ ] El botón "Agregar niño" no se renderiza para usuarios cuyo rol no es `staff` ni `admin`.
- [ ] "Cancelar", backdrop y `Esc` siguen cerrando sin guardar (comportamiento del SPEC 04 preservado).
- [ ] Mientras el action está en `pending`, "Guardar" está deshabilitado (sin doble insert).
- [ ] `npm run lint` y `npx next typegen && npx tsc --noEmit` pasan; el acceso a datos usa solo `utils/supabase/*` dentro del Server Action, sin `fetch` directo ni `service_role`.
- [ ] `npm run build` pasa (ver Risks: bug preexistente de Next 16.3.6 en `/_global-error`).
- [ ] Sin cambios en tablas: `list_tables` sigue mostrando `daycares`, `users`, `rooms`, `children`.

## Decisions

- **Yes:** reutilizar el `AddKidModal` del SPEC 04. Descarta ruta `/kids/new`: el usuario confirmó el mismo modal, y el cambio de "mock a real" cabe en el componente existente.
- **Yes:** Server Action en `app/(app)/kids/actions.ts` con `"use server"` + cliente de `utils/supabase/server.ts`. Descarta Route Handler: el formulario es cliente de una página, el action es el canal nativo y da `revalidatePath` gratis.
- **Yes:** `rooms` se fetchan en `app/(app)/kids/page.tsx` (server) y se pasan como prop. Descarta que el modal las pida al abrirse: menos round-trips, sin estado de carga extra.
- **Yes:** ocultar el botón "Agregar niño" si `users.role` no es `staff`/`admin`. Decisión del usuario; la RLS igualmente es la última barrera (defense in depth).
- **Yes:** alergias como texto crudo separado por coma (split + trim, sin mapeo). Decisión del usuario; el mapeo a `allergyLabels` queda para spec futuro si se pide.
- **Yes:** defaults de DB para `enrolled_at`, `photo_consent` y `status` (no se envían desde el action). Menos código, un solo lugar define los defaults.
- **Yes:** validación de fecha con calendario real + no futura, sobre el formato `dd/mm/aaaa` ya existente. Descarta cambiar a input nativo `type="date"`: se conserva el look del mockup.
- **Yes:** error inline en el modal (queda abierto, reintentable) en lugar de toast. Decisión del usuario; no hay sistema de toasts en el proyecto.
- **Yes:** éxito = cerrar + `revalidatePath("/kids")` (la lista se refresca server-side, el niño aparece ordenado por `full_name`). Descarta navegar al perfil: el flujo staff suele registrar varios seguidos.
- **Yes:** el spec va en `specs/11-...` y no en `specs/database/`: no toca esquema, solo UI + DML. La numeración `11` es global en todo `specs/`.
- **No:** editar `data/children.ts` ni borrarlo: SPEC 10 lo conservó como referencia de badges de alergias.
- **No:** editar el perfil ni agregar tablas/columnas.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `npm run build` falla en `/_global-error` con `InvariantError: Expected workStore to be initialized` (bug interno de Next 16.3.6 Turbopack, detectado al verificar SPEC 10) | Preexistente y ajeno a este spec. Gates reales: `lint` + `tsc --noEmit`. Se reintenta build al actualizar Next. |
| Fechas "válidas" por regex pero imposibles (`31/02/2022`) | Validación con `new Date()` real (mes 1–12, día dentro del mes) además del regex. |
| `room_id` de otra guardería lo rechaza RLS con error opaco | El action traduce cualquier error a mensaje genérico en español; no se filtra el detalle de Postgres. |
| Doble submit rápido duplica niños | Botón "Guardar" deshabilitado mientras `pending`. |
| `getCurrentDaycare()` cacheada con `cache()` puede no tener rooms listas al primer render | Mismo patrón del SPEC 10 para children: el await del fetch de rooms va en el Server Component antes de renderizar el modal. |

## What is **not** in this spec

- Editar o archivar niños; crear salas desde la UI.
- `enrolled_at` y `photo_consent` editables; subida de foto.
- Vinculación de padres (`parent_children`).
- Mapeo de alergias a catálogo ni select múltiple.
- Toasts, paginación, ordenamiento configurable.
- Cambios de esquema, `globals.css`, fuentes, sidebar o `data/children.ts`.

Cada uno de esos, si llega, va en su propio spec.
