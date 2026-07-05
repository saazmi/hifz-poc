import { ayahKey, type AyahRecord, type AyahRecordMap } from "./types";

export interface PersistenceAdapter {
  load(): Promise<AyahRecord[]>;
  save(records: AyahRecord[]): Promise<void>;
}

export const toArray = (map: AyahRecordMap): AyahRecord[] =>
  Array.from(map.values());

export const fromArray = (records: AyahRecord[]): AyahRecordMap => {
  const map = new Map<ReturnType<typeof ayahKey>, AyahRecord>();
  for (const r of records) map.set(ayahKey(r.surah, r.ayah), r);
  return map;
};

/**
 * Reference implementation: keeps records in memory. Useful for tests, previews,
 * and as a base for host-app adapters that layer AsyncStorage / SQLite / a KV store.
 */
export class InMemoryAdapter implements PersistenceAdapter {
  private store: AyahRecord[] = [];

  constructor(initial: AyahRecord[] = []) {
    this.store = [...initial];
  }

  async load(): Promise<AyahRecord[]> {
    return [...this.store];
  }

  async save(records: AyahRecord[]): Promise<void> {
    this.store = [...records];
  }
}

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  records: AyahRecord[];
}

export const exportRecords = (
  map: AyahRecordMap,
  now: string,
): ExportPayload => ({
  version: 1,
  exportedAt: now,
  records: toArray(map),
});

export const importRecords = (payload: unknown): AyahRecordMap => {
  if (
    !payload ||
    typeof payload !== "object" ||
    (payload as { version?: unknown }).version !== 1 ||
    !Array.isArray((payload as { records?: unknown }).records)
  ) {
    throw new Error("Invalid export payload");
  }
  return fromArray((payload as ExportPayload).records);
};
