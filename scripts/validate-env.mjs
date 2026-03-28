#!/usr/bin/env node

const REQUIRED_IN_PRODUCTION = ["NEXT_PUBLIC_SITE_URL"];

function readMode(argv) {
  const explicit = argv.find((value) => value.startsWith("--mode="));
  if (explicit) {
    return explicit.slice("--mode=".length).trim() || "development";
  }
  return process.env.NODE_ENV ?? "development";
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function main() {
  const mode = readMode(process.argv.slice(2));
  if (mode !== "production") {
    console.log(`[validate-env] Skipping strict validation for mode=${mode}`);
    return;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter(
    (key) => !process.env[key]?.trim(),
  );

  if (missing.length > 0) {
    console.error(
      `[validate-env] Missing required production environment variable(s): ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (!isValidHttpUrl(siteUrl)) {
    console.error(
      "[validate-env] NEXT_PUBLIC_SITE_URL must be a valid http(s) URL.",
    );
    process.exit(1);
  }

  console.log("[validate-env] Production environment validation passed.");
}

main();
