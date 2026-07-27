"use client";

import { ArrowDownUp, CalendarRange, ChevronDown, Plus, Search, Tag, Users, X } from "lucide-react";
import type { Participant, Tag as TagType } from "@/lib/types";

type MeetingsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  sort: "recency" | "oldest";
  onSortToggle: () => void;
  total: number;
  onNewMeeting: () => void;
  participants: Participant[];
  selectedParticipantId: number | null;
  onParticipantChange: (id: number | null) => void;
  participantMenuOpen: boolean;
  onParticipantMenuOpenChange: (open: boolean) => void;
  tags: TagType[];
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
  tagMenuOpen: boolean;
  onTagMenuOpenChange: (open: boolean) => void;
};

export function MeetingsToolbar({
  search,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  sort,
  onSortToggle,
  total,
  onNewMeeting,
  participants,
  selectedParticipantId,
  onParticipantChange,
  participantMenuOpen,
  onParticipantMenuOpenChange,
  tags,
  selectedTag,
  onTagChange,
  tagMenuOpen,
  onTagMenuOpenChange,
}: MeetingsToolbarProps) {
  const selected = participants.find((p) => p.id === selectedParticipantId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-aura-text">
            Meetings
          </h1>
          <p className="mt-1 text-sm text-aura-gray">
            {total} meeting{total === 1 ? "" : "s"}
            {search ? ` matching “${search}”` : ""}
            {selected ? ` · ${selected.name}` : ""}
            {selectedTag ? ` · #${selectedTag}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onSortToggle} className="aura-btn-secondary h-9">
            <ArrowDownUp className="h-3.5 w-3.5" />
            {sort === "recency" ? "Newest first" : "Oldest first"}
          </button>
          <button type="button" onClick={onNewMeeting} className="aura-btn-primary h-9">
            <Plus className="h-4 w-4" />
            New Meeting
          </button>
        </div>
      </div>

      <div className="aura-card flex flex-col gap-3 p-3 lg:flex-row lg:flex-wrap lg:items-center">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-gray-2" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-lg border border-aura-border bg-[var(--aura-input-bg)] py-2.5 pl-10 pr-3 text-sm text-aura-text outline-none transition placeholder:text-aura-gray-2 focus:border-aura-purple focus:bg-aura-bg focus:ring-2 focus:ring-aura-purple/15"
          />
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => onParticipantMenuOpenChange(!participantMenuOpen)}
            className="inline-flex h-[42px] w-full items-center gap-2 rounded-lg border border-aura-border bg-[var(--aura-input-bg)] px-3 text-sm text-aura-text transition hover:border-aura-muted lg:min-w-[180px]"
          >
            <Users className="h-4 w-4 text-aura-gray-2" />
            <span className="flex-1 truncate text-left">
              {selected ? selected.name : "All participants"}
            </span>
            {selected ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onParticipantChange(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onParticipantChange(null);
                  }
                }}
                className="rounded p-0.5 text-aura-gray-2 hover:bg-aura-bg hover:text-aura-purple"
                aria-label="Clear participant filter"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-aura-gray-2" />
            )}
          </button>

          {participantMenuOpen ? (
            <div className="aura-menu left-0 right-0 z-30 max-h-64 overflow-y-auto lg:right-auto lg:w-64">
              <button
                type="button"
                className="aura-menu-item"
                onClick={() => {
                  onParticipantChange(null);
                  onParticipantMenuOpenChange(false);
                }}
              >
                All participants
              </button>
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`aura-menu-item ${
                    selectedParticipantId === p.id ? "bg-aura-soft text-aura-purple" : ""
                  }`}
                  onClick={() => {
                    onParticipantChange(p.id);
                    onParticipantMenuOpenChange(false);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => onTagMenuOpenChange(!tagMenuOpen)}
            className="inline-flex h-[42px] w-full items-center gap-2 rounded-lg border border-aura-border bg-[var(--aura-input-bg)] px-3 text-sm text-aura-text transition hover:border-aura-muted lg:min-w-[160px]"
          >
            <Tag className="h-4 w-4 text-aura-gray-2" />
            <span className="flex-1 truncate text-left">
              {selectedTag ? `#${selectedTag}` : "All tags"}
            </span>
            {selectedTag ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagChange(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onTagChange(null);
                  }
                }}
                className="rounded p-0.5 text-aura-gray-2 hover:bg-aura-bg hover:text-aura-purple"
                aria-label="Clear tag filter"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-aura-gray-2" />
            )}
          </button>
          {tagMenuOpen ? (
            <div className="aura-menu left-0 right-0 z-30 max-h-64 overflow-y-auto lg:right-auto lg:w-56">
              <button
                type="button"
                className="aura-menu-item"
                onClick={() => {
                  onTagChange(null);
                  onTagMenuOpenChange(false);
                }}
              >
                All tags
              </button>
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`aura-menu-item ${
                    selectedTag === t.name ? "bg-aura-soft text-aura-purple" : ""
                  }`}
                  onClick={() => {
                    onTagChange(t.name);
                    onTagMenuOpenChange(false);
                  }}
                >
                  #{t.name}
                </button>
              ))}
              {tags.length === 0 ? (
                <p className="px-3 py-2 text-xs text-aura-gray-2">No tags yet</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-aura-gray-2 sm:inline-flex">
            <CalendarRange className="h-3.5 w-3.5" />
            Date
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="aura-input bg-[var(--aura-input-bg)] py-2.5"
            aria-label="From date"
          />
          <span className="hidden text-aura-gray-2 sm:inline">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="aura-input bg-[var(--aura-input-bg)] py-2.5"
            aria-label="To date"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                onDateFromChange("");
                onDateToChange("");
              }}
              className="text-sm font-semibold text-aura-purple hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
