"use client";

import { Suspense } from "react";
import { MeetingsDashboard } from "@/components/meetings/MeetingsDashboard";

function MeetingsFallback() {
  return (
    <div className="space-y-6">
      <div className="aura-skeleton h-8 w-48" />
      <div className="aura-skeleton h-24 w-full rounded-xl" />
      <div className="aura-skeleton h-96 w-full rounded-xl" />
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<MeetingsFallback />}>
      <MeetingsDashboard />
    </Suspense>
  );
}
