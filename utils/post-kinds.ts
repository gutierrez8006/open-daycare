export type PostKind =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

/**
 * Los 7 kinds de publicación, con la paleta del mockup de SPEC 06
 * (las mismas que llevaba create-post-modal). Los identificadores son
 * los valores del enum `public.post_kind`. CLIENT-SAFE: lo importan
 * componentes de servidor y de client (nada de server-only acá).
 */
export const postKinds: {
  id: PostKind;
  label: string;
  bg: string;
  fg: string;
}[] = [
  { id: "meal", label: "Comida", bg: "#9A7B1E", fg: "#FFFFFF" },
  { id: "nap", label: "Siesta", bg: "#E7DCF6", fg: "#7B5FC0" },
  { id: "activity", label: "Actividad", bg: "#2E89A6", fg: "#FFFFFF" },
  { id: "achievement", label: "Logro", bg: "#CFEBD8", fg: "#3E9B6C" },
  { id: "mood", label: "Ánimo", bg: "#F9D2DE", fg: "#C56486" },
  { id: "photo", label: "Foto", bg: "#FBD8CC", fg: "#D9684A" },
  { id: "announcement", label: "Anuncio", bg: "#CCD8F4", fg: "#4E72C8" },
];

const kindById = new Map(postKinds.map((kind) => [kind.id, kind]));

export function isPostKind(value: string): value is PostKind {
  return kindById.has(value as PostKind);
}

export type FeedPostKid = {
  id: string;
  fullName: string;
};

export type FeedPost = {
  id: string;
  kindIds: PostKind[];
  authorId: string;
  authorName: string;
  body: string;
  time: string;
  audience: string;
  photoUrls: string[];
};

/**
 * "ahora" | "hace N min" | "hace N h" | "hace N día(s)" | fecha corta es-AR
 */
export function formatPostTime(created: Date): string {
  const diffMinutes = Math.floor((Date.now() - created.getTime()) / 60_000);
  if (diffMinutes < 1) return "ahora";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "hace 1 día" : `hace ${days} días`;

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(created);
}

/**
 * "Mateo, Sofía" | "Mateo, Sofía +2" (3 primeros + resto)
 */
export function formatAudience(names: string[]): string {
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
}

/** Contrato del Server Action `createPost` (SPEC 13) */
export type CreatePostInput = {
  kinds: PostKind[]; // 1..7 válidos
  childIds: string[]; // uuids; el usuario ve esos niños por RLS
  description: string; // trim no vacío
  media: { storagePath: string; position: number }[]; // 0..10; kinds con "photo" ⇒ ≥ 1
};

export type CreatePostResult = { ok: true } | { ok: false; error: string };
