import { describe, it, expect } from "vitest";
import { markRange, setAyahState } from "./state.js";
import {
  juzProgressApprox,
  overallProgress,
  surahProgress,
} from "./aggregates.js";
import { ayahKey, type AyahRecordMap } from "./types.js";
import { TOTAL_AYAT } from "./quran.js";

const T = "2026-01-01T00:00:00.000Z";
const empty = (): AyahRecordMap => new Map();

describe("surahProgress", () => {
  it("returns zeros for an empty map", () => {
    const p = surahProgress(empty(), 1);
    expect(p).toEqual({
      memorized: 0,
      learning: 0,
      needsReview: 0,
      total: 7,
      percent: 0,
    });
  });

  it("counts memorized and learning within a surah", () => {
    let m = markRange(empty(), 1, 1, 4, "memorized", T);
    m = setAyahState(m, 1, 5, "learning", T);
    const p = surahProgress(m, 1);
    expect(p.memorized).toBe(4);
    expect(p.learning).toBe(1);
    expect(p.total).toBe(7);
    expect(p.percent).toBeCloseTo((4 / 7) * 100);
  });

  it("moves memorized ayat into needsReview when their key is in the overdue set", () => {
    const m = markRange(empty(), 1, 1, 7, "memorized", T);
    const overdue = new Set([ayahKey(1, 1), ayahKey(1, 2)]);
    const p = surahProgress(m, 1, overdue);
    expect(p.memorized).toBe(5);
    expect(p.needsReview).toBe(2);
  });

  it("ignores records for other surahs", () => {
    const m = markRange(empty(), 2, 1, 3, "memorized", T);
    expect(surahProgress(m, 1).memorized).toBe(0);
  });
});

describe("overallProgress", () => {
  it("uses total ayat 6236", () => {
    expect(TOTAL_AYAT).toBe(6236);
    expect(overallProgress(empty()).total).toBe(6236);
  });
});

describe("juzProgressApprox", () => {
  it("includes surahs whose juzSpan covers the juz", () => {
    const m = markRange(empty(), 78, 1, 40, "memorized", T);
    const p = juzProgressApprox(m, 30);
    expect(p.memorized).toBeGreaterThanOrEqual(40);
  });

  it("excludes surahs outside the juz", () => {
    const m = markRange(empty(), 78, 1, 40, "memorized", T);
    expect(juzProgressApprox(m, 1).memorized).toBe(0);
  });
});
