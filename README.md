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

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) (App Router) | React framework with server components |
| [TypeScript](https://www.typescriptlang.org/) | Type safety throughout |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark/light mode |
| [GitHub REST API](https://docs.github.com/en/rest) | Repository and activity data |
| [Lucide React](https://lucide.dev/) | Icon library |

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
```

> **Note:** The `GITHUB_TOKEN` is used server-side only and is never exposed to the client.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Build

```bash
npm run build
npm run start
```

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
