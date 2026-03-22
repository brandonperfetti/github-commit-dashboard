import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/components/providers";
import { SiteNav } from "@/app/components/site-nav";

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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          <div className="min-h-screen bg-[var(--page-gradient)] pb-4 sm:pb-6">
            <SiteNav />
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pt-4 sm:gap-6 sm:px-5 sm:pt-6 lg:px-8 lg:pt-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
