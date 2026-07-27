"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";

const SUGGESTIONS = [
  "What were the action items?",
  "What decisions were made?",
  "Summarize blockers.",
];

export function AskFredPanel() {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-aura-soft text-aura-purple">
          <Bot className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-aura-text">AskFred</h3>
          <p className="text-[11px] text-aura-gray-2">AI meeting assistant</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-aura-border bg-[var(--aura-input-bg)] p-3">
        <div className="mr-4 rounded-xl border border-aura-border bg-aura-bg px-3 py-2.5 text-sm text-aura-text">
          Ask Fred is coming soon.
          <p className="mt-1 text-xs text-aura-gray">
            Soon you&apos;ll ask questions about this meeting and get answers from
            the transcript, summary, and action items.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled
              className="cursor-not-allowed rounded-full border border-aura-border bg-aura-bg px-2.5 py-1 text-[11px] font-medium text-aura-gray-2 opacity-70"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask anything about this meeting…"
          className="aura-input"
          disabled
        />
        <button
          type="submit"
          disabled
          className="aura-btn-primary shrink-0 opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
