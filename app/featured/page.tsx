import { Badge } from '@/app/components/ui/badge';
import { ButtonLink } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { SectionShell } from '@/app/components/section-shell';
import { formatRepoDate, getContributionDays, getRepos } from '@/lib/github';

export const metadata = {
  title: 'Featured',
};

export const dynamic = 'force-dynamic';

export default async function FeaturedPage() {
  const [days, repos] = await Promise.all([getContributionDays(), getRepos()]);
  const featured = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count || +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .slice(0, 6);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <SectionShell>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500/80">Featured</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Projects to lead with</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              A lightweight curation pass based on public repo signals: stars first, fresh pushes second.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{total} contributions / 30d</Badge>
            <Badge>{activeDays} active days</Badge>
          </div>
        </div>
      </SectionShell>

      <section className="grid gap-4 lg:grid-cols-3">
        {featured.map((repo, index) => (
          <Card key={repo.id} className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <Badge>#{index + 1}</Badge>
              <Badge>{repo.stargazers_count}★</Badge>
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight">{repo.name}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{repo.description ?? 'No description yet.'}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)]">
              <span>{repo.language ?? 'Unknown'}</span>
              <span>•</span>
              <span>Updated {formatRepoDate(repo.pushed_at)}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={repo.html_url} target="_blank" rel="noreferrer">Source</ButtonLink>
              {repo.homepage ? (
                <ButtonLink href={repo.homepage} target="_blank" rel="noreferrer" variant="secondary">Live</ButtonLink>
              ) : null}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
