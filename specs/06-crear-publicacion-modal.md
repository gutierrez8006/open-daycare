# SPEC 06 — Modal "Nueva publicación" en `/`

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-04
> **Objective:** Abrir el formulario de `crear-publicacion.dc.html` como modal overlay al pulsar "Nueva publicación" del sidebar, con selección múltiple de niños y TIPOs, validación de PARA/TIPO/DESCRIPCIÓN y cierre visual sin persistencia.

## Scope

**In:**

- Nuevo `components/create-post-modal.tsx` (`"use client"`): réplica visual del mockup — cabecera "Cancelar | Nueva publicación | Publicar", secciones PARA / TIPO / DESCRIPCIÓN / FOTOS.
- Selector PARA múltiple con toggle: Mateo, Sofía, Benjamín (derivados de `data/children.ts`: nombre, inicial, avatar) + botón "Toda la sala" que selecciona/deselecciona los 3.
- Selector TIPO múltiple con toggle: Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio (identificadores en inglés en código, etiquetas en español).
- Textarea DESCRIPCIÓN controlado, vacío inicial con placeholder "Contá cómo le fue hoy…".
- Sección FOTOS visual no funcional: thumbnail placeholder + botón "Agregar" sin acción.
- Validación: PARA ≥ 1 niño, TIPO ≥ 1, DESCRIPCIÓN no vacía; errores inline por sección; "Publicar" inválido no cierra.
- "Publicar" válido cierra y resetea el formulario, sin crear posts ni navegar (queda en la ruta actual).
- Cierres: "Cancelar", clic en backdrop y tecla `Esc` cierran y resetean; scroll del fondo bloqueado.
- Estado `open` en `components/sidebar.tsx` (componente `Sidebar`), pasado por props a `SidebarContent`, de modo que desktop y drawer móvil compartan una única instancia del modal.
- Solo Tailwind con valores arbitrarios de la paleta del mockup; no se tocan `app/globals.css`, fuentes ni `data/`.

**Out of scope (for future specs):**

- Persistencia, API o base de datos; al publicar no aparece ningún post nuevo en el feed.
- Subida real de fotos, preview, cámara o file picker funcional.
- Single-select de TIPO, selección de más niños que los 3, o datos reales de sala.
- Intercepting routes, parallel routes `@modal` o ruta `/crear-publicacion`.
- Likes, comentarios, edición o detalle de la publicación creada.

## Data model

Este feature no introduce datos persistidos. Reutiliza `data/children.ts` (los 3 primeros: `mateo-fernandez`, `sofia-mendez`, `benjamin-ruiz`) solo para nombre/inicial/avatar. Estado efímero del modal:

```ts
// components/create-post-modal.tsx ("use client")
type PostKind = "meal" | "nap" | "activity" | "achievement" | "mood" | "photo" | "announcement";
// Etiquetas ES: meal→Comida, nap→Siesta, activity→Actividad, achievement→Logro, mood→Ánimo, photo→Foto, announcement→Anuncio
// const [open, setOpen] = useState(false); // vive en Sidebar, se pasa por props
// const [selectedKids, setSelectedKids] = useState<string[]>([]); // ids de children
// const [selectedKinds, setSelectedKinds] = useState<PostKind[]>([]);
// const [description, setDescription] = useState("");
// const [errors, setErrors] = useState<{ kids?: string; kinds?: string; description?: string }>({});
// "Toda la sala" activo si selectedKids.length === 3; clic: si están los 3 → []; si no → [los 3 ids]
// válido si selectedKids.length >= 1 && selectedKinds.length >= 1 && description.trim() !== ""
// Colores pill TIPO seleccionado (del mockup): meal #9A7B1E/#fff, nap #E7DCF6/#7B5FC0, activity #2E89A6/#fff, achievement #CFEBD8/#3E9B6C, mood #F9D2DE/#C56486, photo #FBD8CC/#D9684A, announcement #CCD8F4/#4E72C8; no seleccionado: bg-[#FFFDF9] border-[#ECE0D0] text-[#6E6359]
// Pill niño seleccionado: border-[#3F362E] bg-[#3F362E] text-white; no seleccionado: bg-[#FFFDF9] border-[#ECE0D0] text-[#6E6359]
```

## Implementation plan

1. Crear `components/create-post-modal.tsx` con esqueleto: props `open`, `onClose`, `onPublish`; backdrop + card vacía `max-w-[580px]` con cabecera Cancelar/Nueva publicación/Publicar. Verificación: renderiza cerrado por defecto.
2. Portar sección PARA: pills de los 3 niños desde `data/children.ts` (avatar con `bg`/`fg` de cada child) + "Toda la sala" con lógica selecciona-todo/limpia-todo. Verificación: toggle individual y "Toda la sala" marcan/desmarcan; comparación con `crear-publicacion.dc.html`.
3. Portar sección TIPO: 7 pills multi-toggle con sus colores; sección DESCRIPCIÓN (textarea controlado) y FOTOS (placeholder visual + "Agregar" sin acción). Verificación: lado a lado con el mockup en desktop.
4. Wirear validación + "Publicar": errores inline por sección si falta PARA/TIPO/DESCRIPCIÓN; válido → `onPublish` cierra y resetea. Verificación: Publicar vacío muestra 3 errores y no cierra; completo cierra.
5. Wirear trigger en `components/sidebar.tsx`: estado `open` en `Sidebar`, prop hacia `SidebarContent`; el botón "Nueva publicación" (hoy `onClick={onNavigate}`) abre el modal sin navegar. Verificación: clic abre en `/`, la URL no cambia; funciona desde drawer móvil.
6. Wirear cierres: "Cancelar", backdrop `onClick`, `Esc` (listener con cleanup), scroll-lock de `body`, reset del formulario al cerrar. Verificación: cada vía cierra, resetea y deja la ruta intacta.
7. Pass responsive + verificación final: card con `mx-4` a 375px sin scroll horizontal; `npm run lint` + `npm run build`; comparación Playwright contra el `.dc.html`; sin `fetch`/`localStorage`. Verificación: ambos pasan.

