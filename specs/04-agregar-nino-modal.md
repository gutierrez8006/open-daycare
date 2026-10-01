# SPEC 04 — Modal "Agregar niño" en `/kids`

> **Status:** Aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-10-01
> **Objective:** Abrir el formulario de `agregar-nino.dc.html` como modal en `/kids` al pulsar "Agregar niño" y volver a `/kids` al guardar, sin base de datos.

## Scope

**In:**

- Cambiar el trigger "Agregar niño" de `app/(app)/kids/page.tsx` (hoy `<a href="#">`) por un botón cliente que abre el modal sin cambiar la URL.
- Nuevo `components/add-kid-modal.tsx` (`"use client"`): réplica visual del mockup — cabecera "Cancelar | Agregar niño | Guardar", campos Nombre completo, Fecha de nacimiento, Sala (select), Alergias, Notas médicas.
- Formulario controlado con `useState`; "Guardar" valida nombre + fecha y solo entonces cierra (queda en `/kids`); "Cancelar", clic en backdrop y tecla `Esc` cierran siempre.
- Backdrop oscurecido, card `max-w-[520px]` con márgenes laterales en móvil, foco inicial en Nombre, scroll del fondo bloqueado.
- Solo Tailwind con valores arbitrarios de la paleta existente (`#FBF4EC`, `#ECE0D0`, `#D9583C`, etc.); no se tocan `app/globals.css` ni fuentes.

**Out of scope (for future specs):**

- Persistencia, API o base de datos de ningún tipo; al cerrar no se crea ningún niño ni cambia el contador.
- Rutas `/kids/new`, intercepting routes o parallel routes `@modal`.
- Edición, validación de fecha real de calendario, subida de foto o autocompletado.
- Selector de sala con datos reales (las opciones se derivan de lo que ya existe).

## Data model

Este feature no introduce datos persistidos. Reutiliza `data/children.ts` solo para las opciones de Sala. Estado efímero del modal:

```ts
// components/add-kid-modal.tsx ("use client")
type AddKidForm = {
  fullName: string;    // "" inicial, placeholder "Ej. Martina López"
  birthDate: string;   // "" inicial, placeholder "dd/mm/aaaa"
  room: string;        // default "Soles"
  allergies: string;   // "" inicial, placeholder "Ej. Maní, Lactosa"
  medicalNotes: string;// "" inicial
};
// const [open, setOpen] = useState(false);
// const [form, setForm] = useState<AddKidForm>({...});
// const [errors, setErrors] = useState<{ fullName?: string; birthDate?: string }>({});
// rooms = [...new Set(children.map(c => c.room))] // hoy ["Soles"]
// válido si fullName.trim() !== "" y birthDate matchea /^\d{2}\/\d{2}\/\d{4}$/
```

## Implementation plan

1. Crear `components/add-kid-modal.tsx` con esqueleto: botón "Agregar niño" + modal cerrado por defecto (backdrop + card vacía con la cabecera del mockup). Verificación: el botón existe y el modal no se ve hasta abrirlo.
2. Portar los 5 campos del mockup a Tailwind (labels `text-[12px] font-extrabold tracking-[.7px] text-[#94887B]`, inputs `rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white`), Sala como `<select>` con las rooms derivadas. Verificación: comparación lado a lado con `agregar-nino.dc.html` en desktop.
3. Hacer el formulario controlado (`useState` por campo) + validación nombre no vacío y fecha `dd/mm/aaaa` con error inline; "Guardar" bloquea si inválido, cierra si válido. Verificación: Guardar vacío muestra errores y no cierra; con nombre+fecha válida cierra.
4. Wirear el trigger en `app/(app)/kids/page.tsx`: reemplazar `<a href="#">` por el componente cliente. Verificación: clic abre modal, URL sigue siendo `/kids`.
5. Wirear cierres: "Cancelar" cierra, backdrop `onClick` cierra, `Esc` cierra (listener con cleanup), scroll del fondo bloqueado (`overflow hidden` en `body` mientras `open`). Verificación: cada vía deja `/kids` intacto con sus 8 tarjetas.
6. Pass responsive + a11y básico: card con `mx-4` a 375px sin scroll horizontal, foco inicial en Nombre. Verificación: DevTools 375px y 1440px.
7. Verificación final: `npm run lint` + `npm run build` y comparación Playwright contra el `.dc.html`. Verificación: ambos pasan, sin `fetch`/`localStorage`.

