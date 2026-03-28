import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/components/providers";
import { SiteNav } from "@/app/components/site-nav";
import { isGithubAuthConfigured } from "@/lib/github";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Build",
    template: "%s · Build",
  },
  description: "A polished GitHub shipping dashboard for brandonperfetti.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const githubAuthConfigured = isGithubAuthConfigured();
  const themeScript = `
(() => {
  const STORAGE_KEY = "build-theme";
  const root = document.documentElement;
  const fromStorage = (() => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  })();
  // document.cookie is a semicolon-separated name=value list only; cookie
  // attributes such as Path/SameSite are not present here, so this matcher
  // safely extracts build-theme when set and returns null when absent/invalid.
  const fromCookie = document.cookie.match(/(?:^|;\\s*)build-theme=(light|dark)(?:;|$)/)?.[1] ?? null;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = fromStorage ?? fromCookie ?? systemTheme;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
})();
`;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          <div className="min-h-screen bg-[var(--page-gradient)] pb-4 sm:pb-6">
            <SiteNav githubAuthConfigured={githubAuthConfigured} />
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pt-4 sm:gap-6 sm:px-5 sm:pt-6 lg:px-8 lg:pt-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