## Acceptance criteria

- [ ] En `/`, "Nueva publicación" del sidebar abre el modal sin cambiar la URL (también desde el drawer móvil).
- [ ] El modal replica el mockup: cabecera Cancelar/Nueva publicación/Publicar, card `#FBF4EC` `max-w-[580px]`, secciones PARA/TIPO/DESCRIPCIÓN/FOTOS.
- [ ] PARA permite 0–3 niños con toggle; "Toda la sala" selecciona los 3 y, si ya están los 3, los limpia.
- [ ] TIPO permite 0–7 selecciones con toggle; cada pill activo usa su color del mockup.
- [ ] "Publicar" sin niño muestra error inline en PARA y no cierra.
- [ ] "Publicar" sin TIPO muestra error inline en TIPO y no cierra.
- [ ] "Publicar" con descripción vacía muestra error inline y no cierra.
- [ ] "Publicar" con PARA + TIPO + DESCRIPCIÓN cierra, resetea y deja el feed con los 3 posts intactos, sin crear datos.
- [ ] "Cancelar", clic en backdrop y `Esc` cierran y resetean quedando en la misma ruta.
- [ ] Scroll del fondo bloqueado mientras el modal está abierto.
- [ ] FOTOS muestra thumbnail placeholder + "Agregar" sin acción (no abre file picker).
- [ ] A 375px no hay scroll horizontal; el card conserva márgenes laterales.
- [ ] `npm run lint` y `npm run build` pasan; sin `fetch`, `localStorage` ni `sessionStorage`.

## Decisions

- **Yes:** modal global montado en `Sidebar` (verificable en `/`). Descarta montar solo en `app/(app)/page.tsx`: el trigger vive en el layout compartido y duplicarlo por ruta es deuda.
- **Yes:** estado `open` en `Sidebar` pasado por props a `SidebarContent`. Descarta `useState` dentro de `SidebarContent`: desktop y drawer lo renderizan a la vez y habría dos instancias del modal.
- **Yes:** niños derivados de `data/children.ts` (3 primeros). Descarta hardcodear: nombre/inicial/colores de avatar ya existen y coinciden con el mockup (`#A9D9E8`, `#F4B8CC`, `#B9DEC4`).
- **Yes:** TIPO múltiple con toggle (pedido explícito). Descarta single-select del patrón SPEC 05: aquí el usuario quiere combinar (p. ej. Comida + Siesta).
- **Yes:** identificadores de TIPO en inglés, etiquetas en español. Sigue la regla de código limpio del repo y SPEC 01; no se extiende `PostType` de `data/mock.ts` porque no se crea ningún post.
- **Yes:** validación con bloqueo + errores inline; "Publicar" es `<button>`, no enlace. Descarta navegar a `feed.dc.html` como el mockup: no hay persistencia y la URL no debe cambiar.
- **Yes:** FOTOS visual no funcional. Descarta file picker: es otro spec cuando haya backend; el botón "Agregar" queda como placeholder.
- **Yes:** cierres Cancelar/backdrop/`Esc` + scroll-lock, igual que SPEC 04/05. Descarta solo Publicar/Cancelar: consistencia con los modales existentes.
- **No:** tocar `app/globals.css`, fuentes, `data/mock.ts`, `data/children.ts` ni ninguna ruta.
- **No:** crear post, actualizar el feed, intercepting routes ni subida de archivos.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `SidebarContent` se renderiza dos veces (desktop + drawer) y duplica el modal | El estado `open` vive en `Sidebar`; una sola instancia de `CreatePostModal` fuera de `SidebarContent`. |
| Los 7 colores de TIPO del mockup no existen como tokens | Valores arbitrarios de Tailwind (`bg-[#E7DCF6]`), igual que SPEC 01/02/04/05. |
| "Toda la sala" con solo 3 de 12 niños confunde | El spec fija "los 3 del selector"; si crece el catálogo, otro spec lo redefine. |

## What is **not** in this spec

- Base de datos, API, persistencia o aparición del post en el feed.
- Subida real de fotos, previews o cámara.
- Ruta `/crear-publicacion`, intercepting routes o páginas nuevas.
- Más niños en el selector, single-select de TIPO o edición de publicaciones.
- Cambios en `globals.css`, fuentes, `data/` o cualquier otra ruta.
