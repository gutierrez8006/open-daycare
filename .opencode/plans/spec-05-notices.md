# SPEC 05 — Vista de avisos en `/notices`

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-10-03
> **Objective:** Mostrar la lista de avisos del mockup `avisos.dc.html` en la ruta `/notices`, con 4 tipos de aviso (comentario, activación de cuenta, reacción, recordatorio), sin interacciones ni base de datos.

## Scope

**In:**

- Nueva ruta `app/(app)/notices/page.tsx` que replica el mockup `references/pantallas/avisos.dc.html`.
- Array `notices` en `data/mock.ts` con 4 avisos: comment, account_activation, reaction, reminder.
- Componente `components/notice-card.tsx` que renderiza cada aviso: avatar (inicial o icono), texto con nombres en bold, tiempo relativo.
- Avisos tipo comment y reaction linkean a `#` temporalmente (envueltos en `<a>`).
- Avisos tipo account_activation y reminder son estáticos (no clickeables, envueltos en `<div>`).
- Layout mobile-first: sidebar colapsable ya existe en `components/sidebar.tsx`, contenido se adapta con `max-w-[680px]` centrado.
- Solo Tailwind con valores arbitrarios de la paleta existente (`#F6ECDF`, `#FFFDF9`, `#ECE0D0`, `#D9583C`, etc.); no se tocan `app/globals.css` ni fuentes.

**Out of scope (for future specs):**

- Persistencia, API o base de datos de ningún tipo; los avisos son mock data estática.
- Ruta `/posts/[id]` o detalle de publicación (los links van a `#`).
- Interacciones: marcar como leído, filtrar por tipo, paginar, ordenar.
- Notificaciones en tiempo real, badges de no leídos, o contadores.
- Cambios en `globals.css`, fuentes, sidebar o cualquier otra ruta.

## Data model

Este feature no introduce datos persistidos. Agrega mock data en `data/mock.ts`:

```ts
// data/mock.ts
export type NoticeType = "comment" | "account_activation" | "reaction" | "reminder";

export type Notice = {
  id: string;
  type: NoticeType;
  text: string; // HTML con <b> para nombres, ej: "<b>Lucía Fernández</b> comentó en la publicación de Mateo."
  time: string; // "Hace 12 min", "Hace 1 h", "Hoy 17:00"
  href?: string; // "#" para comment y reaction, undefined para account_activation y reminder
  avatar: {
    kind: "initial" | "icon";
    value: string; // inicial "L" o nombre de icono "check" | "heart" | "bell"
    bg: string; // color de fondo, ej: "#C9B6E8"
    fg: string; // color de texto/icono, ej: "#fff" o "#3E9B6C"
  };
};

export const notices: Notice[] = [
  {
    id: "notice-1",
    type: "comment",
    text: "<b>Lucía Fernández</b> comentó en la publicación de Mateo.",
    time: "Hace 12 min",
    href: "#",
    avatar: { kind: "initial", value: "L", bg: "#C9B6E8", fg: "#fff" },
  },
  {
    id: "notice-2",
    type: "account_activation",
    text: "<b>Diego Fernández</b> activó su cuenta y ya sigue a Mateo.",
    time: "Hace 1 h",
    avatar: { kind: "icon", value: "check", bg: "#CFEBD8", fg: "#3E9B6C" },
  },
  {
    id: "notice-3",
    type: "reaction",
    text: "<b>Carla Méndez</b> reaccionó a la publicación de Sofía.",
    time: "Hace 2 h",
    href: "#",
    avatar: { kind: "icon", value: "heart", bg: "#FBD8CC", fg: "#D9684A" },
  },
  {
    id: "notice-4",
    type: "reminder",
    text: "Recordá enviar el <b>resumen del día</b> de la sala Soles.",
    time: "Hoy 17:00",
    avatar: { kind: "icon", value: "bell", bg: "#F4DC8E", fg: "#9A7B1E" },
  },
];
```

## Implementation plan

