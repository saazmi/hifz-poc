import structure from "../data/quran-structure.json" with { type: "json" };
import type { SurahMeta } from "./types.js";

export const SURAHS: readonly SurahMeta[] = structure as SurahMeta[];

export const TOTAL_AYAT = SURAHS.reduce((sum, s) => sum + s.ayahCount, 0);

const bySurah = new Map<number, SurahMeta>(SURAHS.map((s) => [s.id, s]));

export const getSurah = (id: number): SurahMeta => {
  const s = bySurah.get(id);
  if (!s) throw new Error(`Unknown surah id: ${id}`);
  return s;
};

export const surahExists = (id: number): boolean => bySurah.has(id);

export const isValidAyah = (surah: number, ayah: number): boolean => {
  const s = bySurah.get(surah);
  return s !== undefined && ayah >= 1 && ayah <= s.ayahCount;
};