## Acceptance criteria

- [ ] En `/kids`, "Agregar niño" abre el modal sin cambiar la URL.
- [ ] El modal replica el mockup: cabecera Cancelar/Agregar niño/Guardar, card `#FBF4EC` `max-w-[520px]`, inputs con placeholders del mockup.
- [ ] "Guardar" con nombre vacío o fecha fuera de `dd/mm/aaaa` muestra error inline y no cierra.
- [ ] "Guardar" con nombre + fecha válidos cierra y deja `/kids` con las 8 tarjetas intactas, sin crear datos.
- [ ] "Cancelar", clic en backdrop y `Esc` cierran el modal quedando en `/kids`.
- [ ] Sala es un `<select>` funcional con default "Soles" (opciones derivadas de `data/children.ts`).
- [ ] Foco inicial en Nombre y scroll del fondo bloqueado mientras el modal está abierto.
- [ ] A 375px no hay scroll horizontal; el card conserva márgenes laterales.
- [ ] `npm run lint` y `npm run build` pasan; sin `fetch`, `localStorage` ni `sessionStorage`.

## Decisions

- **Yes:** estado cliente local con `useState` (sin cambio de URL). Descarta intercepting route `/kids/new` + `@modal`: más simple, sin URL compartible pero suficiente sin DB y sin sorpresas de tipos `LayoutProps`/`PageProps`.
- **Yes:** "regresar a `/kids`" = cerrar el modal (la URL nunca cambió). Cubre Guardar válido, Cancelar, backdrop y `Esc`.
- **Yes:** formulario controlado con validación nombre + fecha. Descarta "solo visual": el usuario lo pidió explícito; el resto de campos quedan opcionales.
- **Yes:** Sala como `<select>` funcional con default "Soles" y opciones derivadas de `data/children.ts`. Se aparta del mockup (div estático) por decisión explícita del usuario.
- **Yes:** responsive "card con margen" (`mx-4`, `max-w-[520px]`). Descarta full-screen móvil: el mockup no define móvil y el card con margen ya funciona a 375px.
- **Yes:** a11y básica (foco inicial, `Esc`, scroll-lock). Descarta focus-trap + `aria-modal` estricto: sobra para un formulario sin persistencia.
- **No:** tocar `app/globals.css`, fuentes, `data/children.ts` ni `data/mock.ts`.
- **No:** crear niño, actualizar contador "8 niños" ni navegar a otra ruta al guardar.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `page.tsx` es server component y el trigger necesita `useState` | El estado vive en el nuevo componente cliente; `page.tsx` solo lo importa, como `KidsDirectory` ya hace. |
| Comparar inline-styles del mockup contra Tailwind produce desvíos | Valores arbitrarios (`bg-[#FBF4EC]`, `border-[#EADFD0]`) y comparación Playwright lado a lado, igual que SPEC 01/02. |
| `children.map(room)` hoy da una sola sala ("Soles") y el select parece estático | Aceptado: el select existe y funciona; cuando haya DB las opciones crecen sin cambiar el componente. |

## What is **not** in this spec

- Base de datos, API, persistencia o creación real del niño.
- Ruta `/kids/new`, intercepting routes o página completa de agregar.
- Validación de fecha real de calendario, foto, edición o vinculación de padres.
- Cambios en `globals.css`, fuentes, sidebar o cualquier otra ruta.
