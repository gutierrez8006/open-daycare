# SPEC 01 — Feed como página de inicio

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-09-27
> **Objective:** Implementar el mockup `references/pantallas/feed.dc.html` como página de inicio `/`, con sidebar responsive, sin autenticación ni base de datos, replicando fielmente su estilo.

## Scope

**In:**

- Portar la paleta del mockup a tokens de Tailwind v4 en `app/globals.css` (hoy tiene la paleta zinc del scaffold).
- Cargar las fuentes Fredoka y Nunito con `next/font/google` en `app/layout.tsx`.
- Crear el shell de aplicación con sidebar en `app/layout.tsx` (logo, botón "Nueva publicación", nav, bloque de usuario), compartido por todas las rutas futuras.
- Sidebar responsive: fijo de 248px en desktop; en móvil, barra superior con hamburguesa que abre un drawer con la misma nav.
- Crear `data/mock.ts` con `export type Post` y `export const posts: Post[]` (los 3 posts del mockup) más los datos de sesión y sala.
- Renderizar el contenido de `/` en `app/page.tsx`: cabecera ("Buenas, Caro" + contador de niños + fecha dinámica de hoy), tarjeta "Compartí un momento…", separador "PUBLICADO HOY" y las tarjetas de post con sus badges, foto placeholder, likes y comentarios.
- Todos los enlaces del mockup (`ninos`, `avisos`, `mi-cuenta`, `crear-publicacion`, `detalle-publicacion`, `foto`, `login`) apuntan a `#` por ahora.

**Out of scope (for future specs):**

- Cualquier autenticación o pantalla de login.
- Base de datos, API o persistencia de cualquier tipo.
- Rutas reales para Niños, Avisos, Mi cuenta, Crear publicación, Detalle de publicación, Foto.
- Likes/comentarios interactivos (hoy son conteos estáticos del mock).
- Sidebar colapsable/animación avanzada más allá del drawer móvil.
- Edición de publicaciones (el link "Editar" es `#` como el resto).

## Data model

Todo vive en `data/mock.ts`:

```ts
export type PostType = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  type: PostType;
  author: {
    name: string;      // "Mateo" | "Anuncio general"
    initial: string;   // "M" | "" (el anuncio usa ícono de megáfono)
    variant: "child" | "announce";
  };
  time: string;        // "14:20"
  audience: string;    // "familia de Mateo" | "toda la sala"
  body: string;
  photo?: { label: string }; // solo el post de actividad: "pintando con témperas"
  likes: number;
  comments: number;
};

export const posts: Post[] = [/* los 3 posts del mockup, en ese orden */];

export const session = {
  user: { name: "Caro Giménez", initial: "C", role: "Maestra" },
  sala: { name: "Sala Soles", childrenCount: 12 },
};
```

Convenciones:

- El orden del feed es el del array: `achievement`, `activity` (con foto), `announcement`.
- El identificador de `type` es inglés; la etiqueta visual en español se deriva de él: `achievement` → badge "LOGRO" verde `#3E9B6C`, `activity` → badge "ACTIVIDAD" celeste `#2E89A6`, `announcement` → badge "ANUNCIO" índigo `#4E72C8`.
- El avatar del `announcement` renderiza el ícono de megáfono; los demás, la `initial`.
- El copy del mockup (cuerpos de post, "Para: …", "Buenas, Caro") se mantiene en español tal cual; solo los identificadores del código son inglés.
- La fecha de la cabecera se calcula en runtime con `new Date()`; no está en el mock.

## Implementation plan

