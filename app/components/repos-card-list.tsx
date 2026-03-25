"use client";

import { useRef, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button, ButtonLink } from "@/app/components/ui/button";
import { formatRepoDate, type Repo } from "@/lib/github";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export function ReposCardList({
  repos,
  className,
}: {
  repos: Repo[];
  className?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const visibleRepos = repos.slice(0, visibleCount);
  const canLoadMore = visibleCount < repos.length;
  const canShowLess = visibleCount > PAGE_SIZE;

  const handleLoadMore = () => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, repos.length));
  };

  const handleShowLess = () => {
    setVisibleCount(PAGE_SIZE);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={listTopRef} className={cn(className)}>
      <div className="grid gap-4 lg:grid-cols-2">
        {visibleRepos.map((repo) => (
          <article
            key={repo.id}
            className="rounded-3xl border border-[var(--border)] bg-[var(--card-muted)] p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--accent-soft)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] motion-reduce:hover:translate-y-0 sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {repo.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {repo.description ?? "No description yet."}
                </p>
              </div>
              <Badge>{repo.language ?? "Unknown"}</Badge>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="bg-transparent">
                {repo.stargazers_count} stars
              </Badge>
              <Badge className="bg-transparent">{repo.forks_count} forks</Badge>
              <Badge className="bg-transparent">
                Updated {formatRepoDate(repo.pushed_at)}
              </Badge>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href={repo.html_url} target="_blank" rel="noreferrer">
                View source
              </ButtonLink>
              {repo.homepage ? (
                <ButtonLink
                  href={repo.homepage}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                >
                  Open live site
                </ButtonLink>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {canLoadMore ? (
          <Button variant="secondary" onClick={handleLoadMore}>
            Show more repos ({repos.length - visibleCount} remaining)
          </Button>
        ) : null}
        {canShowLess ? (
          <Button variant="ghost" onClick={handleShowLess}>
            Show fewer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
