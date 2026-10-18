"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { session } from "@/data/mock";
import CreatePostModal from "@/components/create-post-modal";

type NavItem = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Feed",
    href: "/",
    isActive: (pathname) => pathname === "/",
    icon: <HomeIcon />,
  },
  {
    label: "Niños",
    href: "/kids",
    isActive: (pathname) =>
      pathname === "/kids" || pathname.startsWith("/kids/"),
    icon: <ChildrenIcon />,
  },
  { label: "Avisos", href: "/notices", isActive: (pathname) => pathname === "/notices", icon: <BellIcon /> },
  { label: "Mi cuenta", href: "/account", isActive: (pathname) => pathname === "/account", icon: <UserIcon /> },
];

function SidebarContent({
  onNavigate,
  onCreatePost,
}: {
  onNavigate?: () => void;
  onCreatePost?: () => void;
}) {
  const pathname = usePathname();
  const roomLabel = session.sala.name.replace(/^Sala /, "");

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <SunIcon />
        </span>
        <span>
          <span className="block font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </span>
          <span className="mt-0.5 block text-[11.5px] text-muted">
            {session.sala.name}
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => {
          onCreatePost?.();
          onNavigate?.();
        }}
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <PlusIcon />
        Nueva publicación
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[12px] px-3 py-[11px] text-[14.5px] ${
                active
                  ? "bg-[#FBE3D8] font-extrabold text-brand"
                  : "font-semibold text-[#6E6359]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-[10px] border-t border-line pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-brand-soft font-display text-base font-semibold text-white">
            {session.user.initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-ink">
              {session.user.name}
            </span>
            <span className="block text-xs text-muted">
              {session.user.role} · {roomLabel}
            </span>
          </span>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={onNavigate}
            className="relative flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-canvas text-muted-strong after:absolute after:-inset-1.5 after:content-['']"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-[12px] text-ink"
        >
          <MenuIcon />
        </button>
        <Link href="/" className="flex h-11 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
            <SunIcon />
          </span>
          <span className="font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </span>
        </Link>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-card px-4 py-6 lg:flex">
        <SidebarContent onCreatePost={() => setOpen(true)} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-line bg-card px-4 py-6">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={closeDrawer}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-[10px] text-muted-strong"
            >
              <CloseIcon />
            </button>
            <SidebarContent
              onNavigate={closeDrawer}
              onCreatePost={() => setOpen(true)}
            />
          </div>
        </div>
      )}

      <CreatePostModal
        open={open}
        onClose={() => setOpen(false)}
        onPublish={() => setOpen(false)}
      />
    </>
  );
}

function SunIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function HomeIcon() {
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
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function ChildrenIcon() {
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
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
    </svg>
  );
}

function BellIcon() {
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
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function UserIcon() {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
