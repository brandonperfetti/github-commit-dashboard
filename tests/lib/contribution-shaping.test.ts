import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCalendarCells,
  buildLast30Days,
  buildRepoPushCadence,
  buildSparklinePoints,
  buildWeeklyTotals,
  chunkWeeks,
  currentStreak,
  daysSince,
  formatRepoDate,
  levelForCount,
  longestStreak,
  prettyDay,
  prettyLongDay,
} from "@/lib/github";
import { FROZEN_NOW, makeDays, makeRepo } from "../helpers/github-fixtures";

// Every function here derives its window from "today", so the clock is frozen
// at 2026-09-25 (a Friday) and the 30-day window runs 2026-08-27 .. 2026-09-25.
beforeEach(() => {
  vi.useFakeTimers({ now: FROZEN_NOW, toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("levelForCount", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 3],
    [6, 3],
    [7, 4],
    [40, 4],
  ])("maps %i contributions to heatmap level %i", (count, level) => {
    expect(levelForCount(count)).toBe(level);
  });
});

describe("streaks", () => {
  it("longestStreak finds the longest run of active days", () => {
    expect(longestStreak(makeDays([1, 2, 0, 3, 4, 5, 0]))).toBe(3);
  });

  it("longestStreak is 0 for no days or no activity", () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(makeDays([0, 0, 0]))).toBe(0);
  });

  it("currentStreak counts back from the most recent day", () => {
    expect(currentStreak(makeDays([1, 1, 0, 2, 3]))).toBe(2);
  });

  it("currentStreak is 0 when the most recent day is quiet", () => {
    expect(currentStreak(makeDays([4, 4, 4, 0]))).toBe(0);
  });
});

describe("buildLast30Days", () => {
  it("returns 30 consecutive ISO dates ending today", () => {
    const dates = buildLast30Days();
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe("2026-08-27");
    expect(dates.at(-1)).toBe("2026-09-25");
    for (let index = 1; index < dates.length; index += 1) {
      const previous = new Date(`${dates[index - 1]}T00:00:00Z`).getTime();
      const current = new Date(`${dates[index]}T00:00:00Z`).getTime();
      expect(current - previous).toBe(86_400_000);
    }
  });
});

describe("calendar layout", () => {
  it("buildCalendarCells pads to full Sunday-to-Saturday weeks", () => {
    // 2026-09-23 is a Wednesday, 2026-09-25 a Friday.
    const cells = buildCalendarCells(makeDays([1, 1, 1], "2026-09-23"));
    expect(cells).toHaveLength(7);
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]?.date).toBe("2026-09-23");
    expect(cells[6]).toBeNull();
  });

  it("buildCalendarCells returns nothing for no days", () => {
    expect(buildCalendarCells([])).toEqual([]);
  });

  it("chunkWeeks splits cells into rows of seven", () => {
    const cells = buildCalendarCells(makeDays(Array(30).fill(1), "2026-08-27"));
    const weeks = chunkWeeks(cells);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(chunkWeeks(cells.slice(0, 8)).map((week) => week.length)).toEqual([
      7, 1,
    ]);
  });

  it("buildWeeklyTotals sums each calendar week and labels its range", () => {
    const counts = Array.from({ length: 30 }, (_, index) => index + 1);
    const weeks = buildWeeklyTotals(makeDays(counts, "2026-08-27"));

    expect(weeks.map((week) => week.label)).toEqual([
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
      "Week 5",
    ]);
    // Thu 27 .. Sat 29 Aug -> 1 + 2 + 3
    expect(weeks[0]).toMatchObject({ total: 6, range: "Aug 27 – Aug 29" });
    // Sun 20 .. Fri 25 Sep -> 25 + ... + 30
    expect(weeks[4]).toMatchObject({ total: 165, range: "Sep 20 – Sep 25" });
    expect(weeks.reduce((sum, week) => sum + week.total, 0)).toBe(465);
  });

  it("buildWeeklyTotals returns nothing for no days", () => {
    expect(buildWeeklyTotals([])).toEqual([]);
  });
});

describe("buildSparklinePoints", () => {
  it("scales counts into the 260x72 viewBox with 6px padding", () => {
    expect(buildSparklinePoints(makeDays([0, 5, 10]))).toBe(
      "6,66 130,36 254,6",
    );
  });
});

describe("buildRepoPushCadence", () => {
  it("counts repos pushed inside each weekly window of the 30-day range", () => {
    const repos = [
      makeRepo({ pushed_at: "2026-08-27T00:00:00Z" }), // first window, first ms
      makeRepo({ pushed_at: "2026-09-04T10:00:00Z" }), // second window
      makeRepo({ pushed_at: "2026-09-25T23:59:59Z" }), // last window, last second
      makeRepo({ pushed_at: "2026-08-01T00:00:00Z" }), // before the window
    ];

    const cadence = buildRepoPushCadence(repos);

    expect(cadence.map((point) => point.value)).toEqual([1, 1, 0, 0, 1]);
    expect(cadence.map((point) => point.label)).toEqual([
      "Aug 27",
      "Sep 3",
      "Sep 10",
      "Sep 17",
      "Sep 24",
    ]);
    expect(cadence.map((point) => point.index)).toEqual([1, 2, 3, 4, 5]);
    expect(cadence.at(-1)?.range).toBe("Sep 24 – Sep 25");
  });
});

describe("date helpers", () => {
  it("daysSince floors to whole days and never goes negative", () => {
    expect(daysSince("2026-09-20T12:00:00Z")).toBe(5);
    expect(daysSince("2026-09-25T13:00:00Z")).toBe(0);
    expect(daysSince("not a date")).toBe(0);
  });

  it("formats dates the way the cards show them", () => {
    expect(formatRepoDate("2026-09-20T10:00:00Z")).toBe("Sep 20, 2026");
    expect(prettyDay("2026-09-05")).toBe("Sep 5");
    expect(prettyLongDay("2026-09-05")).toBe("September 5, 2026");
  });
});
