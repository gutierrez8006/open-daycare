"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  isPostKind,
  type CreatePostInput,
  type CreatePostResult,
  type PostKind,
} from "@/utils/post-kinds";

const MAX_PHOTOS = 10;
const MAX_PHOTO_POSITION = 10;

/**
 * Publica un post: la fuente de verdad es la RPC `public.create_post`
 * (SECURITY DEFINER) que revalida identidad/RLS-equivalente, consentimiento
 * y paths, e inserta las 3 filas en una sola transacción. Este action viene
 * después: sanea el payload y refresca el feed.
 */
export async function createPost(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const supabase = await createClient();

  const kinds: PostKind[] = Array.isArray(input?.kinds)
    ? [...new Set(input.kinds.filter(isPostKind))]
    : [];
  const childIds: string[] = Array.isArray(input?.childIds)
    ? [...new Set(input.childIds)]
    : [];
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";
  const media = (Array.isArray(input?.media) ? input.media : []).filter(
    (photo) =>
      photo &&
      typeof photo.storagePath === "string" &&
      photo.storagePath.length > 0 &&
      Number.isInteger(photo.position) &&
      photo.position >= 1 &&
      photo.position <= MAX_PHOTO_POSITION,
  );
  const validMedia = [...new Map(media.map((photo) => [photo.position, photo])).values()];

  if (
    kinds.length === 0 ||
    childIds.length === 0 ||
    description === "" ||
    media.length > MAX_PHOTOS ||
    validMedia.length !== media.length
  ) {
    return { ok: false, error: "Los datos de la publicación son inválidos." };
  }
  if (kinds.includes("photo") && media.length === 0) {
    return { ok: false, error: "El tipo Foto requiere al menos una imagen." };
  }

  const { data, error: rpcError } = await supabase.rpc("create_post", {
    p_input: {
      kinds,
      childIds,
      description,
      media: validMedia.map((photo) => ({
        storagePath: photo.storagePath,
        position: photo.position,
      })),
    },
  });

  const result =
    typeof data === "string"
      ? (JSON.parse(data) as { ok?: boolean; error?: string })
      : (data as { ok?: boolean; error?: string } | null);
  if (rpcError || !result) {
    return { ok: false, error: "No se pudo publicar. Intentá de nuevo." };
  }
  if (!result.ok) {
    return {
      ok: false,
      error:
        typeof result.error === "string" && result.error
          ? result.error
          : "No se pudo publicar. Intentá de nuevo.",
    };
  }

  revalidatePath("/");
  return { ok: true };
}
