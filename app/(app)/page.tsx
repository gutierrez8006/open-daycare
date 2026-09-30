import { posts, session } from "@/data/mock";
import PostCard from "@/components/post-card";

export const dynamic = "force-dynamic";

export default function Home() {
  const firstName = session.user.name.split(" ")[0];
  const todayLabel = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
    .format(new Date())
    .replace(/[.,]/g, "");

  return (
    <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
      <div className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-brand">
          GUARDERÍA · {session.sala.name.toUpperCase()}
        </div>
        <h1 className="font-display text-[30px] font-semibold text-ink">
          Buenas, {firstName}
        </h1>
        <p className="mt-[5px] text-[14.5px] text-muted-strong">
          {session.sala.childrenCount} niños · {todayLabel}
        </p>
      </div>

      <a
        href="#"
        className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-line bg-card px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-soft font-display text-base font-semibold text-white">
          {session.user.initial}
        </span>
        <span className="flex-1 text-[15px] text-muted">
          Compartí un momento…
        </span>
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-[#FBE3D8] text-[#E0654A]">
          <CameraIcon />
        </span>
      </a>

      <div className="mb-[14px] flex items-center gap-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-[#E7DAC8]" />
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
