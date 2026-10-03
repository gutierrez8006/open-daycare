# SPEC 05 — Vista de avisos en `/notices`

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-10-03
> **Objective:** Implementar la página `/notices` replicando `avisos.dc.html` con datos mock en `data/notices.ts`, dentro del layout `(app)` con sidebar.

## Scope

**In:**

- Nuevo `data/notices.ts` con 4 avisos mock tipados (comentario, activación de cuenta, reacción, recordatorio) y sus tipos.
- Nuevo `app/(app)/notices/page.tsx` (server component) que lee los avisos y los renderiza.
- Nuevo `components/notice-list.tsx` que renderiza la lista de avisos con avatar, texto con negritas y timestamp, replicando el mockup.
- Los avisos tipo "comment" y "reaction" son links a `/posts/[id]`; los tipo "account-activation" y "reminder" son `<div>` estáticos sin link.
- Sidebar resalta "Avisos" como activo en `/notices` (ya configurado en `components/sidebar.tsx:30`).
- Solo Tailwind con valores arbitrarios de la paleta existente; no se tocan `globals.css` ni fuentes.

**Out of scope (for future specs):**

- Página de detalle de publicación (`/posts/[id]`); los links apuntan ahí pero dan 404 por ahora.
- Persistencia, API o base de datos.
- Notificaciones en tiempo real, conteo de no leídos o badges.
- Filtros, paginación o agrupación por fecha.
- Cambios en `globals.css`, fuentes, sidebar o cualquier otra ruta.

## Data model

```ts
// data/notices.ts
export type NoticeAvatar =
  | { kind: "initial"; letter: string; bg: string; textColor: string }
  | { kind: "icon"; icon: "check" | "heart" | "bell"; bg: string; iconColor: string };

export type Notice = {
  id: string;
  type: "comment" | "account-activation" | "reaction" | "reminder";
  parts: { text: string; bold?: boolean }[];
  time: string;
  avatar: NoticeAvatar;
  href?: string; // solo comment y reaction → "/posts/[id]"
};

export const notices: Notice[] = [
  {
    id: "notice-1",
    type: "comment",
    parts: [
      { text: "Lucía Fernández", bold: true },
      { text: " comentó en la publicación de Mateo." },
    ],
    time: "Hace 12 min",
    avatar: { kind: "initial", letter: "L", bg: "#C9B6E8", textColor: "#fff" },
    href: "/posts/post-1",
  },
  {
    id: "notice-2",
    type: "account-activation",
    parts: [
      { text: "Diego Fernández", bold: true },
      { text: " activó su cuenta y ya sigue a Mateo." },
    ],
    time: "Hace 1 h",
    avatar: { kind: "icon", icon: "check", bg: "#CFEBD8", iconColor: "#3E9B6C" },
  },
  {
    id: "notice-3",
    type: "reaction",
    parts: [
      { text: "Carla Méndez", bold: true },
      { text: " reaccionó a la publicación de Sofía." },
    ],
    time: "Hace 2 h",
    avatar: { kind: "icon", icon: "heart", bg: "#FBD8CC", iconColor: "#D9684A" },
    href: "/posts/post-2",
  },
  {
    id: "notice-4",
    type: "reminder",
    parts: [
      { text: "Recordá enviar el " },
      { text: "resumen del día", bold: true },
      { text: " de la sala Soles." },
    ],
    time: "Hoy 17:00",
    avatar: { kind: "icon", icon: "bell", bg: "#F4DC8E", iconColor: "#9A7B1E" },
  },
];
```

## Implementation plan

