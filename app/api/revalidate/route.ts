import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const MAX_ITEMS_PER_REQUEST = 25;

type RevalidatePayload = {
  tags?: string[];
  paths?: string[];
};

function getRequestSecret(request: Request) {
  const headerSecret = request.headers.get("x-revalidate-secret")?.trim();
  if (headerSecret) {
    return headerSecret;
  }

  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice("bearer ".length).trim();
  }

  return null;
}

function normalizeList(
  values: unknown,
  validator?: (value: string) => boolean,
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => (validator ? validator(value) : true)),
    ),
  ).slice(0, MAX_ITEMS_PER_REQUEST);
}

function isValidTag(tag: string) {
  return /^[a-z0-9:_-]{2,64}$/i.test(tag);
}

function isValidPath(path: string) {
  return path.startsWith("/");
}

function isAuthorizedRequest(
  requestSecret: string | null,
  configuredSecret: string,
) {
  if (!requestSecret) {
    return false;
  }

  const requestBuffer = Buffer.from(requestSecret);
  const configuredBuffer = Buffer.from(configuredSecret);

  if (requestBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(requestBuffer, configuredBuffer);
}

export async function POST(request: Request) {
  const configuredSecret = process.env.REVALIDATE_SECRET?.trim();
  if (!configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "REVALIDATE_SECRET is not configured. This endpoint is disabled.",
      },
      { status: 503 },
    );
  }

  const requestSecret = getRequestSecret(request);
  if (!isAuthorizedRequest(requestSecret, configuredSecret)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized revalidation request." },
      { status: 401 },
    );
  }

  let payload: RevalidatePayload;
  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const tags = normalizeList(payload.tags, isValidTag);
  const paths = normalizeList(payload.paths, isValidPath);

  if (!tags.length && !paths.length) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No valid revalidation targets found. Provide `tags` and/or `paths`.",
      },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    ok: true,
    invalidated: {
      tags,
      paths,
    },
  });
}
