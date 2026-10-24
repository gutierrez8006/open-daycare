# SPEC 13 — Persistencia de publicaciones del staff con fotos y feed real

> **Status:** Aprobado
> **Depends on:** SPEC 06, SPEC 09, SPEC 10, SPEC 12
> **Date:** 2026-10-24
> **Objective:** Conectar el modal "Nueva publicación" a la BD real: tablas `posts`/`post_children`/`post_media` con RLS, bucket privado con upload directo del browser (hasta 10 fotos de 4MB c/u), Server Action de publicación y feed `/` alimentado por datos reales.

## Por qué existe este spec

SPEC 06 dejó el modal "Publicar" como formulario de UI pura: el botón Publicar validaba y cerraba sin guardar nada, el selector PARA derivaba de `data/children.ts` (3 niños hardcodeados) y la sección FOTOS era un placeholder sin file picker. El feed `/` (SPEC 01) sigue renderizando `data/mock.ts`. Este spec crea la primera entidad de contenido de la app — las entradas que el staff publica para las familias — y cierra el ciclo: publicar con o sin fotos, y verlo en el feed real.

## Scope

**In:**

- Migración remota (MCP `apply_migration`): `CREATE TYPE public.post_kind` (`meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`).
- Migración remota: `CREATE TABLE public.posts`, `public.post_children` y `public.post_media` (detalladas en Data model) con `ENABLE ROW LEVEL SECURITY`.
- Policies de RLS reutilizando el helper `SECURITY DEFINER` `private.is_staff_of_daycare` existente desde SPEC 12: SELECT e INSERT solo para `staff`/`admin` del daycare del post. Sin policies para `parent` ni DELETE/UPDATE de tablas.
- Índices: `posts (daycare_id, created_at desc)`, `post_children (child_id)` y el índice único `post_media (post_id, position)` que define la constraint.
- Migración remota: bucket privado de Storage `posts-media` + policies de `storage.objects` (INSERT/SELECT/DELETE para `authenticated` con rol `staff`/`admin` del daycare, scope al primer segmento del path = `daycare_id` del usuario, guardas de mimetype jpeg/png/webp y tamaño ≤ 4MB en INSERT).
- Constante compartida `utils/posts.ts` con los 7 kinds (id, label en español, colores `bg`/`fg` del mockup), types `PostKind`/`FeedPost`/`FeedPostKid`, helper server `getFeedPosts()` (últimos 30 + URLs firmadas) y `formatPostTime()`.
- `components/post-card.tsx` reescrito sobre el view model `FeedPost` (remite con inicial, pills de kinds — 1 a 7 con sus colores, "Para: …" con nombre por nombre, cuerpo, grid de fotos `<img>` a 1/2/3+ columnas, hora relativa). Se eliminan del card los elementos muertos (likes, comentarios, botón Editar).
- `app/(app)/page.tsx`: feed real con `getFeedPosts()`, cabecera con daycare/usuario/contaje reales, estado vacío "Aún no hay publicaciones de momento". Se elimina todo import de `data/mock.ts`; el archivo se borra (`Post`/`PostType` migran a `utils/posts.ts`).
- `app/(app)/layout.tsx`: fetch de `children (id, full_name)` gobernado por RLS (SPEC 10) pasadas por `Sidebar` como prop al modal.
- `components/create-post-modal.tsx`: selector PARA real (lista plana ordenada de todos los niños del daycare, botón renombrado "Todos", paleta de avatar por índice), sección FOTOS real (file picker `accept` jpeg/png/webp, preview con `URL.createObjectURL`, remover por foto, contador `n/10`, errores inline de mime/tamaño/cantidad y validación local del kind Foto) y flujo de publicación: upload directo de las fotos al bucket con el browser client (`utils/supabase/client.ts`) y luego `createPost`.
- `app/(app)/actions.ts` (`"use server"`): `createPost({ kinds, childIds, description, media })` con validación autoritativa (rol, children visibles, kind Foto exige fotos, `photo_consent = false` bloquea el publicar con fotos, paths con prefijo del daycare del autor, máx 10). Insert en transacción de post + post_children + post_media y `revalidatePath("/")`.
- Estado de publicación: botón "Publicando…" deshabilitado mientras sube; si `createPost` falla, el cliente intenta `remove()` de los paths ya subidos (limpieza best-effort) y el error queda inline en español con el modal abierto y reintentable (patrón SPEC 11).

