const DEV_FALLBACK_SITE_URL = "http://localhost:3000";

let cachedPublicSiteUrl: string | null = null;

export function getPublicSiteUrl() {
  if (cachedPublicSiteUrl) {
    return cachedPublicSiteUrl;
  }

  const envValue = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envValue) {
    cachedPublicSiteUrl = envValue.replace(/\/+$/, "");
    return cachedPublicSiteUrl;
  }

  if (process.env.NODE_ENV === "development") {
    cachedPublicSiteUrl = DEV_FALLBACK_SITE_URL;
    return cachedPublicSiteUrl;
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL must be set in production. Example: https://build.example.com",
  );
}
