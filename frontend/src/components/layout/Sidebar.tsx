"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bot,
  Activity,
  BarChart3,
  Headphones,
  Puzzle,
  Settings,
  Sparkles,
  Upload,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { FirefliesLogo } from "@/components/brand/FirefliesLogo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  soon?: boolean;
};

const railItems: NavItem[] = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
    match: (p) => p.startsWith("/home") || p === "/",
  },
  {
    href: "/askfred",
    label: "AskFred",
    icon: Bot,
    match: (p) => p.startsWith("/askfred"),
    soon: true,
  },
  {
    href: "/meetings",
    label: "Meetings",
    icon: Video,
    match: (p) => p === "/meetings" || p.startsWith("/meetings/"),
  },
  {
    href: "/live",
    label: "Meeting Status",
    icon: Activity,
    match: (p) => p.startsWith("/live"),
  },
  {
    href: "/uploads",
    label: "Uploads",
    icon: Upload,
    match: (p) => p.startsWith("/uploads"),
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: Puzzle,
    match: (p) => p.startsWith("/integrations"),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    match: (p) => p.startsWith("/analytics"),
    soon: true,
  },
  {
    href: "/voice-agents",
    label: "Voice Agents",
    icon: Headphones,
    match: (p) => p.startsWith("/voice-agents"),
  },
  {
    href: "/ai-apps",
    label: "AI Skills",
    icon: Sparkles,
    match: (p) =>
      p.startsWith("/ai-apps") ||
      p.startsWith("/digest") ||
      p.startsWith("/prep"),
  },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  variant?: "desktop" | "mobile";
  /** Icon-only rail (Meetings page layout) */
  collapsed?: boolean;
};

function linkClass(active: boolean, soon?: boolean, collapsed?: boolean) {
  if (collapsed) {
    return `flex h-10 w-10 items-center justify-center rounded-xl transition ${
      active
        ? "bg-[#F3F0FF] text-[#6C5CE7] dark:bg-aura-soft dark:text-aura-purple"
        : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] dark:hover:bg-[var(--aura-row-hover)]"
    } ${soon ? "opacity-60" : ""}`;
  }
  return `group flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-[13px] transition-all duration-150 ${
    active
      ? "bg-[#F3F0FF] font-semibold text-[#6C5CE7] dark:bg-aura-soft dark:text-aura-purple"
      : "font-medium text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827] dark:text-aura-gray dark:hover:bg-[var(--aura-row-hover)] dark:hover:text-aura-text"
  } ${soon ? "opacity-80" : ""}`;
}

function iconClass(active: boolean, collapsed?: boolean) {
  if (collapsed) {
    return `h-[20px] w-[20px] ${active ? "text-[#6C5CE7]" : "text-current"}`;
  }
  return `h-[18px] w-[18px] shrink-0 transition-colors ${
    active
      ? "text-[#6C5CE7] dark:text-aura-purple"
      : "text-[#6B7280] group-hover:text-[#4B5563] dark:text-aura-gray-2"
  }`;
}

function ExpandedNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  const groups = [
    railItems.slice(0, 2),         // Home, AskFred
    [railItems[2], railItems[3], railItems[4]],  // Meetings, Meeting Status, Uploads
    [railItems[5], railItems[6]],  // Integrations, Analytics
    [railItems[7], railItems[8]],  // Voice Agents, AI Skills
  ];

  return (
    <>
      <div className="flex h-[56px] shrink-0 items-center justify-between px-3.5">
        <Link href="/meetings" onClick={onClose} className="transition hover:opacity-90">
          <FirefliesLogo className="hidden px-4 lg:inline-flex" />
        </Link>
        {onClose ? (
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full p-2 text-aura-text hover:bg-aura-soft lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 ? (
              <div className="my-2.5 border-t border-[#E5E7EB] dark:border-[var(--aura-border-soft)]" />
            ) : null}
            <div className="space-y-0.5">
              {group.map((item) => {
                const Icon = item.icon;
                const active = !item.soon && item.match(pathname);
                if (item.soon) {
                  return (
                    <div
                      key={item.label}
                      className={linkClass(false, true)}
                      title="Coming soon"
                    >
                      <Icon className={iconClass(false)} strokeWidth={1.75} />
                      <span className="flex-1 truncate">{item.label}</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={linkClass(active)}
                  >
                    <Icon className={iconClass(active)} strokeWidth={1.75} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex-1" />
        <div className="my-2 border-t border-[#E5E7EB] dark:border-[var(--aura-border-soft)]" />
        <div className="shrink-0 space-y-0.5 pb-1">
          <Link
            href="/settings"
            onClick={onClose}
            className={linkClass(settingsActive)}
          >
            <Settings className={iconClass(settingsActive)} strokeWidth={1.75} />
            <span className="flex-1 truncate">Settings</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

function CollapsedRail() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  const top = [
    railItems[0],
    railItems[1],
    railItems[2],
    railItems[6],
    railItems[4],
    railItems[5],
  ];

  return (
    <>
      <div className="flex h-[56px] shrink-0 items-center justify-center">
        <Link
          href="/home"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"
          title="fireflies.ai"
        >
          <FirefliesLogo showWordmark={false} />
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col items-center gap-1 px-1.5 pb-2">
        {top.map((item) => {
          const Icon = item.icon;
          const active = !item.soon && item.match(pathname);
          if (item.soon) {
            return (
              <div
                key={item.label}
                className={linkClass(false, true, true)}
                title={`${item.label} — Coming soon`}
              >
                <Icon className={iconClass(false, true)} strokeWidth={1.75} />
              </div>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={linkClass(active, false, true)}
              title={item.label}
            >
              <Icon className={iconClass(active, true)} strokeWidth={1.75} />
            </Link>
          );
        })}

        <div className="flex-1" />

        <Link
          href="/settings"
          className={linkClass(settingsActive, false, true)}
          title="Settings"
        >
          <Settings className={iconClass(settingsActive, true)} strokeWidth={1.75} />
        </Link>
      </nav>
    </>
  );
}

export function Sidebar({
  open = false,
  onClose,
  variant = "desktop",
  collapsed = false,
}: SidebarProps) {
  if (variant === "mobile") {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200 ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onClose}
          aria-hidden={!open}
        />
        <aside
          className={`fixed bottom-0 left-0 top-8 z-50 flex w-[220px] flex-col border-r border-[#E5E7EB] bg-white transition-transform duration-200 ease-out dark:border-aura-border dark:bg-aura-sidebar ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ExpandedNav onClose={onClose} />
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`flex h-full w-full flex-col border-r border-[#E5E7EB] bg-[#FAFAFB] dark:border-aura-border dark:bg-aura-sidebar ${
        collapsed ? "" : "bg-white dark:bg-aura-sidebar"
      }`}
    >
      {collapsed ? <CollapsedRail /> : <ExpandedNav onClose={onClose} />}
    </aside>
  );
}