**Out of scope (for future specs):**

- Pantalla `/avisos`: los `announcement` son solo otra etiqueta del mismo post.
- UI de familia y SELECT de posts para padres en las policies: lo define el spec de familia-feed.
- Editar o eliminar un post publicado (policies DELETE/UPDATE y borrado de media).
- Likes, comentarios, notificaciones (`notify_on_post`), resumen del día.
- Paginación / scroll infinito (solo los 30 más recientes).
- Procesamiento de imágenes (resize, compresión, thumbnails).
- Cámara nativa (solo file picker) y salida fuera del modal.
- UI de edición de `photo_consent` del niño y asignación staff↔sala.
- Cambios en `app/globals.css`, fuentes o el resto de la sidebar.

## Data model

Migraciones (nombres únicos en `supabase_migrations.schema_migrations`):

```sql
-- apply_migration("create_post_kind_enum")
create type public.post_kind as enum
  ('meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement');

-- apply_migration("create_posts_tables_rls")
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  author_id uuid not null references public.users(id) on delete restrict,
  description text not null,
  kinds public.post_kind[] not null default '{}'
    check (array_length(kinds, 1) between 1 and 7),
  created_at timestamptz not null default now()
);
create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete restrict,
  primary key (post_id, child_id)
);
create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null unique,
  position int not null check (position between 1 and 10),
  unique (post_id, position)
);
alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_media enable row level security;
```

Policies (reutilizan el helper de SPEC 12; ninguna policy consulta `posts` desde otra policy que a su vez consulte `posts`, así que no hay camino circular):

```sql
create policy posts_select_staff on public.posts
  for select to authenticated
  using (private.is_staff_of_daycare(posts.daycare_id));
create policy posts_insert_staff on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid())
    and private.is_staff_of_daycare(posts.daycare_id));

-- post_children / post_media: gobiernan por el post padre (mismo encuadre staff)
create policy post_children_select_staff on public.post_children
  for select to authenticated
  using (exists (select 1 from public.posts p
    where p.id = post_children.post_id and private.is_staff_of_daycare(p.daycare_id)));
create policy post_children_insert_staff on public.post_children
  for insert to authenticated
  with check (exists (select 1 from public.posts p
    where p.id = post_children.post_id and private.is_staff_of_daycare(p.daycare_id)));
-- post_media_select_staff / post_media_insert_staff: idénticos vía el post padre;
-- el INSERT añade storage_path like p.daycare_id::text || '/%'
```

Bucket y Storage:

```sql
-- apply_migration("create_posts_media_bucket")
insert into storage.buckets (id, name, public)
values ('posts-media', 'posts-media', false)
on conflict (id) do nothing;

-- Policies sobre storage.objects para bucket_id = 'posts-media':
-- INSERT (posts_media_insert_staff): authenticated con rol staff/admin via users;
--   (storage.foldername(name))[1] = u.daycare_id::text
--   mimetype in ('image/jpeg','image/png','image/webp')
--   (metadata->>'size')::bigint <= 4194304
-- SELECT (posts_media_select_staff): mismo encuadre por foldername.
-- DELETE (posts_media_delete_staff): mismo encuadre + owner_id =
--   (select auth.uid())::text — en el schema actual storage.objects.owner_id es text,
--   el literal uuid del draft falla con 42883. DELETE habilita la limpieza
--   best-effort de archivos huérfanos cuando createPost falla.
```

Path de cada foto: `{daycare_id}/{crypto.randomUUID()}.{ext}` — se sube ANTES de crear el post (no hay row_id todavía; el scoping lo da el primer segmento). Sin estado `draft`.

View model y constantes de la app:

