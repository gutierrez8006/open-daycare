import type { Post, PostType } from "@/data/mock";

const badgeByType: Record<PostType, { label: string; className: string }> = {
  achievement: { label: "LOGRO", className: "bg-[#CFEBD8] text-[#3E9B6C]" },
  activity: { label: "ACTIVIDAD", className: "bg-[#C7E7F1] text-[#2E89A6]" },
  announcement: { label: "ANUNCIO", className: "bg-[#CCD8F4] text-[#4E72C8]" },
};

const avatarByVariant: Record<
  Post["author"]["variant"],
  { className: string; showInitial: boolean }
> = {
  child: { className: "bg-[#A9D9E8] text-[#1F7A93]", showInitial: true },
  announce: { className: "bg-[#CCD8F4] text-[#4E72C8]", showInitial: false },
};

export default function PostCard({ post }: { post: Post }) {
  const badge = badgeByType[post.type];
  const avatar = avatarByVariant[post.author.variant];

  return (
    <article className="rounded-[20px] border border-line bg-card px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        <div
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold ${avatar.className}`}
        >
          {avatar.showInitial ? (
            post.author.initial
          ) : (
            <MegaphoneIcon />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.author.name}
          </div>
          <div className="text-[12.5px] text-muted">
            {post.time} · publicado por vos
          </div>
        </div>
        <div
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 text-[12px] font-extrabold tracking-[.5px] ${badge.className}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {badge.label}
        </div>
      </div>

      <div className="mb-[10px] text-[12.5px] text-muted">
        Para: {post.audience}
      </div>

      <p className="text-[15.5px] leading-[1.55] text-[#4A4038]">{post.body}</p>

      {post.photo && (
        <a
          href="#"
          className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[13.5px] text-[#B0A290]"
        >
          <ImageIcon />
          <span>Foto · {post.photo.label}</span>
        </a>
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-[14px]">
        <span className="flex items-center gap-[7px] text-sm font-bold text-[#E0654A]">
          <HeartIcon />
          {post.likes}
        </span>
        <a
          href="#"
          className="flex items-center gap-[7px] text-sm font-bold text-muted-strong"
        >
          <CommentIcon />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-sm font-extrabold text-[#C5503A]">
          Editar
        </a>
      </div>
    </article>
  );
}

function MegaphoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="#E0654A"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}