1. Agregar tipos `NoticeType` y `Notice` + array `notices` en `data/mock.ts` con los 4 avisos del mockup. Verificación: `npm run build` pasa, los tipos son correctos.
2. Crear `components/notice-card.tsx` que renderiza un aviso: avatar (inicial o icono SVG según `avatar.kind`), texto con `dangerouslySetInnerHTML` (datos estáticos), tiempo, y envoltorio `<a>` si `href` existe o `<div>` si no. Verificación: componente acepta los 4 tipos de aviso sin errores de tipos.
3. Crear `app/(app)/notices/page.tsx` que importa `notices` de `data/mock.ts` y renderiza el header "ACTIVIDAD" / "Avisos" + lista de `NoticeCard`. Verificación: ruta `/notices` muestra los 4 avisos en el orden del mockup.
4. Portar estilos del mockup a Tailwind: header con `text-[12.5px] font-extrabold tracking-[.8px] text-brand`, h1 `font-display text-[30px] font-semibold`, cards con `rounded-[16px] border border-line bg-card p-[16px_18px]`, gap `gap-3`. Verificación: comparación lado a lado con `avisos.dc.html` en desktop (1440px).
5. Responsive: contenido centrado con `max-w-[680px] mx-auto px-10 pb-20 pt-[34px]`, sidebar colapsable ya existe. Verificación: DevTools 375px muestra sidebar hamburguesa, contenido sin scroll horizontal.
6. Verificación final: `npm run lint` + `npm run build` y comparación Playwright contra el `.dc.html`. Verificación: ambos pasan, sin `fetch`/`localStorage`/`sessionStorage`.

## Acceptance criteria

- [ ] Ruta `/notices` muestra la lista de 4 avisos en el orden del mockup.
- [ ] Header replica mockup: label "ACTIVIDAD" en `text-brand`, h1 "Avisos" en `font-display`.
- [ ] Cada aviso tiene avatar (inicial o icono SVG), texto con nombres en bold, tiempo relativo.
- [ ] Avisos tipo comment y reaction linkean a `#` (cursor pointer, hover state).
- [ ] Avisos tipo account_activation y reminder son estáticos (no clickeables, cursor default).
- [ ] Cards con border `border-line`, bg `bg-card`, rounded `[16px]`, padding `[16px_18px]`, gap `gap-3`.
- [ ] Mobile first: a 375px sidebar colapsable funciona, contenido sin scroll horizontal.
- [ ] `npm run lint` y `npm run build` pasan; sin `fetch`, `localStorage` ni `sessionStorage`.

## Decisions

- **Yes:** mock data en `data/mock.ts` (array `notices`). Consistencia con `posts` y `session`, sin DB ni API.
- **Yes:** 4 tipos fijos (comment, account_activation, reaction, reminder). Suficiente para el mockup, sin sistema extensible por ahora.
- **Yes:** links a `#` temporalmente. Ruta `/posts/[id]` no existe; se implementará en otro spec si llega.
- **Yes:** HTML en texto del mock (`dangerouslySetInnerHTML`). Datos estáticos y controlados, sin input de usuario; más simple que parsear segmentos.
- **Yes:** mobile-first con sidebar colapsable. Ya existe en `components/sidebar.tsx`, solo reutilizar.
- **No:** interacciones (marcar leído, filtrar, paginar). Lista estática, sin estado cliente.
- **No:** crear ruta `/posts/[id]` o detalle de publicación. Fuera de scope.
- **No:** tocar `globals.css`, fuentes, sidebar ni otras rutas.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| HTML en mock data (`dangerouslySetInnerHTML`) | Aceptable porque es estático y controlado; no hay input de usuario. Si en el futuro hay input, migrar a segmentos `{text, bold}`. |
| Comparar inline-styles del mockup contra Tailwind produce desvíos | Valores arbitrarios (`bg-[#F6ECDF]`, `border-[#ECE0D0]`) y comparación Playwright lado a lado, igual que SPEC 01/02/04. |
| Iconos SVG (check, heart, bell) no están en el código aún | Copiar SVGs del mockup `avisos.dc.html` (líneas 49-51) a componentes inline en `notice-card.tsx`. |

## What is **not** in this spec

- Base de datos, API, persistencia o notificaciones en tiempo real.
- Ruta `/posts/[id]` o detalle de publicación (los links van a `#`).
- Interacciones: marcar como leído, filtrar por tipo, paginar, ordenar.
- Badges de no leídos, contadores o sistema de notificaciones.
- Cambios en `globals.css`, fuentes, sidebar o cualquier otra ruta.
