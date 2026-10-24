import type { FeedPost } from "@/utils/post-kinds";
import { postKinds } from "@/utils/post-kinds";

export default function PostCard({ post }: { post: FeedPost }) {
  const kinds = postKinds.filter((kind) => post.kindIds.includes(kind.id));
  const authorInitial = post.authorName.split(" ")[0]?.[0]?.toUpperCase() ?? "";

  return (
    <article className="rounded-[20px] border border-line bg-card px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[17px] font-semibold text-[#1F7A93]">
          {authorInitial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.authorName}
          </div>
          <div className="text-[12.5px] text-muted">{post.time}</div>
        </div>
        <div className="flex flex-none flex-wrap justify-end gap-[7px]">
          {kinds.map((kind) => (
            <div
              key={kind.id}
              style={{ backgroundColor: kind.bg, color: kind.fg }}
              className="flex items-center gap-[7px] rounded-full px-3 py-1.5 font-display text-[12px] font-extrabold tracking-[.5px]"
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {kind.label}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-[10px] text-[12.5px] text-muted">
        Para: {post.audience}
      </div>

      <p className="text-[15.5px] leading-[1.55] text-[#4A4038]">{post.body}</p>

      {post.photoUrls.length > 0 && (
        <div
          className={`mt-[14px] grid gap-[8px] ${
            post.photoUrls.length === 1
              ? "grid-cols-1"
              : post.photoUrls.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          {post.photoUrls.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${post.id}-${index}`}
              src={url}
              alt={`Foto ${index + 1} de la publicación`}
              className="h-[200px] w-full rounded-[16px] object-cover"
            />
          ))}
        </div>
      )}
    </article>
  );
}
