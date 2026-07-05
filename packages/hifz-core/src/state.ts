import {
  ayahKey,
  type AyahRecord,
  type AyahRecordMap,
  type PersistedAyahState,
} from "./types";
import { isValidAyah } from "./quran";

export type Clock = () => string;

export const defaultClock: Clock = () => new Date().toISOString();

const clone = (map: AyahRecordMap): AyahRecordMap => new Map(map);

const assertValid = (surah: number, ayah: number): void => {
  if (!isValidAyah(surah, ayah)) {
    throw new Error(`Invalid ayah: ${surah}:${ayah}`);
  }
};

export const getRecord = (
  map: AyahRecordMap,
  surah: number,
  ayah: number,
): AyahRecord | undefined => map.get(ayahKey(surah, ayah));

/**
 * Set an ayah to a specific state. Passing "none" removes the record (sparse storage).
 */
export const setAyahState = (
  map: AyahRecordMap,
  surah: number,
  ayah: number,
  target: PersistedAyahState | "none",
  now: string,
): AyahRecordMap => {
  assertValid(surah, ayah);
  const next = clone(map);
  const key = ayahKey(surah, ayah);
  const existing = next.get(key);

  if (target === "none") {
    next.delete(key);
    return next;
  }

  if (!existing) {
    next.set(key, {
      surah,
      ayah,
      state: target,
      updatedAt: now,
      reviewCount: 0,
      ...(target === "memorized" ? { memorizedAt: now } : {}),
    });
    return next;
  }

  if (existing.state === target) return map;

  const updated: AyahRecord = {
    ...existing,
    state: target,
    updatedAt: now,
  };
  if (target === "memorized" && !existing.memorizedAt) {
    updated.memorizedAt = now;
  }
  next.set(key, updated);
  return next;
};

const CYCLE: readonly (PersistedAyahState | "none")[] = [
  "none",
  "learning",
  "memorized",
];

/**
 * Long-press cycle: none → learning → memorized → none.
 */
export const cycleAyahState = (
  map: AyahRecordMap,
  surah: number,
  ayah: number,
  now: string,
): AyahRecordMap => {
  assertValid(surah, ayah);
  const existing = map.get(ayahKey(surah, ayah));
  const current: (typeof CYCLE)[number] = existing?.state ?? "none";
  const idx = CYCLE.indexOf(current);
  const next = CYCLE[(idx + 1) % CYCLE.length]!;
  return setAyahState(map, surah, ayah, next, now);
};

/**
 * Mark a contiguous ayah range within one surah to a target state.
 */
export const markRange = (
  map: AyahRecordMap,
  surah: number,
  from: number,
  to: number,
  target: PersistedAyahState | "none",
  now: string,
): AyahRecordMap => {
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  assertValid(surah, lo);
  assertValid(surah, hi);
  let next = map;
  for (let a = lo; a <= hi; a++) {
    next = setAyahState(next, surah, a, target, now);
  }
  return next;
};

/**
 * Mark ayat in [from, to] as reviewed. Increments reviewCount and sets lastReviewedAt
 * only on ayat that are currently memorized (learning ayat are ignored — reviewing
 * an unmemorized ayah is a no-op).
 */
export const markReviewed = (
  map: AyahRecordMap,
  surah: number,
  from: number,
  to: number,
  now: string,
): AyahRecordMap => {
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const next = clone(map);
  for (let a = lo; a <= hi; a++) {
    const key = ayahKey(surah, a);
    const rec = next.get(key);
    if (!rec || rec.state !== "memorized") continue;
    next.set(key, {
      ...rec,
      lastReviewedAt: now,
      reviewCount: rec.reviewCount + 1,
      updatedAt: now,
    });
  }
  return next;
};

/**
 * "Struggled" action — steps the ladder back by decrementing reviewCount (floored at 0)
 * and setting lastReviewedAt to now so the chunk isn't immediately due again.
 */
export const markStruggled = (
  map: AyahRecordMap,
  surah: number,
  from: number,
  to: number,
  now: string,
): AyahRecordMap => {
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const next = clone(map);
  for (let a = lo; a <= hi; a++) {
    const key = ayahKey(surah, a);
    const rec = next.get(key);
    if (!rec || rec.state !== "memorized") continue;
    next.set(key, {
      ...rec,
      lastReviewedAt: now,
      reviewCount: Math.max(0, rec.reviewCount - 1),
      updatedAt: now,
    });
  }
  return next;
};
