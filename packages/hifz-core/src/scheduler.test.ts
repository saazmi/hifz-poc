import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_DAILY_BUDGET,
  LADDER_DAYS,
  MAX_CHUNK_SIZE,
  daysBetween,
  deriveChunks,
  getTodaysRevisionTasks,
  intervalFor,
  isChunkOverdue,
  needsReviewKeys,
  totalDueChunkCount,
} from "./scheduler.js";
import { markRange, markReviewed, setAyahState } from "./state.js";
import type { AyahRecordMap } from "./types.js";

const T0 = "2026-01-01T00:00:00.000Z";
const plusDays = (iso: string, d: number): string =>
  new Date(Date.parse(iso) + d * 86_400_000).toISOString();
const empty = (): AyahRecordMap => new Map();

describe("intervalFor", () => {
  it("walks the ladder and caps at the last step", () => {
    expect(intervalFor(0)).toBe(1);
    expect(intervalFor(1)).toBe(3);
    expect(intervalFor(2)).toBe(7);
    expect(intervalFor(3)).toBe(14);
    expect(intervalFor(4)).toBe(30);
    expect(intervalFor(5)).toBe(60);
    expect(intervalFor(9)).toBe(60);
    expect(LADDER_DAYS[LADDER_DAYS.length - 1]).toBe(60);
  });
});

describe("deriveChunks", () => {
  it("returns nothing for a map with only learning ayat", () => {
    const m = markRange(empty(), 1, 1, 7, "learning", T0);
    expect(deriveChunks(m)).toEqual([]);
  });

  it("collapses contiguous memorized ayat into one chunk", () => {
    const m = markRange(empty(), 1, 1, 7, "memorized", T0);
    const chunks = deriveChunks(m);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ surah: 1, startAyah: 1, endAyah: 7 });
  });

  it("splits on gaps", () => {
    let m = markRange(empty(), 2, 1, 3, "memorized", T0);
    m = markRange(m, 2, 5, 7, "memorized", T0);
    const chunks = deriveChunks(m).filter((c) => c.surah === 2);
    expect(chunks).toHaveLength(2);
    expect(chunks.map((c) => [c.startAyah, c.endAyah])).toEqual([
      [1, 3],
      [5, 7],
    ]);
  });

  it("splits chunks longer than MAX_CHUNK_SIZE into page-sized pieces", () => {
    const m = markRange(empty(), 2, 1, 40, "memorized", T0);
    const chunks = deriveChunks(m).filter((c) => c.surah === 2);
    expect(chunks.length).toBe(Math.ceil(40 / MAX_CHUNK_SIZE));
    for (const c of chunks) {
      expect(c.endAyah - c.startAyah + 1).toBeLessThanOrEqual(MAX_CHUNK_SIZE);
    }
    expect(chunks[0]!.startAyah).toBe(1);
    expect(chunks.at(-1)!.endAyah).toBe(40);
  });

  it("keeps chunks per-surah (no cross-surah merges)", () => {
    let m = markRange(empty(), 1, 7, 7, "memorized", T0);
    m = markRange(m, 2, 1, 1, "memorized", T0);
    expect(deriveChunks(m)).toHaveLength(2);
  });

  it("uses min(reviewCount) and max(lastReviewedAt) across members", () => {
    let m = markRange(empty(), 1, 1, 3, "memorized", T0);
    m = markReviewed(m, 1, 1, 3, plusDays(T0, 2));
    m = markReviewed(m, 1, 1, 2, plusDays(T0, 5)); // ayah 3 has reviewCount=1, others =2
    const chunk = deriveChunks(m).find((c) => c.surah === 1)!;
    expect(chunk.reviewCount).toBe(1);
    expect(chunk.lastReviewedAt).toBe(plusDays(T0, 5));
  });
});

