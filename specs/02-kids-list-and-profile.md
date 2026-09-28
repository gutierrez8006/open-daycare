# SPEC 02 — Listado y perfil de niños (`/kids`)

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-09-27
> **Objective:** Implementar las pantallas de listado y perfil de niños (`/kids` y `/kids/[id]`) como interfaces estáticas con datos ficticios, replicando fielmente `ninos.dc.html` y `perfil-nino.dc.html`.

## Scope

**In:**

- Ruta `/kids` (`app/kids/page.tsx`): cabecera "GESTIÓN / Niños", botón "Agregar niño", buscador, separador "SALA SOLES — 8 niños" y grilla de 2 columnas con las 8 tarjetas del mockup.
- Ruta `/kids/[id]` (`app/kids/[id]/page.tsx`): perfil con avatar, datos, banner de alergias, filas de datos y card "PADRES VINCULADOS".
- `data/children.ts`: tipos + enum de alergias con labels y colores + los 8 niños ficticios con sus padres.
- Componentes: `components/kid-card.tsx`, `components/kids-directory.tsx` (cliente, con búsqueda), `components/kid-profile.tsx`.
- Sidebar: href de "Niños" → `/kids` y estado activo resuelto con `usePathname()` (`Feed` activo solo en `/`, `Niños` activo en `/kids` y `/kids/[id]`).
- Búsqueda en cliente por nombre, ignorando mayúsculas y acentos.
- Responsive: 2 columnas ≥768px, 1 columna ≤767px, sin scroll horizontal a 375px.

**Out of scope:**

- Rutas reales para `agregar-nino`, `vincular-padre`, `resumen-dia` — "Editar", "Resumen del día", "Vincular otro padre" y "Agregar niño" quedan en `#`.
- Búsqueda por alergia u otros campos.
- Base de datos, API, persistencia, autenticación.
- Edición, creación o vinculación de niños/padres.
- Paginación, ordenamiento o filtros combinados.

## Data model

Todo en el nuevo `data/children.ts` (`data/mock.ts` no se toca):

```ts
export type Allergy = "peanut" | "lactose" | "egg" | "dust";
export const allergyLabels: Record<Allergy, string>;   // "peanut" → "MANÍ", …
export const allergyColors: Record<Allergy, { bg: string; fg: string }>;
// peanut/lactose: #FBD8CC / #D9684A (badges del mockup)

export type ParentStatus = "active" | "pending";
export type ChildParent = {
  id: string;
  name: string;
  relation: "mother" | "father";
  status: ParentStatus;   // "active" → badge ACTIVA (#CFEBD8/#3E9B6C)
};                         // "pending" → badge PENDIENTE (#F7E7A6/#9A7B1E)

export type Child = {
  id: string;             // "mateo-fernandez" (slugs, para el param)
  name: string;
  initial: string;
  ageYears: number;
  birthDate: string;      // "12 mar 2022"
  room: string;           // "Soles"
  joined: string;         // "feb 2025"
  avatar: { bg: string; fg: string };  // colores por niño del mockup
  allergies: Allergy[];               // badge en el listado
  allergyNotes?: string;              // banner del perfil, solo si existe
  parents: ChildParent[];
};

export const children: Child[];        // los 8 del mockup, en ese orden
export function getChild(id: string): Child | undefined;
```

Los badges del listado se **derivan**, no se guardan: `allergies.length > 0` → badge de alergía; `parents.length === 0` → badge "VINCULAR" (`#F9D2DE`/`#C56486`); si no, chevron. El contador "8 niños" sale de `children.length`.

## Implementation plan

