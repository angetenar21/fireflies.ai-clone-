"use client";

import { useState } from "react";
import { Activity, ChevronDown, Video } from "lucide-react";

export default function LiveBotPage() {
  const [dateFilter, setDateFilter] = useState("Today");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateOpen, setDateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const dateOptions = ["Today", "Yesterday", "This Week", "Last Week", "This Month"];
  const statusOptions = ["All Status", "In Progress", "Completed", "Scheduled"];

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(108,92,231,0.12),_transparent_30%),linear-gradient(180deg,#F8F7FF_0%,#FAFAFB_36%,#F4F6FB_100%)] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_60px_rgba(17,24,39,0.08)] backdrop-blur dark:border-aura-border dark:bg-aura-bg/95">
        {/* Filter bar */}
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3 sm:px-6 dark:border-aura-border">
          {/* Date filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDateOpen((v) => !v);
                setStatusOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D8DCEF] bg-[#FBFBFE] px-4 py-2 text-[13px] font-medium text-[#374151] shadow-sm transition hover:border-[#C9CCF3] hover:bg-white dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
            >
              <Activity className="h-3.5 w-3.5 text-[#6C5CE7]" />
              {dateFilter}
              <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
            {dateOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-1 shadow-xl dark:border-aura-border dark:bg-aura-bg">
                {dateOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setDateFilter(opt);
                      setDateOpen(false);
                    }}
                    className={`flex w-full items-center rounded-xl px-3 py-2 text-[13px] transition hover:bg-[#F7F7FF] dark:hover:bg-[var(--aura-row-hover)] ${dateFilter === opt
                        ? "bg-[#F3F0FF] font-semibold text-[#6C5CE7]"
                        : "text-[#374151] dark:text-aura-text"
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setStatusOpen((v) => !v);
                setDateOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D8DCEF] bg-[#FBFBFE] px-4 py-2 text-[13px] font-medium text-[#374151] shadow-sm transition hover:border-[#C9CCF3] hover:bg-white dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
            >
              <Video className="h-3.5 w-3.5 text-[#6B7280]" />
              {statusFilter}
              <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
            {statusOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-1 shadow-xl dark:border-aura-border dark:bg-aura-bg">
                {statusOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setStatusFilter(opt);
                      setStatusOpen(false);
                    }}
                    className={`flex w-full items-center rounded-xl px-3 py-2 text-[13px] transition hover:bg-[#F7F7FF] dark:hover:bg-[var(--aura-row-hover)] ${statusFilter === opt
                        ? "bg-[#F3F0FF] font-semibold text-[#6C5CE7]"
                        : "text-[#374151] dark:text-aura-text"
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-[#FBFBFE] px-4 py-2 text-[13px] font-medium text-[#6B7280] shadow-sm transition hover:border-[#C9CCF3] hover:text-[#6C5CE7] dark:border-aura-border dark:bg-aura-bg"
            >
              Feedback
            </button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-xl rounded-[32px] border border-[#EAEAF3] bg-white px-6 py-12 text-center shadow-[0_20px_70px_rgba(17,24,39,0.06)] dark:border-aura-border dark:bg-aura-bg">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,rgba(108,92,231,0.12),rgba(108,92,231,0.05))]">
              <Video className="h-11 w-11 text-[#6C5CE7]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[24px] font-semibold tracking-tight text-[#111827] dark:text-aura-text">
              No Meetings Found
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-6 text-[#6B7280]">
              No meeting matches your current filters. Try adjusting them to see results.
            </p>
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setDateFilter("Today");
                  setStatusFilter("All Status");
                }}
                className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#374151] shadow-sm transition hover:border-[#D4D8E8] hover:bg-[#FBFBFE] dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