```ts
// utils/posts.ts
export type PostKind = "meal" | "nap" | "activity" | "achievement"
  | "mood" | "photo" | "announcement";
export const postKinds: { id: PostKind; label: string; bg: string; fg: string }[] =
  [/* los 7 del mockup de SPEC 06: Comida/Siesta/Actividad/Logro/Ánimo/Foto/Anuncio */];

export type FeedPost = {
  id: string;
  kindIds: PostKind[];      // 1..7 tal cual kinds de la fila
  authorId: string;
  authorName: string;       // users.full_name
  body: string;             // posts.description
  time: string;             // "ahora" | "hace N min" | "hace N h" | "hace N día(s)" | fecha corta es-AR
  audience: string;         // nombres unidos por ", "; >3 → los 3 primeros + "+N"
  photoUrls: string[];      // firmadas (TTL ~1h), ordenadas por position
};
export type FeedPostKid = { id: string; fullName: string };

// getFeedPosts(limit = 30): Promise<FeedPost[]>   — server, RLS manda
// formatPostTime(created: Date): string

// app/(app)/actions.ts ("use server")
type CreatePostInput = {
  kinds: PostKind[];           // 1..7 válidos
  childIds: string[];          // uuids que el usuario ve por RLS
  description: string;         // trim no vacío
  media: { storagePath: string; position: number }[]; // 0..10; si kinds incluye "photo", ≥ 1
};
type CreatePostResult = { ok: true } | { ok: false; error: string }; // español, sin detalles internos

// components/create-post-modal.tsx — props nuevas
// kids: FeedPostKid[] (desde layout → Sidebar) + daycareId: string (para el path de upload)
```

## Implementation plan

1. **Prerrequisitos: verificar el estado real antes de tocar:** `list_tables` (6 tablas en `public`, ninguna `post*`), `pg_proc` confirmando que `private.is_staff_of_daycare` sigue `SECURITY DEFINER` y `pg_enum` sin `post_kind`. Verificación: punto de partida confirmado.
2. `apply_migration("create_post_kind_enum")` con el `CREATE TYPE` de los 7 valores. Verificación: `pg_enum` muestra `post_kind` y ningún enum nuevo más.
3. `apply_migration("create_posts_tables_rls")` con 3 tablas + RLS + 6 policies + índices. Verificación: `list_tables` = 9 tablas; `pg_policies` sin solapes; `get_advisors` sin alertas nuevas.
4. `apply_migration("create_posts_media_bucket")` con el bucket y las 3 policies de `storage.objects`. Verificación: fila en `storage.buckets` con `public = false`; `get_advisors` sin alertas nuevas.
5. `utils/posts.ts`: constante `postKinds` (colores del mockup de SPEC 06), types `PostKind`/`FeedPost`/`FeedPostKid`, `getFeedPosts()` (nested select author + children + media, URLs firmadas con `Promise.all`) y `formatPostTime()`. Se deja `data/mock.ts` intacto un paso más. Verificación: `npx next typegen && npx tsc --noEmit` pasa sin tocar UI.
6. `components/post-card.tsx` reescrito a `FeedPost`: pills de kinds con colores compartidos, "Para: …" con nombres, grid de fotos con `<img>` (1 a fullwidth, 2 en 2 columnas, ≥3 en 3 columnas, `rounded-[16px]` `h-[200px]` con `object-cover`), hora relativa y sin footer muerto. La página `/` pasa a `getFeedPosts()` + cabecera real (daycare con `getCurrentDaycare()`, usuario desde `users`, contaje de niños real) + estado vacío; se elimina todo import de `data/mock.ts` y se borra el archivo. Semilla manual de prueba con `execute_sql` (1 post sin fotos con kinds `meal`+`activity` y otro con kind `photo`, ambos limpiados al final). Verificación: E2E en `/`: el post insertado a mano se ve arriba; sin filas aparece el estado vacío.
7. `components/create-post-modal.tsx` — PARA real: nuevas props `kids: FeedPostKid[]` y `daycareId: string` desde `app/(app)/layout.tsx` → `Sidebar` → modal, lista ordenada por `full_name`, botón renombrado "Todos", avatar con la paleta del mockup ciclando por índice (`#A9D9E8/#1F7A93`, `#F4B8CC/#B5587F`, `#B9DEC4/#3E9B6C`). Verificación: el modal muestra los niños reales del daycare (con el staff logueado) y el toggle "Todos" selecciona/limpia a todos.
8. `components/create-post-modal.tsx` — FOTOS real: `<input type="file">` oculto con `accept="image/jpeg,image/png,image/webp"` + `multiple`, previews con `URL.createObjectURL` (clic para remover), contador `n/10` y errores inline: "Solo podés subir imágenes JPG, PNG o WebP.", "Cada foto no puede superar 4MB.", "Máximo 10 fotos." y "El tipo Foto requiere al menos una imagen." si el kind incluye `photo` sin fotos. Verificación: adjuntar 11 fotos muestra el error de cantidad y no publica; un archivo de 5MB el de tamaño; kind Foto sin fotos muestra el de kind.
9. `app/(app)/actions.ts` con `createPost`: validación autoritativa (revalidar mime/tamaño/10 y kind↔fotos, `photo_consent = false` bloquea con error con el nombre del niño, paths con prefijo del daycare del autor, children visibles por RLS), INSERT en transacción de las 3 tablas y `revalidatePath("/")`. Verificación: `npx next typegen && npx tsc --noEmit`; con datos válidos de prueba inserta filas coherentes; con un child no visible por RLS devuelve error genérico y no inserta nada.
10. Wirear el upload en el modal: "Publicar" → validar → subir fotos una a una con el browser client (`utils/supabase/client.ts`) al bucket `posts-media` bajo `{daycareId}/{crypto.randomUUID()}.{ext}` → llamar `createPost` con los paths → si falla, `remove()` best-effort y error inline; mientras tanto botón "Publicando…" deshabilitado. Al publicar con éxito, resetear el form y dejar el feed ya refrescado por `revalidatePath("/")`. Verificación E2E: publicar con 2 fotos → aparecen en `/` con ambas imágenes y el remite correcto; publicar sin fotos (kinds Comida) → post de texto en el feed.
11. Verificación de RLS y Storage con `execute_sql` (`set local role authenticated` + claims de staff y de parent): un `parent` no ve posts ni post_children ni post_media ni puede leer objetos del bucket; el staff sí ve y sube. Verificación: ambas pruebas negativas pasan; `get_advisors` sin alertas nuevas atribuibles.
12. Verificación final: `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm run build` (con el bug preexistente conocido de `/_global-error` en Next 16.3.6, ver Risks), Playwright del modal contra `references/pantallas/crear-publicacion.dc.html` (desktop y 375px) y del feed con post con y sin foto contra `feed.dc.html`; sin `fetch` directo ni `service_role`. Verificación: todos los gates pasan.

