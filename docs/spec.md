# Hifz Progress Tracking — Product & Technical Specification

**Status:** Draft for implementation handoff
**Scope:** Two deliverables sharing one data model:

1. **Deliverable A — "Hifz Tracker" feature**: a minimal, embeddable progress-tracking module for an existing daily-routines app aimed at Muslim users with ADHD.
2. **Deliverable B — "Open Mushaf Tracker" app**: a standalone open-source React Native app that demonstrates the fuller vision (verse-level interactive Quran view with state coloring).

The two deliverables intentionally share the same core domain model and (optionally) the same TypeScript package, so that A is a strict subset of B's logic.

---

## 1. Goals & Non-Goals

### 1.1 Goals
- Let a user track hifz (Quran memorization) progress at **verse (ayah) granularity**, aggregated at surah / juz / page levels.
- Make progress **visually obvious at a glance** (grid of colored cells) — low-friction feedback suited to ADHD users.
- Support a small number of **memorization states** per verse, changed with minimal interaction cost.
- Integrate revision into a **daily routine engine** (Deliverable A) or a simple built-in scheduler (Deliverable B).
- Work **fully offline** for structure and tracking; verse text may be bundled or fetched.

### 1.2 Non-Goals
- Rendering a page-accurate mushaf (Madani page layout, tajweed coloring). Explicitly out of scope for both deliverables in v1.
- Audio recitation playback (optional stretch for B, see §9).
- Accounts/sync/backend (A uses the host app's persistence; B uses local storage; cloud sync is a stretch goal).
- Translations/tafsir beyond a single optional translation line in the verse viewer.

---

## 2. Domain Model (shared)

### 2.1 Static Quran structure

Immutable reference data, bundled as JSON (no network dependency):

```ts
interface SurahMeta {
  id: number;            // 1–114
  nameArabic: string;    // e.g. "الفاتحة"
  nameTransliterated: string; // "Al-Fatihah"
  nameTranslated?: string;    // "The Opening"
  ayahCount: number;     // e.g. 7
  revelationPlace: "makkah" | "madinah";
  juzSpan: number[];     // juz numbers this surah touches, e.g. [1] or [1,2,3]
}
```

- Total dataset: 114 rows, ~10 KB. Bundle as `quran-structure.json`.
- Optional secondary table `ayah-index.json` mapping each ayah to `{ juz, hizbQuarter, page }` (~6,236 rows, ~200 KB) — needed only for juz/page aggregation views. Ship it in B; make it optional in A.

### 2.2 Memorization state

```ts
type AyahState =
  | "none"        // not started (default, not persisted)
  | "learning"    // actively memorizing
  | "memorized"   // user marked as acquired
  | "needsReview"; // system-derived, see §6 — never set manually
```

Rationale: exactly three user-settable states. `needsReview` is computed, not clicked. Keeping the manual state space at 3 is a deliberate ADHD-oriented constraint — do not add more states in v1.

```ts
interface AyahRecord {
  surah: number;         // 1–114
  ayah: number;          // 1–ayahCount
  state: Exclude<AyahState, "none" | "needsReview">;
  updatedAt: string;     // ISO 8601
  memorizedAt?: string;  // set when state first becomes "memorized"
  lastReviewedAt?: string;
  reviewCount: number;   // successful reviews since memorized
}
```

- **Sparse storage**: only persist records where state ≠ `none`. A fresh user has an empty table.
- Storage estimate: worst case (full Quran tracked) 6,236 records ≈ a few hundred KB. Trivial.

### 2.3 Derived aggregates (computed, never stored)

- `surahProgress(surahId)` → `{ memorized, learning, needsReview, total, percent }`
- `juzProgress(juzId)` → same shape (requires ayah-index)
- `overallProgress()` → same shape across 6,236 ayat
- `needsReview` derivation: see §6.

---

## 3. Deliverable A — Hifz Tracker feature (host-app integration)

### 3.1 Integration contract

The feature is a self-contained module with three touchpoints into the host app:

1. **Persistence adapter** — the host provides `save(records)` / `load()` (or a key-value store handle). The module never owns storage directly.
2. **Routine engine hook** — the module exposes `getTodaysRevisionTasks(): RevisionTask[]` so the host's existing daily-routine system can surface revision items alongside other routines (see §6).
3. **Navigation entry point** — one screen ("My Hifz") reachable from the host app's menu, plus optional home-screen progress widget/card.

```ts
interface RevisionTask {
  id: string;                 // stable, e.g. "rev:67:1-30"
  title: string;              // "Review Surah Al-Mulk (1–30)"
  surah: number;
  ayahRange: [number, number];
  dueDate: string;            // ISO date
  onComplete(): void;         // marks lastReviewedAt, reschedules
}
```

### 3.2 Screens

**Screen A1 — Surah list (entry screen)**
- Vertical list of 114 surahs. Each row: surah number, Arabic name, transliterated name, ayah count, and a thin horizontal progress bar (green = memorized, amber = learning, red tint = needsReview share).
- Sort options: canonical order (default), by progress, recently updated.
- A compact header card: overall stats — "X / 6236 verses memorized", current streak of revision-task completion (reuse host app's streak mechanic if it has one).
- Search by surah name (Arabic or transliterated).

**Screen A2 — Surah detail (the grid)**
- Header: surah name, progress bar, percent, "Mark range…" button.
- **Ayah grid**: one small cell per ayah (rounded square or dot), numbered, wrapping rows, RTL-aware ordering (ayah 1 at top-right when app locale is RTL; follow host app locale otherwise).
- Cell colors (use host app theme tokens; suggested semantics):
  - `none` → neutral/outline
  - `learning` → amber/yellow fill
  - `memorized` → green fill
  - `needsReview` → green fill with distinct marker (e.g. small dot badge or desaturated green) — must remain distinguishable for color-blind users via shape, not color alone.
- Legend row pinned under the header (small, dismissible after first-run).

### 3.3 Interactions (core UX decisions)

- **Tap on cell → verse bottom sheet.** Shows: ayah number, verse text (see §5 for source), current state, and three explicit state buttons (`Not started / Learning / Memorized`) plus, when state is memorized, a "Reviewed just now ✓" action.
- **Long-press on cell → quick state cycle** (`none → learning → memorized → none`), with haptic tick and a small toast/undo. This is the power-user shortcut; the bottom sheet remains the discoverable path. First long-press ever triggers a one-time tooltip explaining the cycle.
- **Range marking:** "Mark range…" opens a two-thumb range selector (or tap-first-cell/tap-last-cell mode on the grid) → choose target state → confirm. This is required, not optional: users memorize in pages/quarters, not single verses.
- **Undo:** every state mutation shows a 5s snackbar undo. No confirmation dialogs (interaction cost kills ADHD users' momentum; undo > confirm).

### 3.4 ADHD-specific design constraints

- Every screen must show progress delta of the current session where feasible ("+4 verses today").
- No empty-state dead ends: fresh install shows a suggested starter ("Most people begin with Juz 'Amma — open Surah An-Naba?").
- Micro-celebrations on milestones (surah completed, juz completed): short confetti/animation, respecting the host app's reduced-motion setting.
- All primary actions reachable in ≤ 2 taps from Screen A1.

### 3.5 Explicitly out of scope for A

- Full Quran text browsing (only per-verse on-demand text in the bottom sheet).
- Juz/page views (surah-level only in v1; juz aggregation is a fast follow if ayah-index is bundled).
- Its own notification system — revision surfaces exclusively through the host routine engine.

---

## 4. Deliverable B — Open Mushaf Tracker (standalone React Native app)

Open-source (MIT), Expo-based React Native, iOS + Android.

### 4.1 Positioning

B is the "maximalist demo": everything in A, plus a **continuous reading view** where the Quran text itself is the interactive surface — tapping a verse highlights/overlines it in green when memorized. It exists to (a) demonstrate the fuller UX to the friend, (b) serve as a reference implementation of the shared core package.

### 4.2 Architecture

```
packages/
  hifz-core/          # shared TS package: domain model, aggregates,
                      # revision scheduler, persistence-adapter interface
apps/
  mushaf-tracker/     # Expo app (Deliverable B)
```

- `hifz-core` is published (or at least structured) so Deliverable A can consume it directly. **This package is the actual handoff artifact of highest value.**
- State management: Zustand (light, no boilerplate). Persistence: `AsyncStorage` via adapter, or SQLite (expo-sqlite) if perf demands — start with AsyncStorage + in-memory index.
- Verse text: bundled JSON per surah (see §5), lazy-loaded per surah with `require`/dynamic import; total ≈ 2–3 MB for Uthmani text — acceptable to bundle fully offline.

### 4.3 Screens

- **B1 Surah list** — same as A1.
- **B2 Reading view (the differentiator)** — vertical scroll of the surah's full Arabic text, verse by verse (simple flowed layout, *not* page-accurate mushaf). Each verse is a tappable text block ending with its ayah-number marker (۝).
  - Verse visual state: memorized → green background wash or overline; learning → amber underline; needsReview → green + badge.
  - Tap verse → same bottom sheet as A (state buttons, mark reviewed).
  - Long-press → quick cycle, same semantics as A.
  - Sticky mini-header: surah progress bar updates live as you mark.
- **B3 Grid view** — same as A2; toggle between grid ⇄ reading view is a segmented control in the surah screen header.
- **B4 Dashboard** — overall heatmap (GitHub-style calendar of review activity), juz completion ring chart, "due for review today" list.
- **B5 Settings** — Arabic script choice (Uthmani/Imlaei), optional translation toggle, review scheduler intensity (relaxed/standard/intense), theme, reduced motion, export/import JSON backup.

### 4.4 Typography & RTL requirements

- Arabic rendering: use a bundled font with full Quranic glyph coverage — **KFGQPC Uthmanic Script HAFS** (free) or **Amiri Quran**. Test ayah markers, small waqf signs render acceptably; if waqf marks are unreliable, ship Imlaei (plain) text as default and Uthmani as opt-in.
- The whole reading view is RTL; ensure `I18nManager`-independent explicit RTL layout for the text surface so app chrome can stay LTR.

---

## 5. Quran data sourcing

### 5.1 Structure (both deliverables)
- Bundle `quran-structure.json` (114 surahs, verse counts). Generate once from any canonical source at build time; commit the file. No runtime API.

### 5.2 Verse text
- **Deliverable A:** on-demand fetch is acceptable. Primary: AlQuran.cloud REST API (`GET /ayah/{surah}:{ayah}` or `/surah/{n}`), no API key. Cache fetched verses in host storage indefinitely (text is immutable). Fallback behavior: if offline and uncached, bottom sheet shows state controls without text plus an "offline" note — **state changes must never depend on network**.
- **Deliverable B:** bundle full text as static JSON (source: Tanzil.net text distribution or fawazahmed0/quran-api static dumps; both permissively licensed — verify license file and attribute in the app's about screen). No runtime API at all.
- Implementation note for the agent: normalize whichever source is chosen into a single internal shape `{ surah, ayah, textUthmani?, textImlaei?, translationEn? }` at build time with a small script committed to the repo.

### 5.3 Ayah index (juz/page mapping)
- Bundle `ayah-index.json` in B; optional in A. Same build-time generation approach.

---

## 6. Revision scheduler (shared, in `hifz-core`)

Keep it deliberately simple — this is not full SM-2. Verse-level spaced repetition of 6k items would overwhelm the target user; scheduling operates on **chunks**, not verses.

### 6.1 Chunking
- A "chunk" = a contiguous memorized range within one surah, auto-derived (merge adjacent memorized ayat; split chunks longer than ~1 page ≈ 15 ayat into page-sized pieces using ayah-index when available, else fixed 15-ayah windows).

### 6.2 Schedule
- Each chunk has `lastReviewedAt` (max of member ayat) and `intervalDays` derived from `reviewCount` (min of member ayat) via a fixed ladder: `1 → 3 → 7 → 14 → 30 → 60` days, capped at 60.
- `needsReview` state: any ayah in a chunk whose `now - lastReviewedAt > intervalDays`.
- **Daily budget:** scheduler returns at most N chunks/day (default 3, configurable §B5 / host setting) ordered by most-overdue-first. Overflow just waits — never show a crushing backlog count; show "3 reviews today", not "47 overdue".
- Completing a review: sets `lastReviewedAt = now`, increments `reviewCount` on all ayat in the chunk. A "struggled" secondary action resets that chunk's ladder position by one step instead of incrementing.

### 6.3 Deliverable A integration
- The host routine engine calls `getTodaysRevisionTasks()` each morning and renders tasks natively as routine items. Completion callbacks route back into the module. The module ships no notifications of its own.

---

## 7. Acceptance criteria (v1)

**Shared core**
- [ ] All state mutations are pure functions in `hifz-core` with unit tests (state cycle, range ops, chunk derivation, ladder math, needsReview derivation).
- [ ] Persistence adapter interface with an in-memory reference implementation + tests.

**Deliverable A**
- [ ] Surah list renders 114 rows with correct counts and live progress bars.
- [ ] Grid supports tap→sheet, long-press cycle with undo, and range marking.
- [ ] Verse text loads on demand, caches, and degrades gracefully offline.
- [ ] `getTodaysRevisionTasks()` returns ≤ N tasks, correct due logic verified by tests with fake clocks.
- [ ] No interaction path to a manual state requires more than 2 taps + 1 selection.

**Deliverable B**
- [ ] Fully offline (structure + text bundled).
- [ ] Reading view: tappable verses with correct RTL flow and state coloring; 60fps scroll on a mid-range Android device for Al-Baqarah (286 verses) — virtualize the list.
- [ ] Grid ⇄ reading toggle preserves scroll position by ayah.
- [ ] Dashboard heatmap and juz rings reflect stored data.
- [ ] JSON export/import round-trips losslessly.
- [ ] MIT license, README with screenshots, attribution for text source and fonts.

---

## 8. Open questions (decide before implementation)

1. **Uthmani vs Imlaei default in B** — pending a font-rendering spike (waqf marks). Recommendation: Imlaei default, Uthmani toggle.
2. **Basmalah handling** — track it as ayah 1 only where it canonically is (Al-Fatihah); elsewhere it is not a counted ayah. Confirm the chosen text source follows Hafs/Kufan numbering (6,236 ayat) and hardcode that assumption.
3. **Host app tech stack for A** — this spec assumes React Native or at least a JS host so `hifz-core` is directly consumable. If the friend's app is Flutter/native, `hifz-core` logic must be ported; the spec's contracts (§3.1, §6) still hold as-is.
4. **Per-verse confidence granularity** — deliberately rejected for v1 (3 states max). Revisit only with user feedback.

---

## 9. Stretch goals (explicitly post-v1)

- Audio playback per verse (EveryAyah / Quran.com CDN) with "listen then recite" review mode.
- Blind-recitation test mode: hide text, reveal word-by-word on tap, log hesitation points as an error map (weak-link tracking).
- Cloud sync/backup.
- Page-accurate mushaf layout (Madani pages) — large effort, requires page-layout dataset and careful font work.
- Widgets (home-screen progress ring).
