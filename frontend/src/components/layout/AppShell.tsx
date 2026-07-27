"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { FirefliesLogo } from "@/components/brand/FirefliesLogo";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MeetingsNavPanel } from "@/components/meetings/MeetingsNavPanel";
import { AiAppsNavPanel } from "@/components/ai-apps/AiAppsNavPanel";
import { NewMeetingModal } from "@/components/meetings/NewMeetingModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const pathname = usePathname();
  const isDetail = pathname.startsWith("/meetings/") && pathname !== "/meetings";
  const isMeetingsList = pathname === "/meetings";
  const isAiAppsSection =
    pathname.startsWith("/ai-apps") ||
    pathname.startsWith("/digest") ||
    pathname.startsWith("/prep");
  const collapseRail = isMeetingsList || isDetail || isAiAppsSection;
  const isWide =
    pathname.startsWith("/voice-agents") ||
    isAiAppsSection ||
    isMeetingsList ||
    isDetail;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const railWidth = collapseRail ? "w-[56px]" : "w-[220px]";

  return (
    <div className="flex min-h-screen bg-canvas text-aura-text">
      <div className={`flex min-h-screen w-full`}>
        {/* Desktop primary nav */}
        <div
          className={`sticky z-50 hidden h-screen shrink-0 transition-[width] duration-200 lg:block top-0 h-screen ${railWidth}`}
        >
          <Sidebar
            open={open}
            onClose={() => setOpen(false)}
            variant="desktop"
            collapsed={collapseRail}
          />
        </div>

        {isMeetingsList ? (
          <div className="sticky top-0 z-40 hidden h-screen shrink-0 lg:block">
            <Suspense
              fallback={
                <div className="h-full w-[240px] border-r border-aura-border bg-white" />
              }
            >
              <MeetingsNavPanel />
            </Suspense>
          </div>
        ) : null}



        <div className="lg:hidden">
          <Sidebar open={open} onClose={() => setOpen(false)} variant="mobile" />
        </div>

        <div
          className={`flex min-w-0 flex-1 flex-col min-h-screen`}
        >
          {!isDetail ? (
            <div className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-aura-border bg-aura-bg px-3 lg:hidden">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg p-2 text-aura-gray hover:bg-[var(--aura-row-hover)]"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <FirefliesLogo />
            </div>
          ) : null}

          {!isDetail ? <TopBar onNewMeeting={() => setNewOpen(true)} /> : null}

          {isMeetingsList ? (
            <div className="border-b border-aura-border bg-white px-3 py-2 lg:hidden dark:bg-aura-bg">
              <Suspense fallback={null}>
                <div className="flex gap-2 overflow-x-auto">
                  {(
                    [
                      { id: "my", label: "My Meetings", href: "/meetings?view=my" },
                      { id: "all", label: "All Meetings", href: "/meetings?view=all" },
                      {
                        id: "voice",
                        label: "Voice Agents",
                        href: "/meetings?view=voice",
                      },
                    ] as const
                  ).map((t) => (
                    <a
                      key={t.id}
                      href={t.href}
                      className="shrink-0 rounded-full border border-aura-border px-3 py-1.5 text-[12px] font-semibold text-aura-gray"
                    >
                      {t.label}
                    </a>
                  ))}
                </div>
              </Suspense>
            </div>
          ) : null}

          <main
            className={`flex-1 ${
              isDetail || isMeetingsList || isAiAppsSection
                ? "px-0 py-0"
                : "px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5"
            }`}
          >
            <div
              className={`mx-auto w-full ${
                isWide || isDetail ? "max-w-none" : "max-w-[1180px]"
              } ${isMeetingsList || isDetail || isAiAppsSection ? "h-full" : ""}`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <NewMeetingModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
