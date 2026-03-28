import { NextResponse } from "next/server";
import { getCommitTimingHeatmap } from "@/lib/github";
import {
  getConfiguredActivityTimezone,
  sanitizeTimezone,
} from "@/lib/timezone";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedTimezone = sanitizeTimezone(searchParams.get("timezone"));
  const timezone = requestedTimezone ?? getConfiguredActivityTimezone();
  try {
    const data = await getCommitTimingHeatmap(timezone);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[api/activity/commit-timing] Failed to load heatmap", {
      timezone,
      error,
    });
    return NextResponse.json(
      {
        error:
          "Unable to fetch commit timing heatmap right now. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}
