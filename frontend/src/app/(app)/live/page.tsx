"use client";

import { useState } from "react";
import { Activity, ChevronDown, Video, X } from "lucide-react";

export default function LiveBotPage() {
  const [dateFilter, setDateFilter] = useState("Today");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateOpen, setDateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const dateOptions = ["Today", "Yesterday", "This Week", "Last Week", "This Month"];
  const statusOptions = ["All Status", "In Progress", "Completed", "Scheduled"];

  return (
    <div className="flex h-full flex-col">
      {/* Filter bar */}
      <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-6 py-3 dark:border-aura-border dark:bg-aura-bg">
        {/* Date filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setDateOpen((v) => !v); setStatusOpen(false); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
          >
            <Activity className="h-3.5 w-3.5 text-[#6C5CE7]" />
            {dateFilter}
            <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
          </button>
          {dateOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg dark:border-aura-border dark:bg-aura-bg">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setDateFilter(opt); setDateOpen(false); }}
                  className={`flex w-full items-center px-3 py-2 text-[13px] transition hover:bg-[#F9FAFB] dark:hover:bg-[var(--aura-row-hover)] ${
                    dateFilter === opt ? "font-semibold text-[#6C5CE7]" : "text-[#374151] dark:text-aura-text"
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
            onClick={() => { setStatusOpen((v) => !v); setDateOpen(false); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
          >
            <Activity className="h-3.5 w-3.5 text-[#6B7280]" />
            {statusFilter}
            <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg dark:border-aura-border dark:bg-aura-bg">
              {statusOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setStatusFilter(opt); setStatusOpen(false); }}
                  className={`flex w-full items-center px-3 py-2 text-[13px] transition hover:bg-[#F9FAFB] dark:hover:bg-[var(--aura-row-hover)] ${
                    statusFilter === opt ? "font-semibold text-[#6C5CE7]" : "text-[#374151] dark:text-aura-text"
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
            className="text-[13px] text-[#6B7280] hover:text-[#6C5CE7] hover:underline"
          >
            Feedback
          </button>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-6 flex h-[120px] w-[160px] items-center justify-center rounded-2xl bg-[#F0EFFE]">
          <Video className="h-10 w-10 text-[#6C5CE7]" strokeWidth={1.5} />
        </div>
        <h2 className="text-[17px] font-semibold text-[#111827] dark:text-aura-text">
          No Meetings Found
        </h2>
        <p className="mt-2 max-w-[320px] text-center text-[13px] text-[#6B7280]">
          No meeting matches your current filters. Try adjusting them to see results.
        </p>
        <button
          type="button"
          onClick={() => { setDateFilter("Today"); setStatusFilter("All Status"); }}
          className="mt-5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] shadow-sm transition hover:bg-[#F9FAFB] dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
