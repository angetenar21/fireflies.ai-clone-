"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Pencil, Trash2, X } from "lucide-react";
import {
  deleteComment,
  updateComment,
} from "@/lib/annotations";
import { formatClock } from "@/lib/format";
import type { MeetingDetail, TranscriptComment } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

type CommentsDrawerProps = {
  open: boolean;
  onClose: () => void;
  meeting: MeetingDetail;
  comments: TranscriptComment[];
  onChange: (comments: TranscriptComment[]) => void;
  onJumpToLine: (lineId: number) => void;
};

export function CommentsDrawer({
  open,
  onClose,
  meeting,
  comments,
  onChange,
  onJumpToLine,
}: CommentsDrawerProps) {
  const { success, error } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  if (!open) return null;

  const lineText = (lineId: number) => {
    const line = meeting.transcript_lines.find((l) => l.id === lineId);
    if (!line) return "Transcript line";
    const name = line.speaker?.name ?? "Speaker";
    return `${name} · ${formatClock(line.start_time_seconds)}`;
  };

  const save = async (id: number) => {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    setBusyId(id);
    try {
      const updated = await updateComment(meeting.id, id, trimmed);
      onChange(comments.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      success("Comment updated.");
    } catch {
      error("Could not update comment.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    setBusyId(id);
    try {
      await deleteComment(meeting.id, id);
      onChange(comments.filter((c) => c.id !== id));
      success("Comment deleted.");
    } catch {
      error("Could not delete comment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 lg:bg-transparent"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-aura-border bg-aura-bg shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-aura-border px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-aura-purple" />
            <h2 className="text-sm font-semibold text-aura-text">
              Comments ({comments.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-aura-gray-2 hover:bg-aura-soft"
            aria-label="Close comments"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <p className="py-10 text-center text-sm text-aura-gray">
              Select a transcript line and add a comment.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-aura-border bg-[var(--aura-input-bg)] p-3"
              >
                <button
                  type="button"
                  onClick={() => onJumpToLine(c.transcript_line_id)}
                  className="text-left text-[11px] font-semibold text-aura-purple hover:underline"
                >
                  {lineText(c.transcript_line_id)}
                </button>
                {editingId === c.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="aura-input min-h-[72px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="aura-btn-secondary h-8 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="aura-btn-primary h-8 text-xs"
                        disabled={busyId === c.id}
                        onClick={() => void save(c.id)}
                      >
                        {busyId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1.5 text-sm text-aura-text">{c.body}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[11px] text-aura-gray-2">
                        {c.author_name}
                      </p>
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-aura-gray-2 hover:bg-aura-soft hover:text-aura-purple"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditBody(c.body);
                          }}
                          aria-label="Edit comment"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-aura-gray-2 hover:bg-red-50 hover:text-red-500"
                          onClick={() => void remove(c.id)}
                          aria-label="Delete comment"
                        >
                          {busyId === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