## Acceptance criteria

- [ ] `public.post_kind` existe con exactamente los 7 valores (`meal`…`announcement`) y ningún otro enum nuevo.
- [ ] `posts`, `post_children` y `post_media` existen con columnas, defaults, checks (`array_length` 1..7, `position` 1..10, `UNIQUE (post_id, position)`), FKs (`CASCADE` de las hijas al post, `RESTRICT` en author/daycare/child) y RLS habilitado; `public` pasa a tener 9 tablas.
- [ ] Existen las 6 policies de tablas usando `private.is_staff_of_daycare`, y ninguna policy da acceso a un usuario `parent` (probado con claims de parent).
- [ ] El bucket `posts-media` es privado y las policies de `storage.objects` permiten subir (`INSERT`) solo al staff/admin de la casa, solo con path `{daycare_id}/…`, mime jpeg/png/webp y ≤ 4MB; un intento con otro prefijo, mime o tamaño falla.
- [ ] El modal muestra los niños reales del daycare del staff (no a los 3 hardcodeados), con toggle individual y botón "Todos" que selecciona/limpia.
- [ ] FOTOS permite adjuntar 1..10 imágenes con preview y remover individual; 11 fotos, un archivo >4MB o un mime prohibido muestran el error inline correspondiente y bloquean Publicar.
- [ ] Marcar el kind "Foto" sin adjuntar imágenes muestra error inline y Publicar no envía nada.
- [ ] "Publicar" con datos válidos sube las fotos, inserta en las 3 tablas (post con `author_id` correcto, post_children por niño elegido, post_media con `position` en el orden de la UI) y al cerrarse el modal el feed `/` ya lo muestra arriba.
- [ ] Publicar sin fotos (kinds Comida/Siesta/…) crea un post válido sin filas en `post_media`.
- [ ] Publicar con fotos cuando algún niño elegido tiene `photo_consent = false` muestra error inline (con el nombre del niño), modal abierto y nada insertado.
- [ ] Si `createPost` falla a mitad de camino, los archivos ya subidos se eliminan del bucket y el error es inline en español, reintentable.
- [ ] El feed `/` lista los últimos 30 posts reales con remite, hora relativa, lista "Para: …", pills de kinds con colores y grid de fotos por URLs firmadas; con 0 posts muestra el estado vacío.
- [ ] El feed ya no importa nada de `data/mock.ts` y el archivo ya no existe; `PostType`/`Post` de mock no existen más.
- [ ] `npm run lint` y `npx next typegen && npx tsc --noEmit` pasan; el acceso a datos usa solo `utils/supabase/*`; sin `service_role` y sin `fetch` directo a la API de Supabase.
- [ ] `get_advisors` (security y performance) no reporta alertas nuevas atribuibles a este spec; Playwright (desktop + 375px) compara el modal y el feed con los mockups.

