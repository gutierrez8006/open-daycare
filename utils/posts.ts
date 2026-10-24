import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

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
 * los valores del enum `public.post_kind`.
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

const SIGNED_URL_TTL_SECONDS = 3600;

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

function formatAudience(names: string[]): string {
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
}

/**
 * Feed de `/`: los últimos `limit` posts del daycare del staff logueado.
 * La RLS gobierna el acceso; los paths de fotos se firman server-side
 * (bucket `posts-media`, privado).
 */
export const getFeedPosts = cache(async (limit = 30): Promise<FeedPost[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, description, kinds, created_at, " +
        "author:users(full_name), " +
        "kids:post_children ( child: children ( id, full_name ) ), " +
        "media:post_media ( storage_path, position )",
    )
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "post_media", ascending: true })
    .limit(limit);

  if (error || !data) return [];
  if (data.length === 0) return [];

  type Row = {
    id: string;
    author_id: string;
    description: string;
    kinds: string[];
    created_at: string;
    author: { full_name: string } | null;
    kids: { child: { id: string; full_name: string } }[];
    media: { storage_path: string; position: number }[];
  };
  const rows = data as unknown as Row[];

  const paths = [
    ...new Set(rows.flatMap((row) => row.media.map((m) => m.storage_path))),
  ];
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("posts-media")
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    for (const item of signedUrls ?? []) {
      if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    kindIds: row.kinds.filter((kind) => kindById.has(kind as PostKind)) as PostKind[],
    authorId: row.author_id,
    authorName: row.author?.full_name ?? "",
    body: row.description,
    time: formatPostTime(new Date(row.created_at)),
    audience: formatAudience(
      row.kids.map((entry) => entry.child?.full_name ?? "").filter(Boolean),
    ),
    photoUrls: row.media
      .map((m) => urlByPath.get(m.storage_path))
      .filter((url): url is string => Boolean(url)),
  }));
});
