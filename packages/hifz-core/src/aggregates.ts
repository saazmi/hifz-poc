import { ayahKey, type AyahKey, type AyahRecordMap, type Progress } from "./types";
import { getSurah, SURAHS, TOTAL_AYAT } from "./quran";

const empty = (total: number): Progress => ({
  memorized: 0,
  learning: 0,
  needsReview: 0,
  total,
  percent: 0,
});

const finalize = (p: Progress): Progress => ({
  ...p,
  percent: p.total === 0 ? 0 : (p.memorized / p.total) * 100,
});

/**
 * Progress for a single surah. `needsReviewKeys` is an optional set of ayah keys
 * (produced by the scheduler) that are memorized-but-overdue; when supplied,
 * they are counted separately from `memorized`.
 */
export const surahProgress = (
  map: AyahRecordMap,
  surahId: number,
  needsReviewKeys?: ReadonlySet<AyahKey>,
): Progress => {
  const surah = getSurah(surahId);
  const p = empty(surah.ayahCount);
  for (let a = 1; a <= surah.ayahCount; a++) {
    const key = ayahKey(surahId, a);
    const rec = map.get(key);
    if (!rec) continue;
    if (rec.state === "learning") p.learning++;
    else if (rec.state === "memorized") {
      if (needsReviewKeys?.has(key)) p.needsReview++;
      else p.memorized++;
    }
  }
  return finalize(p);
};

/**
 * Aggregate progress across the whole Quran.
 */
export const overallProgress = (
  map: AyahRecordMap,
  needsReviewKeys?: ReadonlySet<AyahKey>,
): Progress => {
  const p = empty(TOTAL_AYAT);
  for (const rec of map.values()) {
    const key = ayahKey(rec.surah, rec.ayah);
    if (rec.state === "learning") p.learning++;
    else if (rec.state === "memorized") {
      if (needsReviewKeys?.has(key)) p.needsReview++;
      else p.memorized++;
    }
  }
  return finalize(p);
};

/**
 * Progress restricted to surahs whose `juzSpan` includes `juzId`. Approximate —
 * a surah split across juz boundaries counts all of its tracked ayat under every
 * juz it touches. For exact per-ayah juz progress, provide an ayah-index and use
 * juzProgressExact.
 */
export const juzProgressApprox = (
  map: AyahRecordMap,
  juzId: number,
  needsReviewKeys?: ReadonlySet<AyahKey>,
): Progress => {
  const surahsInJuz = SURAHS.filter((s) => s.juzSpan.includes(juzId));
  const p = empty(surahsInJuz.reduce((n, s) => n + s.ayahCount, 0));
  for (const s of surahsInJuz) {
    const sp = surahProgress(map, s.id, needsReviewKeys);
    p.memorized += sp.memorized;
    p.learning += sp.learning;
    p.needsReview += sp.needsReview;
  }
  return finalize(p);
};

/**
 * Exact per-ayah juz progress. Requires an ayah-index mapping each ayah to a juz.
 */
export const juzProgressExact = (
  map: AyahRecordMap,
  juzId: number,
  ayahJuz: (surah: number, ayah: number) => number,
  needsReviewKeys?: ReadonlySet<AyahKey>,
): Progress => {
  const p = empty(0);
  for (const s of SURAHS) {
    for (let a = 1; a <= s.ayahCount; a++) {
      if (ayahJuz(s.id, a) !== juzId) continue;
      p.total++;
      const key = ayahKey(s.id, a);
      const rec = map.get(key);
      if (!rec) continue;
      if (rec.state === "learning") p.learning++;
      else if (rec.state === "memorized") {
        if (needsReviewKeys?.has(key)) p.needsReview++;
        else p.memorized++;
      }
    }
  }
  return finalize(p);
};
