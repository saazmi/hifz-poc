import {
  ayahKey,
  type AyahKey,
  type AyahRecordMap,
  type Chunk,
  type RevisionTaskWithStruggle,
} from "./types";
import { getSurah } from "./quran";

export const LADDER_DAYS: readonly number[] = [1, 3, 7, 14, 30, 60];
export const MAX_CHUNK_SIZE = 15;
export const DEFAULT_DAILY_BUDGET = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const intervalFor = (reviewCount: number): number => {
  const clamped = Math.max(0, Math.min(reviewCount, LADDER_DAYS.length - 1));
  return LADDER_DAYS[clamped]!;
};

/**
 * Days elapsed between two ISO timestamps. Fractional; can be negative.
 */
export const daysBetween = (fromIso: string, toIso: string): number =>
  (Date.parse(toIso) - Date.parse(fromIso)) / MS_PER_DAY;

const addDaysIso = (iso: string, days: number): string =>
  new Date(Date.parse(iso) + days * MS_PER_DAY).toISOString();

const maxIso = (a: string | undefined, b: string | undefined): string | undefined => {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
};

/**
 * Walk the record map and produce chunks: contiguous memorized runs within a surah,
 * split so no chunk exceeds MAX_CHUNK_SIZE ayat.
 */
export const deriveChunks = (map: AyahRecordMap): Chunk[] => {
  const bySurah = new Map<number, number[]>();
  for (const rec of map.values()) {
    if (rec.state !== "memorized") continue;
    let list = bySurah.get(rec.surah);
    if (!list) {
      list = [];
      bySurah.set(rec.surah, list);
    }
    list.push(rec.ayah);
  }

  const chunks: Chunk[] = [];
  for (const [surah, ayat] of bySurah) {
    ayat.sort((a, b) => a - b);
    let runStart = ayat[0]!;
    let runEnd = runStart;
    const flush = (from: number, to: number): void => {
      for (let start = from; start <= to; start += MAX_CHUNK_SIZE) {
        const end = Math.min(start + MAX_CHUNK_SIZE - 1, to);
        chunks.push(buildChunk(map, surah, start, end));
      }
    };
    for (let i = 1; i < ayat.length; i++) {
      const cur = ayat[i]!;
      if (cur === runEnd + 1) {
        runEnd = cur;
      } else {
        flush(runStart, runEnd);
        runStart = cur;
        runEnd = cur;
      }
    }
    flush(runStart, runEnd);
  }

  return chunks;
};

const buildChunk = (
  map: AyahRecordMap,
  surah: number,
  startAyah: number,
  endAyah: number,
): Chunk => {
  let minReviewCount = Infinity;
  let latestReviewed: string | undefined;
  let latestMemorized: string | undefined;
  for (let a = startAyah; a <= endAyah; a++) {
    const rec = map.get(ayahKey(surah, a));
    if (!rec) continue;
    if (rec.reviewCount < minReviewCount) minReviewCount = rec.reviewCount;
    latestReviewed = maxIso(latestReviewed, rec.lastReviewedAt);
    latestMemorized = maxIso(latestMemorized, rec.memorizedAt);
  }
  const reviewCount = minReviewCount === Infinity ? 0 : minReviewCount;
  const intervalDays = intervalFor(reviewCount);
  const anchor = latestReviewed ?? latestMemorized;
  const dueAt = anchor ? addDaysIso(anchor, intervalDays) : new Date(0).toISOString();
  const chunk: Chunk = {
    surah,
    startAyah,
    endAyah,
    reviewCount,
    intervalDays,
    dueAt,
  };
  if (latestReviewed) chunk.lastReviewedAt = latestReviewed;
  return chunk;
};

export const isChunkOverdue = (chunk: Chunk, now: string): boolean =>
  Date.parse(now) > Date.parse(chunk.dueAt);

/**
 * Set of AyahKeys currently classified as needsReview (memorized + overdue chunk).
 * Consumers pass this into aggregates for the needsReview breakdown.
 */
export const needsReviewKeys = (
  map: AyahRecordMap,
  now: string,
): Set<AyahKey> => {
  const set = new Set<AyahKey>();
  for (const chunk of deriveChunks(map)) {
    if (!isChunkOverdue(chunk, now)) continue;
    for (let a = chunk.startAyah; a <= chunk.endAyah; a++) {
      set.add(ayahKey(chunk.surah, a));
    }
  }
  return set;
};

export interface ScheduleOptions {
  dailyBudget?: number;
  now: string;
  onComplete: (chunk: Chunk) => void;
  onStruggled: (chunk: Chunk) => void;
}

const overdueChunks = (map: AyahRecordMap, now: string): Chunk[] =>
  deriveChunks(map)
    .filter((c) => isChunkOverdue(c, now))
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));

/**
 * Return up to `dailyBudget` revision tasks for `now`, most-overdue first.
 * Never surfaces a crushing backlog count — overflow just waits.
 */
export const getTodaysRevisionTasks = (
  map: AyahRecordMap,
  opts: ScheduleOptions,
): RevisionTaskWithStruggle[] => {
  const budget = opts.dailyBudget ?? DEFAULT_DAILY_BUDGET;
  const due = overdueChunks(map, opts.now).slice(0, budget);
  return due.map((chunk) => {
    const surahMeta = getSurah(chunk.surah);
    const rangeLabel =
      chunk.startAyah === chunk.endAyah
        ? `ayah ${chunk.startAyah}`
        : `${chunk.startAyah}–${chunk.endAyah}`;
    const dueDate = opts.now.slice(0, 10);
    return {
      id: `rev:${chunk.surah}:${chunk.startAyah}-${chunk.endAyah}`,
      title: `Review ${surahMeta.nameTransliterated} (${rangeLabel})`,
      surah: chunk.surah,
      ayahRange: [chunk.startAyah, chunk.endAyah],
      dueDate,
      onComplete: () => opts.onComplete(chunk),
      onStruggled: () => opts.onStruggled(chunk),
    };
  });
};

/**
 * How many revision chunks are due right now (across all overdue chunks, not
 * clamped by daily budget). Use for internal metrics — never show this to users.
 */
export const totalDueChunkCount = (map: AyahRecordMap, now: string): number =>
  overdueChunks(map, now).length;
