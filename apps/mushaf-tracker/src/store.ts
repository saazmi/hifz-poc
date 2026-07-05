import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  cycleAyahState,
  fromArray,
  markRange,
  markReviewed,
  markStruggled,
  needsReviewKeys,
  setAyahState,
  toArray,
  type AyahKey,
  type AyahRecord,
  type AyahRecordMap,
  type PersistedAyahState,
} from "@hifz/core";

const STORAGE_KEY = "hifz.records.v1";

interface UndoEntry {
  label: string;
  snapshot: AyahRecordMap;
  createdAt: number;
}

interface StoreState {
  records: AyahRecordMap;
  loaded: boolean;
  now: string;
  needsReview: ReadonlySet<AyahKey>;
  undo: UndoEntry | null;

  load(): Promise<void>;
  refreshNow(): void;
  setState(surah: number, ayah: number, target: PersistedAyahState | "none"): void;
  cycleState(surah: number, ayah: number): void;
  markRangeState(
    surah: number,
    from: number,
    to: number,
    target: PersistedAyahState | "none",
  ): void;
  reviewRange(surah: number, from: number, to: number): void;
  struggledRange(surah: number, from: number, to: number): void;
  applyUndo(): void;
  clearUndo(): void;
}

const now = (): string => new Date().toISOString();

const recompute = (records: AyahRecordMap, atIso: string): ReadonlySet<AyahKey> =>
  needsReviewKeys(records, atIso);

const persist = (records: AyahRecordMap): void => {
  const payload = JSON.stringify(toArray(records));
  void AsyncStorage.setItem(STORAGE_KEY, payload);
};

const loadFromStorage = async (): Promise<AyahRecordMap> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as AyahRecord[];
    return fromArray(parsed);
  } catch {
    return new Map();
  }
};

export const useStore = create<StoreState>((set, get) => {
  const mutate = (label: string, apply: (m: AyahRecordMap, n: string) => AyahRecordMap): void => {
    const state = get();
    const n = now();
    const nextRecords = apply(state.records, n);
    if (nextRecords === state.records) return;
    persist(nextRecords);
    set({
      records: nextRecords,
      now: n,
      needsReview: recompute(nextRecords, n),
      undo: { label, snapshot: state.records, createdAt: Date.now() },
    });
  };

  return {
    records: new Map(),
    loaded: false,
    now: now(),
    needsReview: new Set(),
    undo: null,

    async load() {
      const records = await loadFromStorage();
      const n = now();
      set({
        records,
        loaded: true,
        now: n,
        needsReview: recompute(records, n),
      });
    },

    refreshNow() {
      const n = now();
      set({ now: n, needsReview: recompute(get().records, n) });
    },

    setState(surah, ayah, target) {
      mutate(
        target === "none"
          ? `Cleared ${surah}:${ayah}`
          : `Set ${surah}:${ayah} → ${target}`,
        (m, n) => setAyahState(m, surah, ayah, target, n),
      );
    },

    cycleState(surah, ayah) {
      mutate(`Cycled ${surah}:${ayah}`, (m, n) => cycleAyahState(m, surah, ayah, n));
    },

    markRangeState(surah, from, to, target) {
      mutate(
        `Marked ${surah}:${from}–${to} → ${target}`,
        (m, n) => markRange(m, surah, from, to, target, n),
      );
    },

    reviewRange(surah, from, to) {
      mutate(
        `Reviewed ${surah}:${from}–${to}`,
        (m, n) => markReviewed(m, surah, from, to, n),
      );
    },

    struggledRange(surah, from, to) {
      mutate(
        `Struggled on ${surah}:${from}–${to}`,
        (m, n) => markStruggled(m, surah, from, to, n),
      );
    },

    applyUndo() {
      const u = get().undo;
      if (!u) return;
      const n = now();
      persist(u.snapshot);
      set({
        records: u.snapshot,
        now: n,
        needsReview: recompute(u.snapshot, n),
        undo: null,
      });
    },

    clearUndo() {
      set({ undo: null });
    },
  };
});
