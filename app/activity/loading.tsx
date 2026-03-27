"use client";

import { useEffect, useState } from "react";
import { SectionShell } from "@/app/components/section-shell";

const SKELETON_DELAY_MS = 450;

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--card-muted)] ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function ActivityLoading() {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, SKELETON_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  if (!showSkeleton) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionShell className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] bg-[var(--hero)] px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="mt-4 h-10 w-80 max-w-full" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
          <SkeletonBlock className="mt-2 h-4 w-3/4 max-w-xl" />
        </div>
        <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-6 md:grid-cols-4 lg:px-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-28" />
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="mt-2 h-4 w-72" />
        <SkeletonBlock className="mt-5 h-56 w-full" />
      </SectionShell>

      <SectionShell>
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="mt-2 h-4 w-80" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-56" />
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <SkeletonBlock className="h-6 w-52" />
        <SkeletonBlock className="mt-2 h-4 w-96 max-w-full" />
        <SkeletonBlock className="mt-4 h-64 w-full" />
      </SectionShell>
    </div>
  );
}
