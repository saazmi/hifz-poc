import { describe, it, expect } from "vitest";
import {
  InMemoryAdapter,
  exportRecords,
  fromArray,
  importRecords,
  toArray,
} from "./persistence";
import { markRange, setAyahState } from "./state";

const T = "2026-01-01T00:00:00.000Z";

describe("toArray / fromArray", () => {
  it("round-trip preserves records", () => {
    let m = markRange(new Map(), 1, 1, 3, "memorized", T);
    m = setAyahState(m, 2, 1, "learning", T);
    const arr = toArray(m);
    expect(arr).toHaveLength(4);
    const restored = fromArray(arr);
    expect(restored.size).toBe(4);
    expect(restored.get("1:1")?.state).toBe("memorized");
    expect(restored.get("2:1")?.state).toBe("learning");
  });
});

describe("InMemoryAdapter", () => {
  it("save then load returns the same records", async () => {
    const adapter = new InMemoryAdapter();
    const records = toArray(markRange(new Map(), 1, 1, 3, "memorized", T));
    await adapter.save(records);
    const loaded = await adapter.load();
    expect(loaded).toEqual(records);
  });

  it("initial constructor argument is honored", async () => {
    const seed = toArray(markRange(new Map(), 1, 1, 2, "learning", T));
    const adapter = new InMemoryAdapter(seed);
    expect(await adapter.load()).toEqual(seed);
  });
});

describe("export / import", () => {
  it("round-trips through the JSON envelope", () => {
    const m = markRange(new Map(), 1, 1, 3, "memorized", T);
    const payload = exportRecords(m, T);
    const restored = importRecords(JSON.parse(JSON.stringify(payload)));
    expect(restored.size).toBe(3);
  });

  it("rejects payloads with the wrong version", () => {
    expect(() => importRecords({ version: 2, records: [] })).toThrow();
  });

  it("rejects malformed payloads", () => {
    expect(() => importRecords(null)).toThrow();
    expect(() => importRecords({ version: 1 })).toThrow();
  });
});
