# hifz-poc

Proof-of-concept for Hifz (Quran memorization) progress tracker.

Two deliverables sharing one core:

- **Hifz Tracker** — embeddable module for a daily-routines host app (ADHD-oriented).
- **Open Mushaf Tracker** — standalone open-source React Native (Expo) app; verse-level interactive Quran view.

## Layout

```
packages/
  hifz-core/          shared TS: types, structure data, state ops,
                      aggregates, chunk scheduler, persistence iface
apps/
  mushaf-tracker/     Expo app (Deliverable B). Web-first for POC.
```

## Run

Prereqs: Node 20+, npm 10+.

```bash
npm install                    # once, at repo root

# hifz-core (library)
npm test --workspace=@hifz/core
npm run typecheck

# mushaf-tracker (Expo app, web)
npm run web --workspace=mushaf-tracker
# → opens http://localhost:8081 in your browser
```

## Status

- **Phase 1 (done):** `hifz-core` — domain, aggregates, scheduler, persistence. 41 unit tests.
- **Phase 2 (done):** Expo web app — surah list, ayah grid, bottom sheet, range marking, undo, AsyncStorage persistence.
- **Phase 3 (todo):** verse text bundling, reading view, dashboard, settings, export/import UI, ayah-index for exact juz progress.

Spec: [docs/spec.md](docs/spec.md).

## License

MIT
