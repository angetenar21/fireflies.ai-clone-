"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/profile/ProfileProvider";
import { fetchMeetings } from "@/lib/meetings";
import { formatMeetingDate } from "@/lib/format";
import type { MeetingListItem } from "@/lib/types";
import {
  CalendarDays,
  Play,
  Upload,
  Video,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";

export default function HomePage() {
  const { profile, firstName } = useProfile();
  const { success } = useToast();
  const [recentMeeting, setRecentMeeting] = useState<MeetingListItem | null>(null);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetchMeetings({ sort: "recency" });
        if (res.meetings.length > 0) {
          setRecentMeeting(res.meetings[0]);
        }
      } catch (err) {
        console.error("Failed to fetch recent meeting:", err);
      }
    }
    loadRecent();
  }, []);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-aura-bg">
      <div className="relative overflow-hidden px-6 pb-12 pt-8 sm:px-8">
        {/* Abstract gradient background to match the screenshot */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E1EDFA] via-[#FDF1E7] to-[#FFF3E8] opacity-80" />
        
        <div className="relative mx-auto max-w-5xl">
          {/* Main banner card */}
          <div className="flex flex-col-reverse items-center justify-between gap-8 rounded-2xl bg-[#FFF6EF] p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] sm:flex-row sm:p-12 border border-[#FBEADF]">
            <div className="max-w-md">
              <h1 className="text-[28px] font-semibold text-[#111827]">
                Welcome Aboard, {firstName}!
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
                Fireflies is now ready to automate your meetings and streamline your workflows.
              </p>
            </div>
            
            {/* Video Placeholder */}
            <div className="relative w-full max-w-[340px] shrink-0 overflow-hidden rounded-xl bg-[#2A0F55] shadow-lg aspect-[16/9] border border-black/10">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#3B1778] to-[#12052C]">
                 <div className="absolute top-4 w-full px-6 flex items-center justify-center gap-1.5 opacity-80">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#FF4C4C]"></span>
                   <span className="text-[10px] text-white/90 font-medium tracking-wide">Fireflies Product Demo</span>
                 </div>
                 {/* Interface mockup lines */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[60%] border border-white/10 rounded-md bg-white/5 flex flex-col pt-3 px-3 gap-2 backdrop-blur-sm">
                    <div className="w-full h-1/2 bg-white/5 rounded"></div>
                    <div className="flex gap-2 h-1/3">
                      <div className="w-1/3 h-full bg-white/5 rounded"></div>
                      <div className="w-1/3 h-full bg-white/5 rounded"></div>
                      <div className="w-1/3 h-full bg-white/5 rounded"></div>
                    </div>
                 </div>
                 {/* Play Button */}
                 <button 
                  onClick={() => success("Product Demo — Coming Soon")}
                  className="absolute z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#6C5CE7] text-white shadow-lg transition hover:scale-105 hover:bg-[#5A4BCC]">
                   <Play className="h-5 w-5 ml-1" fill="currentColor" />
                 </button>
                 {/* Presenter Avatar */}
                 <div className="absolute bottom-3 left-3 h-8 w-8 rounded-full border-2 border-[#12052C] bg-gray-300 overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=11" alt="Presenter" className="w-full h-full object-cover" />
                 </div>
              </div>
            </div>
          </div>

          {/* Quick Start Section */}
          <div className="mt-12">
            <h2 className="text-[18px] font-semibold text-[#111827]">Quick Start</h2>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Capture your first meeting or upload a recording to see Fireflies in action.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <button 
                onClick={() => success("Schedule Meeting — Coming Soon")}
                className="group flex items-center justify-between rounded-xl bg-[#FDF2F8] px-5 py-4 transition hover:bg-[#FCE7F3] border border-[#FBCFE8]/50"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-[#DB2777]" strokeWidth={1.5} />
                  <span className="text-[14px] font-medium text-[#111827]">Schedule Meeting</span>
                </div>
                <span className="text-[#9CA3AF] transition group-hover:translate-x-0.5 group-hover:text-[#6B7280]">›</span>
              </button>

              <Link 
                href="/uploads"
                className="group flex items-center justify-between rounded-xl bg-[#ECFDF5] px-5 py-4 transition hover:bg-[#D1FAE5] border border-[#A7F3D0]/50"
              >
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-[#059669]" strokeWidth={1.5} />
                  <span className="text-[14px] font-medium text-[#111827]">Upload File</span>
                </div>
                <span className="text-[#9CA3AF] transition group-hover:translate-x-0.5 group-hover:text-[#6B7280]">›</span>
              </Link>

              <button 
                onClick={() => success("Capture Meeting — Coming Soon")}
                className="group flex items-center justify-between rounded-xl bg-[#F5F3FF] px-5 py-4 transition hover:bg-[#EDE9FE] border border-[#DDD6FE]/50"
              >
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-[#6C5CE7]" strokeWidth={1.5} />
                  <span className="text-[14px] font-medium text-[#111827]">Capture Meeting</span>
                </div>
                <span className="text-[#9CA3AF] transition group-hover:translate-x-0.5 group-hover:text-[#6B7280]">›</span>
              </button>
            </div>
          </div>

          {/* Recent Meetings Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <div className="flex rounded-lg bg-[#F3F4F6] p-1 dark:bg-aura-soft">
                <button className="rounded-md bg-white px-4 py-1.5 text-[13px] font-medium text-[#111827] shadow-sm dark:bg-[var(--aura-row-hover)] dark:text-aura-text">
                  Recent
                </button>
                <button onClick={() => success("Upcoming — Coming Soon")} className="px-4 py-1.5 text-[13px] font-medium text-[#6B7280] hover:text-[#111827] dark:text-aura-gray dark:hover:text-aura-text">
                  Upcoming
                </button>
                <button onClick={() => success("AI Feed — Coming Soon")} className="px-4 py-1.5 text-[13px] font-medium text-[#6B7280] hover:text-[#111827] dark:text-aura-gray dark:hover:text-aura-text">
                  AI Feed
                </button>
              </div>

              <Link href="/settings" className="flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280] hover:text-[#111827] dark:text-aura-gray dark:hover:text-aura-text">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>

            <div className="mt-4">
              {recentMeeting ? (
                <Link
                  href={`/meetings/${recentMeeting.id}`}
                  className="group flex items-center gap-4 rounded-xl bg-[#F9FAFB] p-4 transition hover:bg-[#F3F4F6] border border-transparent hover:border-[#E5E7EB] dark:bg-aura-soft dark:hover:bg-[var(--aura-row-hover)] dark:hover:border-aura-gray/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-aura-bg">
                    <img src="/logo.png" alt="Fireflies" className="h-6 w-6 object-cover rounded" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-aura-text group-hover:text-[#6C5CE7] transition-colors">
                      {recentMeeting.title}
                    </h3>
                    <p className="text-[13px] text-[#6B7280] dark:text-aura-gray mt-0.5">
                      {formatMeetingDate(recentMeeting.date)}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center justify-center rounded-xl bg-[#F9FAFB] p-8 dark:bg-aura-soft">
                  <div className="flex items-center gap-2 text-[14px] text-[#6B7280]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#6C5CE7] border-t-transparent"></div>
                    Loading recent meeting...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
