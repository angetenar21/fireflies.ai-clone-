"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, Plus } from "lucide-react";
import { MeetingRow } from "@/components/meetings/MeetingRow";
import { NewMeetingModal } from "@/components/meetings/NewMeetingModal";
import { dateInputToIsoEnd, dateInputToIsoStart } from "@/lib/format";
import { fetchTags } from "@/lib/annotations";
import { fetchMeetings } from "@/lib/meetings";
import type { MeetingListItem, Participant, Tag } from "@/lib/types";

const DEBOUNCE_MS = 300;

function ListSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4 sm:px-6">
      {[1, 2].map((g) => (
        <div key={g}>
          <div className="aura-skeleton mb-2 h-3 w-24" />
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-aura-border dark:bg-aura-bg">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-[var(--aura-border-soft)] px-4 py-3.5 last:border-b-0"
              >
                <div className="aura-skeleton h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="aura-skeleton h-3.5 w-2/3" />
                  <div className="aura-skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeetingsDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const listView = searchParams.get("view") ?? "my";

  const [search, setSearch] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ.trim());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<"recency" | "oldest">("recency");
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(
    null
  );
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [scope, setScope] = useState<"hosted" | "shared">("hosted");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
    setDebouncedSearch(q.trim());
  }, [searchParams]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedSearch === current.trim()) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedSearch, pathname, router, searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMeetings({
        q: debouncedSearch || undefined,
        date_from: dateInputToIsoStart(dateFrom),
        date_to: dateInputToIsoEnd(dateTo),
        sort,
        tag: selectedTag || undefined,
        scope,
      });
      setMeetings(data.meetings);

      const map = new Map<number, Participant>();
      for (const m of data.meetings) {
        for (const p of m.participants) map.set(p.id, p);
      }
      setAllParticipants((prev) => {
        const next = new Map(prev.map((p) => [p.id, p]));
        Array.from(map.entries()).forEach(([id, p]) => next.set(id, p));
        return Array.from(next.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
    } catch {
      setError("Could not load meetings. Is the API running on localhost:8000?");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateFrom, dateTo, sort, selectedTag, scope]);

  useEffect(() => {
    void fetchMeetings({ sort: "recency" })
      .then((data) => {
        const map = new Map<number, Participant>();
        for (const m of data.meetings) {
          for (const p of m.participants) map.set(p.id, p);
        }
        setAllParticipants(
          Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => undefined);
    void fetchTags()
      .then(setAllTags)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMeetings = useMemo(() => {
    let list = meetings;

    if (listView === "voice") {
      list = list.filter(
        (m) =>
          m.tags?.some((t) => /voice/i.test(t.name)) ||
          /voice|agent/i.test(m.title)
      );
    }

    if (selectedParticipantId != null) {
      list = list.filter((m) =>
        m.participants.some((p) => p.id === selectedParticipantId)
      );
    }

    return list;
  }, [meetings, selectedParticipantId, listView]);

  const groupedByDate = useMemo(() => {
    const groups: { label: string; items: MeetingListItem[] }[] = [];
    const map = new Map<string, MeetingListItem[]>();
    for (const m of filteredMeetings) {
      const d = new Date(m.date);
      const label = Number.isNaN(d.getTime())
        ? "Unknown date"
        : d.toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(m);
    }
    for (const [label, items] of Array.from(map.entries())) {
      groups.push({ label, items });
    }
    return groups;
  }, [filteredMeetings]);

  const viewTitle =
    listView === "all"
      ? "All Meetings"
      : listView === "voice"
        ? "Voice Agent Meetings"
        : "Meetings";

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] flex-col bg-[#FAFAFB] dark:bg-canvas">
      <div className="sticky top-[calc(2rem+56px)] z-10 border-b border-[#E5E7EB] bg-white px-4 py-3 dark:border-aura-border dark:bg-aura-bg sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[18px] font-semibold text-aura-text">{viewTitle}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-[260px] sm:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-aura-gray-2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or keyword"
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] py-1.5 pl-8 pr-3 text-[12px] text-aura-text outline-none placeholder:text-aura-gray-2 focus:border-aura-purple/40 focus:ring-2 focus:ring-aura-purple/10 dark:border-aura-border dark:bg-[var(--aura-input-bg)]"
              />
            </div>
            {(
              [
                { id: "hosted" as const, label: "Hosted by me" },
                { id: "shared" as const, label: "Shared with me" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScope(tab.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  scope === tab.id
                    ? "border-[#D1D5DB] bg-white text-aura-text shadow-sm dark:border-aura-border dark:bg-aura-bg"
                    : "border-transparent text-aura-gray hover:bg-[#F3F4F6] dark:hover:bg-[var(--aura-row-hover)]"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
                filtersOpen
                  ? "border-aura-purple/40 bg-aura-soft text-aura-purple"
                  : "border-[#E5E7EB] bg-white text-aura-gray hover:border-aura-muted dark:border-aura-border dark:bg-aura-bg"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 dark:border-aura-border dark:bg-[var(--aura-input-bg)]">
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-aura-gray">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="aura-input h-9 py-1 text-xs"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-aura-gray">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="aura-input h-9 py-1 text-xs"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-aura-gray">Tag</span>
              <select
                value={selectedTag ?? ""}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="aura-input h-9 py-1 text-xs"
              >
                <option value="">All tags</option>
                {allTags.map((t) => (
                  <option key={t.id} value={t.name}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-aura-gray">
                Participant
              </span>
              <select
                value={selectedParticipantId ?? ""}
                onChange={(e) =>
                  setSelectedParticipantId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="aura-input h-9 py-1 text-xs"
              >
                <option value="">Anyone</option>
                {allParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                setSort((s) => (s === "recency" ? "oldest" : "recency"))
              }
              className="aura-btn-secondary h-9 text-xs"
            >
              {sort === "recency" ? "Newest first" : "Oldest first"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSelectedTag(null);
                setSelectedParticipantId(null);
              }}
              className="h-9 text-xs font-semibold text-aura-purple hover:underline"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 px-4 py-4 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <ListSkeleton />
        ) : filteredMeetings.length === 0 ? (
          listView === "voice" ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-10 flex flex-col items-center space-y-4">
                <div className="flex w-[280px] items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-semibold text-slate-500">
                    K
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-slate-100"></div>
                  </div>
                </div>
                <div className="flex w-[320px] items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-semibold text-slate-500">
                    A
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-slate-100"></div>
                    <div className="h-1.5 w-12 rounded-full bg-slate-100"></div>
                  </div>
                </div>
                <div className="flex w-[280px] items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-semibold text-slate-500">
                    R
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-slate-100"></div>
                  </div>
                </div>
              </div>
              <p className="text-[17px] font-semibold text-[#111827]">
                Let a voice agent take your meetings
              </p>
              <p className="mt-2.5 max-w-[420px] text-[14px] text-[#6B7280]">
                Create a voice agent to attend meetings on your behalf, or
                explore existing agents.
              </p>
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#5A4BCC]"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-16 text-center dark:border-aura-border dark:bg-aura-bg">
              <p className="text-base font-semibold text-aura-text">
                No meetings found
              </p>
              <p className="mt-1 text-sm text-aura-gray">
                Try a different search, clear filters, or create a new meeting.
              </p>
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="aura-btn-primary mt-4"
              >
                New Meeting
              </button>
            </div>
          )
        ) : (
          <div className="space-y-5">
            {groupedByDate.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 px-1 text-[13px] font-semibold text-aura-gray">
                  {group.label}
                </h2>
                <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-aura-border dark:bg-aura-bg">
                  <ul>
                    {group.items.map((meeting) => (
                      <li key={meeting.id}>
                        <MeetingRow
                          meeting={meeting}
                          onChanged={() => void load()}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewMeetingModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => void load()}
      />
    </div>
  );
}
