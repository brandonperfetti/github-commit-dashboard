import { Badge } from "@/app/components/ui/badge";
import { ButtonLink } from "@/app/components/ui/button";
import { SectionShell } from "@/app/components/section-shell";
import { formatRepoDate, getRepos } from "@/lib/github";

export const metadata = {
  title: "Repos",
};

export const dynamic = "force-dynamic";

export default async function ReposPage() {
  const repos = await getRepos();

  return (
    <SectionShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-emerald-500/80 uppercase">
            Repos
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Repository surface area
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Public repositories sorted by recent activity. Simple, readable, and
            directly tied to the live GitHub account.
          </p>
        </div>
        <Badge>{repos.length} active repos</Badge>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {repos.map((repo) => (
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
                Source
              </ButtonLink>
              {repo.homepage ? (
                <ButtonLink
                  href={repo.homepage}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                >
                  Live
                </ButtonLink>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
