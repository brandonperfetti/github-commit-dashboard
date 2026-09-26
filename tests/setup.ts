import { beforeEach, vi } from "vitest";

// Date formatting in lib/github.ts uses the process timezone; pin it so the
// expected strings in the tests are the same on every machine and in CI.
process.env.TZ = "UTC";

// `cacheLife` / `cacheTag` only work inside the Next.js runtime. The page and
// data modules call them at the top of "use cache" functions, so stub them out.
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
}));

beforeEach(() => {
  // Tests never talk to GitHub. A token is stubbed so the authenticated code
  // paths run; the fetch router in tests/helpers decides what comes back.
  vi.stubEnv("GITHUB_TOKEN", "test-token");
  vi.stubEnv("GH_TOKEN", "");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://github.brandonperfetti.com");
});
