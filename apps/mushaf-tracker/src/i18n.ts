import type { AyahState, PersistedAyahState } from "@hifz/core";

export const t = {
  appTitle: "Suivi du Mushaf",
  searchPlaceholder: "Rechercher une sourate…",
  overallSummary: (mem: number, total: number, learning: number) =>
    `${mem} / ${total} versets mémorisés · ${learning} en apprentissage`,
  surahRowMeta: (ayahCount: number, juz: string) =>
    `${ayahCount} versets · Juz ${juz}`,
  back: "← Retour",
  select: "Sélectionner",
  chooseInterval: "Choisir un intervalle",
  selection: {
    counter: (n: number) => `${n} sélectionné${n > 1 ? "s" : ""}`,
    empty: "Touchez des versets…",
    cancel: "Terminer",
  },
  surahHeaderMeta: (ayahCount: number, juz: string) =>
    `${ayahCount} versets · Juz ${juz}`,
  surahStats: (mem: number, learning: number, pct: number) =>
    `${mem} mémorisés · ${learning} en apprentissage · ${pct}%`,
  legend: {
    none: "Non commencé",
    learning: "En apprentissage",
    memorized: "Mémorisé",
  },
  sheet: {
    heading: (surah: number, ayah: number) => `Sourate ${surah} · Verset ${ayah}`,
    current: (label: string) => `État actuel : ${label}`,
    reviewedNow: "Révisé à l'instant ✓",
  },
  stateButton: {
    none: "Non commencé",
    learning: "En apprentissage",
    memorized: "Mémorisé",
  },
  range: {
    title: (surah: number) => `Intervalle · Sourate ${surah}`,
    from: "De",
    to: "À",
    range: (max: number) => `1–${max}`,
    target: "État cible",
    cancel: "Annuler",
    apply: "Appliquer",
  },
  undo: "Annuler",
  undoLabels: {
    cleared: (s: number, a: number) => `Effacé ${s}:${a}`,
    set: (s: number, a: number, target: PersistedAyahState) =>
      `${s}:${a} → ${stateLabel(target)}`,
    cycled: (s: number, a: number) => `Basculé ${s}:${a}`,
    range: (s: number, from: number, to: number, target: PersistedAyahState | "none") =>
      `Plage ${s}:${from}–${to} → ${stateLabel(target)}`,
    many: (s: number, count: number, target: PersistedAyahState | "none") =>
      `${count} verset${count > 1 ? "s" : ""} de la sourate ${s} → ${stateLabel(target)}`,
    reviewed: (s: number, from: number, to: number) => `Révisé ${s}:${from}–${to}`,
    struggled: (s: number, from: number, to: number) => `Difficulté ${s}:${from}–${to}`,
  },
} as const;

export const stateLabel = (s: AyahState | "none"): string => {
  switch (s) {
    case "learning":
      return t.legend.learning;
    case "memorized":
    case "needsReview":
      return t.legend.memorized;
    case "none":
    default:
      return t.legend.none;
  }
};
