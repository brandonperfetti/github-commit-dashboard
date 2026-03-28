# GitHub Commit Dashboard

<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github&logoColor=white" />

**A clean, focused operating dashboard for your GitHub activity.**

[Live Demo](https://github-commit-dashboard.vercel.app) · [Report Bug](https://github.com/brandonperfetti/github-commit-dashboard/issues)

</div>

---

## Overview

GitHub Commit Dashboard transforms raw GitHub API signals into a polished, scannable UI. It surfaces your recent contribution history, top repositories, and language breakdown — without the noise of the standard GitHub profile UI.

Built with **Next.js App Router** (server components for real-time data), **Tailwind CSS**, and a dark/light theme system, it's a practical tool for developers who want a cleaner lens into their own productivity.

---

## Features

- 📊 **Contribution Activity** — Visual heatmap-style contribution feed over the past 30 days
- 🏆 **Featured Repositories** — Top repos surfaced by star count and recent push activity
- 🗂️ **Repository Browser** — Full list of public repos with language, stars, and last-updated indicators
- 🌐 **Language Breakdown** — At-a-glance view of your most-used languages across repositories
- 🌙 **Dark / Light Mode** — System-aware theme toggle via `next-themes`
- ⚡ **Live GitHub Signal** — Server-side data fetching ensures fresh data on every page load

---

## Tech Stack

| Technology                                                | Purpose                                |
| --------------------------------------------------------- | -------------------------------------- |
| [Next.js](https://nextjs.org/) (App Router)               | React framework with server components |
| [TypeScript](https://www.typescriptlang.org/)             | Type safety throughout                 |
| [Tailwind CSS](https://tailwindcss.com/)                  | Utility-first styling                  |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark/light mode                        |
| [GitHub REST API](https://docs.github.com/en/rest)        | Repository and activity data           |
| [Lucide React](https://lucide.dev/)                       | Icon library                           |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) or compatible package manager
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, with `public_repo` scope)

### Installation

```bash
git clone https://github.com/brandonperfetti/github-commit-dashboard.git
cd github-commit-dashboard
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_USERNAME=your_github_username
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=replace_with_a_long_random_secret
```

> **Note:** The `GITHUB_TOKEN` is used server-side only and is never exposed to the client.
> **Note:** `NEXT_PUBLIC_SITE_URL` is required for production builds and metadata URLs.
> **Note:** `REVALIDATE_SECRET` secures on-demand cache invalidation (`POST /api/revalidate`).

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## GitHub API Auth (Recommended)

This dashboard can run against anonymous GitHub API limits, but you will hit `403` rate limits more often during local development.

Add a token in `.env.local`:

```bash
GITHUB_TOKEN=github_pat_...
ALLOWED_DEV_ORIGINS=192.168.1.156
```

Notes:

- Keep it server-side only (do not prefix with `NEXT_PUBLIC_`).
- `ALLOWED_DEV_ORIGINS` accepts a comma-separated list for local device testing (for example, `192.168.1.156,192.168.1.200`).
- Fine-grained token with read access to repositories is preferred.
- With a token present, the app uses authenticated `/user/repos` calls and can include private repositories you can access.
- Without a token, it falls back to public `/users/{username}/repos`.

### Production Build

```bash
npm run build
npm run start
```

### Environment Validation

```bash
npm run validate:env -- --mode=production
```

This checks required production variables (currently `NEXT_PUBLIC_SITE_URL`) and fails fast when missing or malformed.

### On-Demand Cache Revalidation

Trigger targeted cache invalidation (by tag and/or path):

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{
    "tags": ["route:activity", "github:commit-timing"],
    "paths": ["/activity"]
  }'
```

Supported payload fields:

- `tags`: cache tags set via `cacheTag(...)`
- `paths`: route paths for `revalidatePath(...)`

Security notes:

- The endpoint requires `REVALIDATE_SECRET`.
- Secret can be passed via `x-revalidate-secret` or `Authorization: Bearer ...`.
- Tags must match `^[a-z0-9:_-]{2,64}$`; paths must begin with `/`.

### Revalidate via GitHub Actions

Use the `Revalidate Cache` workflow (`.github/workflows/revalidate-cache.yml`) to trigger invalidation from the Actions UI:

1. Open **Actions** → **Revalidate Cache** → **Run workflow**
2. Select `Preview` or `Production`
3. Optionally override `base_url`
4. Provide comma-separated `tags_csv` and `paths_csv`

The workflow calls `POST /api/revalidate` with `REVALIDATE_SECRET`.

### Scheduled Cache Warm-Up

The `Warm Route Cache` workflow (`.github/workflows/warm-route-cache.yml`) runs every 15 minutes and pings key routes (`/`, `/activity`, `/repos`, `/featured`) to reduce cold-cache first-load latency.

You can also run it manually from Actions and override:

- `target_environment` (`Preview` or `Production`)
- `base_url`
- `routes_csv`

### Linting

```bash
npm run lint
```

---

## Project Structure

```
github-commit-dashboard/
├── app/
│   ├── activity/         # Contribution activity page
│   ├── components/       # Shared UI components
│   ├── featured/         # Featured repositories page
│   ├── repos/            # Repository browser page
│   ├── layout.tsx        # Root layout with theme provider
│   └── page.tsx          # Dashboard home
├── lib/
│   └── github.ts         # GitHub API utilities
└── public/               # Static assets
```

---

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/). Add your `GITHUB_TOKEN` and `GITHUB_USERNAME` as environment variables in the Vercel project settings.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brandonperfetti/github-commit-dashboard)

---

## License

MIT © [Brandon Perfetti](https://brandonperfetti.com)
