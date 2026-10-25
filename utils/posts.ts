import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import {
  formatAudience,
  formatPostTime,
  isPostKind,
  type FeedPost,
} from "@/utils/post-kinds";

export type { FeedPost, FeedPostKid, PostKind } from "@/utils/post-kinds";
export { formatAudience, formatPostTime, postKinds } from "@/utils/post-kinds";

const SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Feed de `/`: los últimos `limit` posts del daycare del staff logueado.
 * La RLS gobierna el acceso; los paths de fotos se firman server-side
 * (bucket `posts-media`, privado). SERVER-ONLY: tirá de post-kinds.ts
 * desde componentes de client.
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
    kindIds: row.kinds.filter(isPostKind),
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