1. Reemplazar en `app/globals.css` la paleta zinc/Geist por tokens `@theme inline` con los colores del mockup (`#F6ECDF` fondo, `#FFFDF9` card, `#ECE0D0` borde, `#3F362E` texto, `#A89A8B`/`#94887B` muted, acentos `#D9583C`/`#F2937A`/`#2E89A6`) y estilos base (body, scrollbar). Verificación: `npm run dev` y ver `/` con fondo `#F6ECDF`.
2. Cargar Fredoka y Nunito con `next/font/google` en `app/layout.tsx`, exponerlas como variables CSS y aplicarlas en `globals.css`. Verificación: la página renderiza con las fuentes nuevas.
3. Crear `data/mock.ts` con `Post`, `PostType`, `posts` y `session`. Verificación: `npx tsc --noEmit` pasa.
4. Crear `components/sidebar.tsx` (componente de cliente con estado `open` para el drawer) con el aside desktop del mockup y la barra móvil con hamburguesa. Verificación: `/` muestra la nav; el drawer abre y cierra en viewport móvil.
5. Montar el shell en `app/layout.tsx`: sidebar + `<main>` scrollable. El contenido de `/` sigue siendo el boilerplate dentro de `main`. Verificación: layout con sidebar visible en desktop.
6. Crear `components/post-card.tsx` con la tarjeta de post (avatar, badge por tipo, "Para:", cuerpo, foto placeholder, footer de likes/comentarios/editar). Verificación: componente renderiza con datos de prueba.
7. Reemplazar `app/page.tsx` por el feed: cabecera con fecha dinámica, tarjeta de composición, separador "PUBLICADO HOY" y `posts.map` → `PostCard`. Todos los `href` del mockup → `#`. Verificación: `/` se ve igual que `feed.dc.html`.
8. Pass responsive: sin scroll horizontal a 375px de ancho, drawer con overlay, targets de toque cómodos. Verificación: DevTools a 375px y a 1440px.

## Acceptance criteria

- [ ] `/` renderiza el feed con fondo `#F6ECDF`, cards `#FFFDF9` y bordes `#ECE0D0` (sin restos de la paleta zinc).
- [ ] Los textos usan Nunito y los títulos/badges Fredoka.
- [ ] Se ven los 3 posts del mockup en orden (logro, actividad con foto, anuncio) con sus badges de color correctos.
- [ ] La cabecera muestra la fecha de hoy calculada en runtime.
- [ ] En ≥1024px el sidebar de 248px queda fijo y el main scrollea por separado.
- [ ] En ≤767px no hay scroll horizontal y la hamburguesa abre/cierra el drawer (también al tocar el overlay).
- [ ] Todos los enlaces del mockup tienen `href="#"` (ninguna ruta rota).
- [ ] Los posts provienen de `data/mock.ts`; `app/page.tsx` no contiene datos inline de posts.
- [ ] `npm run build` pasa (incluye typecheck) y `npm run lint` no arroja errores.
- [ ] No hay llamadas a red, ni persistencia, ni estado de sesión.

## Decisions

- **Yes:** sidebar como pieza de `app/layout.tsx` desde el inicio. Todas las pantallas futuras lo reutilizan; extraerlo después obliga a tocar todas las rutas.
- **No:** stubs de rutas (`/ninos`, `/avisos`, …). Sería alcance de specs siguientes; por ahora todos los enlaces son `#`.
- **Yes:** identificadores de código en inglés (`PostType = "achievement" | "activity" | "announcement"`), copy de la UI en español. Regla de código limpio del repo; el mapa type → etiqueta vive en un solo lugar.
- **Yes:** tokens de Tailwind v4 en `app/globals.css`. El port de la paleta era pendiente del scaffold y los estilos inline del mockup son inmantenibles.
- **Yes:** `data/mock.ts` con `type Post` + `posts` en el mismo archivo. Cuando haya DB solo se cambia la fuente; el componente no se toca.
- **Yes:** fecha dinámica con `new Date()` en la cabecera. Una fecha fija del mockup envejece mal.
- **Yes:** drawer con hamburguesa en móvil. Conserva la nav completa; una barra de iconos la recorta y un sidebar apilado queda muy largo.
- **No:** likes/comentarios interactivos. Sin backend no persistirían y decidir persistencia (localStorage u otro) es otro spec.
- **No:** estilos inline copiados del mockup. Se traducen a clases de Tailwind con los valores exactos de la paleta.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Traducir estilos inline a Tailwind produce desvíos visuales frente al mockup | Comparar lado a lado en el navegador con el `.dc.html` abierto; usar valores arbitrarios (`bg-[#FFFDF9]`) cuando un token no cubra el caso. |
| Fuentes Fredoka/Nunito requieren red en el primer build | `next/font/google` las descarga y cachea en `.next`; si el build corre offline después, usa el cache. |
| El layout desktop (aside sticky + main con `overflow-y:auto`) se comporta distinto en móvil | El pass responsive (paso 8) verifica a 375px: aside pasa a drawer, main scrollea con la página. |

## What is **not** in this spec

- Autenticación, usuarios reales o login.
- Base de datos, API o cualquier forma de persistencia.
- Rutas reales para Niños, Avisos, Mi cuenta, Crear publicación, Detalle, Foto.
- Interacción de likes/comentarios o edición de posts.
- Versionado de datos, migraciones o seeds.

Cada uno de esos, si llega, va en su propio spec.
