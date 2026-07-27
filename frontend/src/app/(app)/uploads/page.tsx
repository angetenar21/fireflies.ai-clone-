"use client";

import { useRef, useState } from "react";
import { FileAudio, FileVideo, Inbox, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

const ACCEPTED = ".mp3,.m4a,.wav,.mp4,.webm";

const FILE_TYPES = [
  { label: "MP3", color: "#10B981" },
  { label: "M4A", color: "#6C5CE7" },
  { label: "WAV", color: "#3B82F6" },
  { label: "MP4", color: "#EF4444" },
  { label: "WEBM", color: "#F59E0B" },
];

export default function UploadsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState(true);
  const { success } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      success(`"${file.name}" received — transcription would start now.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      success(`"${file.name}" received — transcription would start now.`);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
      {/* Moving notice banner */}
      {notice && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
          <span className="flex-1">
            <strong className="font-semibold">Uploads are moving</strong> — you&apos;ll find them on the Meetings page soon.
          </span>
          <button
            type="button"
            onClick={() => setNotice(false)}
            className="shrink-0 rounded-md p-0.5 transition hover:bg-amber-200/60 dark:hover:bg-amber-700/40"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Drop zone card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed py-20 transition-all duration-200 ${
          dragging
            ? "border-[#6C5CE7] bg-[#F3F0FF] scale-[1.01] dark:bg-[#6C5CE7]/10"
            : "border-[#D1D5DB] bg-white hover:border-[#A78BFA] hover:bg-[#FAFAFA] dark:border-aura-border dark:bg-aura-bg dark:hover:bg-[var(--aura-row-hover)]"
        }`}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <Upload className="h-64 w-64 text-[#6C5CE7]" />
        </div>

        <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-md transition-transform duration-200 ${dragging ? "scale-110 bg-[#6C5CE7]" : "bg-gradient-to-br from-[#8B5CF6] to-[#6C5CE7]"}`}>
          <Upload className="h-7 w-7 text-white" />
        </div>

        <div className="relative text-center">
          <p className="text-[17px] font-semibold text-[#111827] dark:text-aura-text">
            {dragging ? "Drop your file here" : "Upload a file to generate a transcript"}
          </p>
          <p className="mt-2 text-[13px] text-[#6B7280] dark:text-aura-gray">
            Browse or drag and drop your file below
          </p>

          {/* File type pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {FILE_TYPES.map(({ label, color }) => (
              <span
                key={label}
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
                style={{ borderColor: color + "44", color, backgroundColor: color + "11" }}
              >
                {label}
              </span>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-[#9CA3AF] dark:text-aura-gray-2">
            Max video: 100 MB &nbsp;·&nbsp; Max audio: 500 MB
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative z-10 rounded-xl bg-[#6C5CE7] px-8 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(108,92,231,0.4)] transition hover:bg-[#5A4BCC] hover:shadow-[0_6px_20px_rgba(108,92,231,0.5)] active:scale-95"
        >
          Browse Files
        </button>
      </div>

      {/* Supported formats info row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 dark:border-aura-border dark:bg-aura-bg">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF]">
            <FileVideo className="h-5 w-5 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#111827] dark:text-aura-text">Video Files</p>
            <p className="mt-0.5 text-[12px] text-[#6B7280]">MP4, WEBM — Max 100 MB</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 dark:border-aura-border dark:bg-aura-bg">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF]">
            <FileAudio className="h-5 w-5 text-[#6C5CE7]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#111827] dark:text-aura-text">Audio Files</p>
            <p className="mt-0.5 text-[12px] text-[#6B7280]">MP3, M4A, WAV — Max 500 MB</p>
          </div>
        </div>
      </div>

      {/* Empty recent uploads */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white py-14 dark:border-aura-border dark:bg-aura-bg">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F9FAFB] dark:bg-[var(--aura-row-hover)]">
          <Inbox className="h-7 w-7 text-[#D1D5DB] dark:text-aura-gray-2" strokeWidth={1.25} />
        </div>
        <p className="text-[15px] font-semibold text-[#374151] dark:text-aura-text">
          You have no recent uploads!
        </p>
        <p className="text-[13px] text-[#9CA3AF] dark:text-aura-gray-2">
          Files you upload will appear here.
        </p>
      </div>
    </div>
  );
}