## Decisions

- **Yes:** una sola entidad `posts` con 7 kinds como etiquetas; `/avisos` es otra pantalla para otro spec. Decisión del grill; el kind `announcement` no desarrolla comportamiento distinto en este spec.
- **Yes:** un post compartido para N niños vía `post_children`. Descarta un post por niño: duplicaría el contenido en el feed y rompería la semántica de "Todos".
- **Yes:** `kinds post_kind[]` en `posts` (check 1..7) en lugar de tabla puente de kinds. Descarta la puente N:M: son máximo 7 valores fijos, y el array coincide tal cual con el multi-toggle del modal.
- **Yes:** bucket privado + URLs firmadas (~1h) generadas server-side en `getFeedPosts`. Fotos de menores = dato sensible; respeta el espíritu de `photo_consent`. Descarta bucket público: cualquier persona con URL vería la foto para siempre.
- **Yes:** upload directo desde el browser con el client de `utils/supabase/client.ts`. Descarta FormData vía Server Action: evita el límite de `serverActions.bodySizeLimit` y no buffera hasta 40MB en el server por request.
- **Yes:** las fotos se suben primero y luego `createPost` recibe los paths; sin `status draft` ni dos fases de publicación. El scoping lo garantiza el primer segmento del path (`daycare_id`), que el action revalida antes de aceptar.
- **Yes:** validación autoritativa repetida en el server (mime, tamaño, 10, kind↔fotos, consent, daycare de los children, prefijo de paths). El client valida solo para una UX rápida; la policy es la fuente de verdad.
- **Yes:** `photo_consent = false` en algún niño elegido bloquea publicar con fotos (error con el nombre del niño); sin fotos el post se permite. Decisión del grill: es el único punto sensible del flujo.
- **Yes:** solo `staff`/`admin` del daycare publican para cualquier child del daycare (no existe asignación staff↔sala). Elegir por sala requeriría otra tabla antes (otro spec).
- **Yes:** las policies reutilizan `private.is_staff_of_daycare` de SPEC 12. Descarta el `exists` con `users` inline: ese callejón produjo `42P17 infinite recursion` en SPEC 12 y el helper ya existe para evitarlo.
- **Yes:** botón "Todos" (plano, todos los children del daycare) en lugar del "Toda la sala" del mockup. Con salas reales y sin asignación de staff, la semántica a nivel sala se complica; revisar el copy cuando el catálogo crezca (decisión del grill).
- **Yes:** el card pierde likes/comentarios/Editar y el divider de "PUBLICADO HOY" pasa a "ÚLTIMAS PUBLICACIONES". Estaban amarrados al mock data; likes/comentarios/edición están fuera de alcance y mostrar contadores falsos tras el paso a feed real sería mentir al usuario.
- **Yes:** `data/mock.ts` se borra (`Post`/`PostType`/`posts`/`session`); `data/children.ts` NO se toca (queda como referencia, siguiendo SPEC 10/11/12).
- **Yes:** contrato `CreatePostResult` con error en español, modal abierto y reintentable: mismo patrón de SPEC 11 (`createKid`).
- **Yes:** UN spec único para DB + Storage + modal + feed, como SPEC 12: más grande pero cierra el ciclo completo; si estuviera dividido, el post quedara invisible hasta el próximo spec.
- **Yes:** el spec va en `specs/database/` y no en `specs/`: crea enum, tablas, policies, índices y bucket. La numeración `13` es global en todo `specs/`.
- **No:** `parent` en policies de lectura de posts o Storage (tiene otro spec: familia-feed), DELETE/UPDATE de posts, paginación, thumbnails, cámara nativa, UI de consentimiento, asignación staff↔sala, notificaciones.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| 10 fotos × 4MB: la subida puede ser lenta y sin progreso por foto | Botón "Publicando…" deshabilitado evita doble submit; compresión/resize queda como spec futuro. |
| Falla parcial deja archivos huérfanos (subidos pero sin post) | El client intenta `remove()` con los paths; las policies de Storage INSERT/DELETE por folder propio lo permiten. Huérfanos posibles solo si el navegador muere entre upload y action, sin link público expuesto. |
| Las URLs firmadas expiran (~1h) con la pestaña abierta | La página es `force-dynamic` y las 30 firmas se regeneran en cada request de `/`; recargar refresca. |
| Recursión de RLS en las policies de las tablas hijas hacia el padre | No es circular: hijas → posts → helper → users; se verifica con `get_advisors` y consultas con claims antes de cerrar. |
| Storage `metadata->>'size'` puede ser `null` en un upload no-imagen | El guard de mimetype excluye cualquier archivo no-imagen; NULL en size deniega el INSERT (fail-closed). Se verifica con una subida manual de prueba. |
| Modal con daycare sin ningún child cargado | El selector PARA muestra "No hay niños cargados todavía" y Publicar queda bloqueado por el error inline de PARA (patrón SPEC 11 con `rooms` vacía). |
| `<img>` plain en vez de `next/image` (dominio dinámico de Storage + firma por request) | Firmas por request ok; `next/image` requiere dominio estático o optimizador. Si el lint `@next/next/no-img-element` molesta, se deshabilita puntual en el file con comentario de justificación. |
| Build falla en `/_global-error` (`InvariantError: Expected workStore to be initialized`) | Bug preexistente del project (documentado en SPEC 12), no atribuible a este spec. Gates reales: `lint` + `tsc --noEmit` + Playwright. |

