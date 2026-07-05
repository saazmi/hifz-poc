import { describe, it, expect } from "vitest";
import {
  cycleAyahState,
  markRange,
  markReviewed,
  markStruggled,
  setAyahState,
  getRecord,
} from "./state.js";
import type { AyahRecordMap } from "./types.js";

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-01-02T00:00:00.000Z";
const empty = (): AyahRecordMap => new Map();

describe("setAyahState", () => {
  it("creates a record when moving from none", () => {
    const m = setAyahState(empty(), 1, 1, "learning", T0);
    expect(getRecord(m, 1, 1)).toMatchObject({
      surah: 1,
      ayah: 1,
      state: "learning",
      reviewCount: 0,
      updatedAt: T0,
    });
  });

  it("stamps memorizedAt when first becoming memorized", () => {
    const m = setAyahState(empty(), 1, 1, "memorized", T0);
    expect(getRecord(m, 1, 1)?.memorizedAt).toBe(T0);
  });

  it("preserves memorizedAt on later state changes", () => {
    let m = setAyahState(empty(), 1, 1, "memorized", T0);
    m = setAyahState(m, 1, 1, "learning", T1);
    expect(getRecord(m, 1, 1)?.memorizedAt).toBe(T0);
    m = setAyahState(m, 1, 1, "memorized", T1);
    expect(getRecord(m, 1, 1)?.memorizedAt).toBe(T0);
  });

  it("removes the record on 'none' (sparse storage)", () => {
    let m = setAyahState(empty(), 1, 1, "memorized", T0);
    m = setAyahState(m, 1, 1, "none", T1);
    expect(getRecord(m, 1, 1)).toBeUndefined();
  });

  it("throws on invalid ayah", () => {
    expect(() => setAyahState(empty(), 1, 99, "learning", T0)).toThrow();
    expect(() => setAyahState(empty(), 115, 1, "learning", T0)).toThrow();
  });

  it("returns the same map when state is unchanged (no-op)", () => {
    const m = setAyahState(empty(), 1, 1, "learning", T0);
    const m2 = setAyahState(m, 1, 1, "learning", T1);
    expect(m2).toBe(m);
  });
});

describe("cycleAyahState", () => {
  it("cycles none → learning → memorized → none", () => {
    let m = empty();
    m = cycleAyahState(m, 1, 1, T0);
    expect(getRecord(m, 1, 1)?.state).toBe("learning");
    m = cycleAyahState(m, 1, 1, T0);
    expect(getRecord(m, 1, 1)?.state).toBe("memorized");
    m = cycleAyahState(m, 1, 1, T0);
    expect(getRecord(m, 1, 1)).toBeUndefined();
  });
});

describe("markRange", () => {
  it("marks every ayah in the range", () => {
    const m = markRange(empty(), 1, 1, 7, "memorized", T0);
    for (let a = 1; a <= 7; a++) {
      expect(getRecord(m, 1, a)?.state).toBe("memorized");
    }
  });

  it("normalizes reversed ranges", () => {
    const m = markRange(empty(), 1, 7, 1, "learning", T0);
    for (let a = 1; a <= 7; a++) {
      expect(getRecord(m, 1, a)?.state).toBe("learning");
    }
  });

  it("throws when range spills past surah length", () => {
    expect(() => markRange(empty(), 1, 1, 8, "learning", T0)).toThrow();
  });
});

describe("markReviewed", () => {
  it("increments reviewCount and sets lastReviewedAt on memorized ayat only", () => {
    let m = markRange(empty(), 1, 1, 3, "memorized", T0);
    m = setAyahState(m, 1, 4, "learning", T0);
    m = markReviewed(m, 1, 1, 4, T1);
    expect(getRecord(m, 1, 1)?.reviewCount).toBe(1);
    expect(getRecord(m, 1, 1)?.lastReviewedAt).toBe(T1);
    expect(getRecord(m, 1, 4)?.reviewCount).toBe(0);
    expect(getRecord(m, 1, 4)?.lastReviewedAt).toBeUndefined();
  });
});

describe("markStruggled", () => {
  it("decrements reviewCount but never below zero", () => {
    let m = markRange(empty(), 1, 1, 3, "memorized", T0);
    m = markReviewed(m, 1, 1, 3, T1);
    m = markReviewed(m, 1, 1, 3, T1);
    m = markStruggled(m, 1, 1, 3, T1);
    expect(getRecord(m, 1, 1)?.reviewCount).toBe(1);
    m = markStruggled(m, 1, 1, 3, T1);
    m = markStruggled(m, 1, 1, 3, T1);
    expect(getRecord(m, 1, 1)?.reviewCount).toBe(0);
  });
});
