"use client";

import { useState } from "react";
import {
  ChevronDown,
  Compass,
  LayoutGrid,
  Plus,
  Rss,
  Search,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

type MainTab = "discover" | "active" | "feed";
type SkillsTab = "my" | "team";

const SKILLS = [
  {
    id: 1,
    name: "Process Improvement",
    owner: "Manish Yadav",
    schedule: "Per Meeting",
    color: "#F97316",
    enabled: false,
  },
  {
    id: 2,
    name: "Automation Finder",
    owner: "Manish Yadav",
    schedule: "Per Meeting",
    color: "#10B981",
    enabled: false,
  },
  {
    id: 3,
    name: "Risk Detector",
    owner: "Manish Yadav",
    schedule: "Per Meeting",
    color: "#06B6D4",
    enabled: false,
  },
  {
    id: 4,
    name: "Daily Brief",
    owner: "Manish Yadav",
    schedule: "Every day",
    color: "#8B5CF6",
    enabled: false,
  },
];

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-[#6C5CE7]" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
          enabled ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function SkillIcon({ color }: { color: string }) {
  return (
    <div
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: color }}
    >
      <Sparkles className="h-5 w-5 text-white" />
      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
        <svg className="h-2.5 w-2.5 text-[#10B981]" viewBox="0 0 10 10" fill="currentColor">
          <path d="M8.5 2.5L4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>
    </div>
  );
}

export default function AiAppsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("active");
  const [skillsTab, setSkillsTab] = useState<SkillsTab>("my");
  const [search, setSearch] = useState("");
  const [skills, setSkills] = useState(SKILLS);
  const { success } = useToast();

  const toggleSkill = (id: number) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const MAIN_TABS = [
    { key: "discover" as const, label: "Discover", icon: Compass },
    { key: "active" as const, label: `Active Skills (${skills.length})`, icon: Zap },
    { key: "feed" as const, label: "Feed", icon: Rss },
  ];

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-white dark:bg-aura-bg">
      {/* Top tab bar */}
      <div className="border-b border-[#E5E7EB] px-6 dark:border-aura-border">
        <div className="flex gap-0">
          {MAIN_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMainTab(key)}
              className={`relative pb-3 pt-4 text-[14px] font-medium transition ${
                mainTab === key
                  ? "text-[#6C5CE7]"
                  : "text-[#6B7280] hover:text-[#374151]"
              } mr-6`}
            >
              {label}
              {mainTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#6C5CE7]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DISCOVER tab */}
      {mainTab === "discover" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F0FF]">
            <Compass className="h-8 w-8 text-[#6C5CE7]" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#111827]">
            Discover AI Skills
          </h2>
          <p className="max-w-sm text-[14px] text-[#6B7280]">
            Browse the marketplace to find and install AI Skills that run automatically on your meetings.
          </p>
          <span className="rounded-full border border-[#6C5CE7]/30 bg-[#F3F0FF] px-3 py-1 text-[12px] font-semibold text-[#6C5CE7]">
            Coming Soon
          </span>
        </div>
      )}

      {/* FEED tab */}
      {mainTab === "feed" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7ED]">
            <Rss className="h-8 w-8 text-[#F97316]" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#111827]">
            Your AI Skills Feed
          </h2>
          <p className="max-w-sm text-[14px] text-[#6B7280]">
            Outputs from your active AI Skills will appear here after each meeting runs.
          </p>
          <span className="rounded-full border border-[#F97316]/30 bg-[#FFF7ED] px-3 py-1 text-[12px] font-semibold text-[#F97316]">
            Coming Soon
          </span>
        </div>
      )}

      {/* ACTIVE SKILLS tab */}
      {mainTab === "active" && (
        <div className="flex flex-1 flex-col px-6 py-5">
          {/* Sub-tabs + search + create */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* My Skills / Team Skills pills */}
            <div className="flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 dark:border-aura-border dark:bg-aura-bg">
              {(["my", "team"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSkillsTab(t)}
                  className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition ${
                    skillsTab === t
                      ? "bg-[#F9FAFB] text-[#111827] shadow-sm dark:bg-aura-soft"
                      : "text-[#6B7280] hover:text-[#374151]"
                  }`}
                >
                  {t === "my" ? "My Skills" : "Team Skills"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-1.5 pl-8 pr-3 text-[13px] text-[#374151] placeholder:text-[#9CA3AF] outline-none focus:border-[#6C5CE7]/40 focus:ring-2 focus:ring-[#6C5CE7]/10 dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
              />
            </div>

            {/* Create button */}
            <button
              type="button"
              onClick={() => success("Create Skill — Coming Soon")}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#5A4BCC]"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>

          {/* Filter pills row */}
          <div className="mb-5 flex flex-wrap gap-2">
            {[
              { label: "Category", icon: LayoutGrid },
              { label: "Schedule", icon: null },
              { label: "Created by · 1", icon: User },
              { label: "Runs for", icon: Zap },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => success(`Filter: ${label} — Coming Soon`)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#374151] transition hover:bg-[#F9FAFB] dark:border-aura-border dark:bg-aura-bg dark:text-aura-text"
              >
                {Icon && <Icon className="h-3.5 w-3.5 text-[#6B7280]" />}
                {label}
                <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
              </button>
            ))}
          </div>

          {/* Skills list */}
          {skillsTab === "team" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9FAFB] dark:bg-[var(--aura-row-hover)]">
                <User className="h-6 w-6 text-[#D1D5DB]" />
              </div>
              <p className="text-[15px] font-semibold text-[#374151] dark:text-aura-text">
                No team skills yet
              </p>
              <p className="text-[13px] text-[#9CA3AF]">
                Skills shared by your team will appear here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[14px] text-[#9CA3AF]">
              No skills match your search.
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6] dark:divide-aura-border">
              {filtered.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-4 py-4"
                >
                  <SkillIcon color={skill.color} />
                  <div className="flex flex-1 flex-col">
                    <span className="text-[14px] font-semibold text-[#111827] dark:text-aura-text">
                      {skill.name}
                    </span>
                    <span className="mt-0.5 text-[12px] text-[#6B7280]">
                      {skill.owner}
                      <span className="mx-1.5 text-[#D1D5DB]">·</span>
                      {skill.schedule}
                    </span>
                  </div>
                  <Toggle
                    enabled={skill.enabled}
                    onChange={() => toggleSkill(skill.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