1. Crear `data/children.ts` con tipos, enums de alergias/colores y los 8 niños. Verificación: `npx tsc --noEmit` pasa.
2. Crear `components/kid-card.tsx` (avatar, nombre, "3 años · 2 padres vinculados", badge/chevron, hover `translateY(-2px)`). Verificación: renderiza con un niño de prueba.
3. Crear `app/kids/page.tsx` estático con header, buscador visual y grilla → la ruta ya funciona. Verificación: `/kids` muestra las 8 tarjetas en orden.
4. Crear `components/kids-directory.tsx` (`"use client"`, `useState` + normalización NFD) y mover ahí buscador + grilla. Verificación: filtrar "sof" muestra 1; con acentos ("sancia" → Valentina) también.
5. Crear `components/kid-profile.tsx` y `app/kids/[id]/page.tsx` con `getChild()` y `notFound()` para id desconocido. Verificación: `/kids/mateo-fernandez` coincide con `perfil-nino.dc.html`; `/kids/xyz` → 404.
6. Actualizar `components/sidebar.tsx`: href `/kids` + activo por `usePathname()`. Verificación: nav correcta desde `/` y desde ambas rutas kids.
7. Pass responsive: grilla 1 col ≤767px, sin scroll horizontal. Verificación: DevTools a 375px y 1440px.
8. Verificación final: `npm run lint` + `npm run build`, y comparación lado a lado con los dos `.dc.html` vía Playwright.

## Acceptance criteria

- [ ] `/kids` muestra las 8 tarjetas en el orden del mockup, con avatar, colores y subtítulos correctos.
- [ ] Badges derivados: MANÍ/LACTOSA con colores del enum, Valentina "VINCULAR", el resto chevron.
- [ ] El buscador filtra por nombre ignorando mayúsculas y acentos; vaciarlo restaura los 8.
- [ ] "8 niños" proviene de `children.length`, no de un literal.
- [ ] Cada tarjeta linkea a `/kids/<id>` y ese perfil renderiza los datos del niño correcto.
- [ ] `/kids/<id>` inexistente responde 404 (`notFound()`).
- [ ] El perfil muestra el banner de alergias solo si `allergyNotes` existe, las 3 filas de datos y los padres con badges ACTIVA/PENDIENTE.
- [ ] "Volver a Niños" → `/kids`.
- [ ] Sidebar: "Niños" linkea a `/kids` y queda activo en ambas rutas kids; "Feed" activo solo en `/`.
- [ ] "Editar", "Resumen del día", "Vincular otro padre" y "Agregar niño" → `#`.
- [ ] ≥768px: 2 columnas; ≤767px: 1 columna y sin scroll horizontal a 375px.
- [ ] Páginas sin datos inline: todo importa de `data/children.ts`.
- [ ] `npm run build` y `npm run lint` pasan; sin llamadas a red ni persistencia.

## Decisions

- **Yes:** rutas en inglés `/kids`, `/kids/[id]` (instrucción explícita: nada de nombres de páginas en español); el copy de la UI sigue en español.
- **Yes:** archivo nuevo `data/children.ts`, separado de `data/mock.ts`.
- **Yes:** filtrado en cliente solo por nombre (norm + strip de diacriticos).
- **Yes:** enum de alergias con label y colores centralizados; los badges del listado se derivan de los datos.
- **Yes:** `notFound()` de Next para ids desconocidos (no hay página 404 custom).
- **Yes:** activo del sidebar con `usePathname()` — el `active: true` hardcodeado de Feed ya no puede quedarse.
- **No:** búsqueda por alergia.
- **No:** rutas stub de agregar/vincular/resumen → `#`, como en el spec 01.
- **No:** tocar `app/globals.css` ni `app/layout.tsx`: el port de tokens y fuentes ya lo hizo el spec 01.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Cambiar el href de "Niños" invalida el criterio 7 del spec 01 ("todos los href son `#`") | Es un cambio deliberado de este spec; al aprobarlo, el criterio 1 de esta lista lo reemplaza. |
| 8 paletas de avatar hardcodeadas generan ruido de clases arbitrarias | Se mantienen como `bg-[#A9D9E8]` en `kid-card`; si en el futuro hay DB, el mapa vive en el tipo `avatar`. |
| `notFound()` muestra el 404 default de Next, sin estética de la app | Aceptado por ahora; una página 404 con la paleta es alcance de otro spec. |