## Deviación estructural (aprobada in-session): RPC `public.create_post`

El Data model original decía "INSERT en transacción desde el Server Action", pero
`@supabase/supabase-js` no ofrece transacciones multi-statement: un insert secuencial
deja posts huérfanos si falla `post_children`/`post_media` y la compensación necesitaría
una policy DELETE fuera de alcance. Se usa el patrón RPC de SPEC 12: **el action delega
en una función `SECURITY DEFINER` atomicá** (insert validado de las 3 filas en un solo
statement transaccional). El SQL sigue en la conversación y en este repo (esta
desviación). Thrift de validación:

- En la RPC (fuente de verdad): identidad (`auth.uid()` + `users.role in ('staff','admin')` + `status='active'`), children del daycare del autor (JOIN `rooms.daycare_id`), prefix de `storagePath` = `daycare_id/`, positions 1..10 únicas, ≤10 fotos, kind `photo` exige media, `photo_consent=false` bloquea (error con nombre del niño), errores de datos = español genérico, `exception others` → mensaje controlado. Cada unidad de identidad, no de RLS.
- En el action (`app/(app)/actions.ts`): saneo barato del payload antes de llamar a la RPC (dedup/filtros), revalidatePath("/") solo con `ok: true`.

## What is **not** in this spec

- Pantalla `/avisos` y todo lo aislado por kind.
- Feed de familia, SELECT de posts para padres, panel de padres.
- Editar, borrar o archivar posts publicados y limpieza de media suelto.
- Likes, comentarios, notificaciones, resumen del día, paginación/scroll infinito.
- Resize/compresión de imágenes, thumbnails, cámara nativa.
- UI de `photo_consent`, asignación staff↔sala, catálogo de salas en el modal.
- `app/globals.css`, fuentes y el resto de las rutas (`/kids`, `/account`, `/notices`).

Cada uno de esos, si llega, va en su propio spec.
