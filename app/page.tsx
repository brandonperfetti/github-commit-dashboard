import { Badge } from '@/app/components/ui/badge';
import { ButtonLink } from '@/app/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ActivityOverview } from '@/app/components/activity-overview';
import { SectionShell } from '@/app/components/section-shell';
import { getContributionDays, getRepos, USERNAME } from '@/lib/github';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [days, repos] = await Promise.all([getContributionDays(), getRepos()]);
  const totalContributions = days.reduce((sum, day) => sum + day.count, 0);
  const topLanguages = [...new Set(repos.map((repo) => repo.language).filter(Boolean))].slice(0, 4);
  const featuredRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count || +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionShell className="overflow-hidden p-0">
        <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[1.25fr_0.95fr] lg:items-end lg:px-8 lg:py-8">
          <div>
            <Badge>Overview</Badge>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card-muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Live public GitHub signal
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-6xl">
              Build turns GitHub activity into a cleaner operating dashboard.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-[17px]">
              A focused front-end for {USERNAME}&apos;s public GitHub output. Start with the signal, then drill into activity, repos, and featured work without the usual GitHub noise.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/activity">Open activity</ButtonLink>
              <ButtonLink href="/repos" variant="secondary">Browse repos</ButtonLink>
              <ButtonLink href={`https://github.com/${USERNAME}`} target="_blank" rel="noreferrer" variant="ghost">
                GitHub profile
              </ButtonLink>
            </div>
          </div>

          <Card className="relative overflow-hidden p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(16,185,129,0.14),transparent)]" />
            <CardHeader className="relative">
              <CardDescription>At a glance</CardDescription>
              <CardTitle className="text-3xl text-balance">{totalContributions} contributions in 30 days</CardTitle>
            </CardHeader>
            <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Repos tracked</div>
                <div className="mt-2 text-2xl font-semibold">{repos.length}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Languages</div>
                <div className="mt-2 text-2xl font-semibold">{topLanguages.length}</div>
              </div>
            </div>
            <div className="relative mt-5 flex flex-wrap gap-2">
              {topLanguages.map((language) => (
                <Badge key={language}>{language}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </SectionShell>

      <ActivityOverview days={days} compact />

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionShell>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Featured work</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">A few projects worth pulling forward first.</p>
            </div>
            <ButtonLink href="/featured" variant="secondary">View all</ButtonLink>
          </div>
          <div className="mt-5 space-y-3">
            {featuredRepos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4 transition hover:bg-[var(--accent-soft)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{repo.name}</div>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{repo.description ?? 'No description yet.'}</p>
                  </div>
                  <Badge>{repo.stargazers_count}★</Badge>
                </div>
              </a>
            ))}
          </div>
        </SectionShell>

        <SectionShell>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Repository view</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Recent repos, language mix, and shipping velocity.</p>
            </div>
            <ButtonLink href="/repos" variant="secondary">Open repos</ButtonLink>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {repos.slice(0, 4).map((repo) => (
              <Card key={repo.id} className="rounded-2xl bg-[var(--card-muted)] p-4 shadow-none">
                <div className="font-medium">{repo.name}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{repo.description ?? 'No description yet.'}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                  <span>{repo.language ?? 'Unknown'}</span>
                  <span>{repo.forks_count} forks</span>
                </div>
              </Card>
            ))}
          </div>
        </SectionShell>
      </section>
    </div>
  );
}