describe("isChunkOverdue / needsReviewKeys", () => {
  it("fresh memorized chunk becomes overdue after 1 day", () => {
    const m = markRange(empty(), 1, 1, 3, "memorized", T0);
    const chunk = deriveChunks(m)[0]!;
    expect(isChunkOverdue(chunk, plusDays(T0, 0.5))).toBe(false);
    expect(isChunkOverdue(chunk, plusDays(T0, 2))).toBe(true);
  });

  it("needsReviewKeys returns exactly the ayat of overdue chunks", () => {
    let m = markRange(empty(), 1, 1, 3, "memorized", T0);
    m = markRange(m, 2, 1, 2, "memorized", plusDays(T0, 20));
    const keys = needsReviewKeys(m, plusDays(T0, 5));
    expect(keys.has("1:1")).toBe(true);
    expect(keys.has("1:3")).toBe(true);
    expect(keys.has("2:1")).toBe(false);
  });
});

describe("getTodaysRevisionTasks", () => {
  it("returns at most dailyBudget tasks, most-overdue first", () => {
    let m = empty();
    // 5 memorized chunks in 5 surahs, each memorized further and further in the past.
    for (let s = 1; s <= 5; s++) {
      m = markRange(m, s, 1, 3, "memorized", plusDays(T0, -s * 10));
    }
    const tasks = getTodaysRevisionTasks(m, {
      now: T0,
      onComplete: vi.fn(),
      onStruggled: vi.fn(),
    });
    expect(tasks).toHaveLength(DEFAULT_DAILY_BUDGET);
    expect(tasks[0]!.surah).toBe(5); // oldest = most overdue
  });

  it("respects an explicit dailyBudget", () => {
    let m = empty();
    for (let s = 1; s <= 5; s++) {
      m = markRange(m, s, 1, 3, "memorized", plusDays(T0, -s * 10));
    }
    const tasks = getTodaysRevisionTasks(m, {
      now: T0,
      dailyBudget: 1,
      onComplete: vi.fn(),
      onStruggled: vi.fn(),
    });
    expect(tasks).toHaveLength(1);
  });

  it("skips non-overdue chunks entirely", () => {
    const m = markRange(empty(), 1, 1, 3, "memorized", T0);
    const tasks = getTodaysRevisionTasks(m, {
      now: plusDays(T0, 0.1),
      onComplete: vi.fn(),
      onStruggled: vi.fn(),
    });
    expect(tasks).toHaveLength(0);
  });

  it("wires onComplete / onStruggled callbacks with the chunk", () => {
    const m = markRange(empty(), 1, 1, 3, "memorized", plusDays(T0, -5));
    const onComplete = vi.fn();
    const onStruggled = vi.fn();
    const [task] = getTodaysRevisionTasks(m, {
      now: T0,
      onComplete,
      onStruggled,
    });
    task!.onComplete();
    task!.onStruggled();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onStruggled).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0]![0]).toMatchObject({ surah: 1, startAyah: 1, endAyah: 3 });
  });

  it("full review lifecycle: memorize → review advances the ladder", () => {
    let m = markRange(empty(), 1, 1, 3, "memorized", T0);
    // Day 2: due (interval=1). Review it.
    m = markReviewed(m, 1, 1, 3, plusDays(T0, 2));
    let chunk = deriveChunks(m)[0]!;
    expect(chunk.reviewCount).toBe(1);
    expect(chunk.intervalDays).toBe(3);
    // Day 4: not yet due (interval=3, anchor=day2, dueAt=day5).
    expect(isChunkOverdue(chunk, plusDays(T0, 4))).toBe(false);
    // Day 6: due again.
    expect(isChunkOverdue(chunk, plusDays(T0, 6))).toBe(true);
  });

  it("daysBetween is a straightforward difference", () => {
    expect(daysBetween(T0, plusDays(T0, 3))).toBeCloseTo(3);
    expect(daysBetween(plusDays(T0, 3), T0)).toBeCloseTo(-3);
  });

  it("totalDueChunkCount ignores the daily budget", () => {
    let m = empty();
    for (let s = 1; s <= 5; s++) {
      m = markRange(m, s, 1, 3, "memorized", plusDays(T0, -s * 10));
    }
    expect(totalDueChunkCount(m, T0)).toBe(5);
  });
});
