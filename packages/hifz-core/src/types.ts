export interface SurahMeta {
  id: number;
  nameArabic: string;
  nameTransliterated: string;
  nameTranslated?: string;
  ayahCount: number;
  revelationPlace: "makkah" | "madinah";
  juzSpan: number[];
}

export type AyahState = "none" | "learning" | "memorized" | "needsReview";

export type PersistedAyahState = Exclude<AyahState, "none" | "needsReview">;

export interface AyahRecord {
  surah: number;
  ayah: number;
  state: PersistedAyahState;
  updatedAt: string;
  memorizedAt?: string;
  lastReviewedAt?: string;
  reviewCount: number;
}

export type AyahKey = `${number}:${number}`;

export const ayahKey = (surah: number, ayah: number): AyahKey =>
  `${surah}:${ayah}` as AyahKey;

export const parseAyahKey = (
  k: AyahKey,
): { surah: number; ayah: number } => {
  const [s, a] = k.split(":");
  return { surah: Number(s), ayah: Number(a) };
};

export type AyahRecordMap = Map<AyahKey, AyahRecord>;

export interface AyahIndexEntry {
  surah: number;
  ayah: number;
  juz: number;
  hizbQuarter: number;
  page: number;
}

export interface Progress {
  memorized: number;
  learning: number;
  needsReview: number;
  total: number;
  percent: number;
}

export interface Chunk {
  surah: number;
  startAyah: number;
  endAyah: number;
  lastReviewedAt?: string;
  reviewCount: number;
  intervalDays: number;
  dueAt: string;
}

export interface RevisionTask {
  id: string;
  title: string;
  surah: number;
  ayahRange: [number, number];
  dueDate: string;
  onComplete(): void;
}

export interface RevisionTaskWithStruggle extends RevisionTask {
  onStruggled(): void;
}