1. Crear `data/notices.ts` con los tipos `NoticeAvatar`, `Notice` y el array `notices` con los 4 avisos del mockup. Verificación: el archivo compila sin errores de tipo.
2. Crear `components/notice-list.tsx` que recibe `Notice[]` y renderiza cada aviso como card (`bg-card`, `border border-line`, `rounded-[16px]`, `px-[18px] py-4`): avatar 40×40 (inicial con `font-display` o ícono SVG según `avatar.kind`), texto con negritas (`parts` → `<span>` con `font-bold` condicional), timestamp `text-[12.5px] text-muted`. Los avisos con `href` se envuelven en `<a>` (o `<Link>`), los demás en `<div>`. Verificación: comparación visual contra `avisos.dc.html`.
3. Crear `app/(app)/notices/page.tsx` (server component): eyebrow "ACTIVIDAD" (`text-[12.5px] font-extrabold tracking-[.8px] text-brand`), h1 "Avisos" (`font-display text-[30px] font-semibold text-ink`), y `<NoticeList notices={notices} />` dentro de un contenedor `max-w-[680px] mx-auto px-10 pb-20 pt-[34px]`. Verificación: `/notices` renderiza con sidebar y los 4 avisos.
4. Verificar que el sidebar resalta "Avisos" como activo en `/notices` (ya configurado en `sidebar.tsx:30`). Verificación: el nav item tiene `bg-[#FBE3D8] font-extrabold text-brand`.
5. Verificación final: `npm run lint` + `npm run build` y comparación Playwright contra `avisos.dc.html`. Verificación: ambos pasan, sin `fetch`/`localStorage`.

## Acceptance criteria

- [ ] `/notices` renderiza dentro del layout `(app)` con sidebar visible.
- [ ] El sidebar muestra "Avisos" como item activo (fondo `#FBE3D8`, texto `#D9583C`, `font-extrabold`).
- [ ] La página muestra el eyebrow "ACTIVIDAD" en color brand y el h1 "Avisos" en Fredoka 30px.
- [ ] Se renderizan exactamente 4 avisos con avatar, texto y timestamp.
- [ ] El aviso de comentario (Lucía) tiene avatar "L" púrpura (`#C9B6E8`) y es link a `/posts/post-1`.
- [ ] El aviso de activación (Diego) tiene ícono check verde (`#CFEBD8`/`#3E9B6C`) y NO es link.
- [ ] El aviso de reacción (Carla) tiene ícono corazón (`#FBD8CC`/`#D9684A`) y es link a `/posts/post-2`.
- [ ] El aviso de recordatorio tiene ícono campana (`#F4DC8E`/`#9A7B1E`) y NO es link.
- [ ] Los textos con negritas coinciden con el mockup (nombre de persona o texto destacado).
- [ ] Los datos vienen de `data/notices.ts`, no están hardcodeados en el componente.
- [ ] `npm run lint` y `npm run build` pasan; sin `fetch`, `localStorage` ni `sessionStorage`.

## Decisions

- **Yes:** datos mock en `data/notices.ts` con tipos exportados. Consistente con `data/mock.ts` y `data/children.ts`.
- **Yes:** links a `/posts/[id]` aunque la ruta no exista aún (da 404). Prepara el camino para un futuro spec de detalle de publicación sin bloquear este.
- **Yes:** avisos de sistema (reminder) sin link, como `<div>`. Consistente con el mockup.
- **Yes:** texto como `parts: { text, bold? }[]` para soportar negritas inline sin HTML crudo ni JSX en el data file.
- **Yes:** avatar como discriminated union (`initial` | `icon`). El componente mapea nombres de ícono a SVGs.
- **No:** crear la página `/posts/[id]` (fuera de scope; tendrá su propio spec).
- **No:** tocar `globals.css`, fuentes, sidebar ni ninguna otra ruta.
- **No:** persistencia, API, notificaciones reales, badges o conteo de no leídos.

## What is **not** in this spec

- Página de detalle de publicación (`/posts/[id]`).
- Base de datos, API, persistencia o notificaciones reales.
- Filtros, paginación, agrupación por fecha o notificaciones no leídas.
- Cambios en `globals.css`, fuentes, sidebar o cualquier otra ruta.
