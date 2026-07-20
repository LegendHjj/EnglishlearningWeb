# My English Library and Vocabulary Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing local-first Fluency Reset MVP with a complete vocabulary bank inside `/app/notebook`, without losing existing user data or weakening the speaking-first experience.

**Architecture:** Vocabulary becomes a first-class part of the existing `AppState` and `AppContext`, with pure utility modules for parsing, duplicate handling, and review scheduling. The existing Notebook route becomes a tabbed Library; focused vocabulary components own add, detail, filtering, and review UI, while mission support combines phrase and vocabulary pins under one three-item limit. Storage keeps the existing LocalStorage key, migrates state in place to schema version 3, and retains IndexedDB as the only live audio store.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Vitest/Testing Library, browser SpeechSynthesis, LocalStorage, IndexedDB, existing CSS tokens and UI primitives.

## Global Constraints

- Keep `/app/notebook`; do not add a separate vocabulary navigation item.
- Keep the application backend-free and login-free; add no external APIs or dependencies.
- Preserve existing saved phrases, packs, pins, preferences, progress, questions, memos, practice results, and IndexedDB recordings.
- Only seed vocabulary for a brand-new state; never restore user-deleted seed phrases or words.
- Keep one combined limit of three pinned phrase/vocabulary support items and show explicit limit feedback.
- Backups v1 and v2 remain importable; new progress/library and complete backups use schema version 3.
- Follow the existing warm off-white, deep green/teal, restrained coral visual language and support 390px mobile width.

---

### Task 1: Vocabulary domain behavior

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/utils/vocabulary.ts`
- Create: `src/utils/vocabulary.test.ts`

**Interfaces:**
- Produces `VocabularyEntry`, `VocabularyStatus`, `ReviewRating`, `parseVocabularyText`, `findVocabularyDuplicate`, `mergeVocabularyEntries`, `scheduleVocabularyReview`, `isVocabularyDue`, and vocabulary speaking hints.

- [ ] Write failing tests for every parser format/alias, unmatched text, empty input, duplicate comparison and merge semantics, and all review ratings/maximum interval.
- [ ] Run `npm test -- --run src/utils/vocabulary.test.ts` and confirm failures are caused by missing behavior.
- [ ] Implement the pure typed utilities with English-only validation, normalized unique lists, preserved source text, and deterministic scheduling via injected/current dates.
- [ ] Re-run the focused tests and keep them green before continuing.

### Task 2: State schema, migration, seeding, and backup v3

**Files:**
- Modify: `src/data/seed.ts`
- Modify: `src/context/AppContext.tsx`
- Modify: `src/services/storage.ts`
- Modify: `src/services/storage.test.ts`

**Interfaces:**
- Extends `AppState` with `schemaVersion`, `vocabulary`, `pinnedVocabularyIds`, and `libraryTab`.
- Adds vocabulary CRUD/review mutations and a combined pin result contract to `useApp()`.
- Keeps `exportState` as progress/library-only and `exportBackup` as complete including encoded audio.

- [ ] Add failing migration tests for saved state without vocabulary, v1/v2/v3 imports, data preservation, and deleted seed content remaining deleted.
- [ ] Run focused storage tests and confirm the expected red state.
- [ ] Add brand-new vocabulary seeds and a migration function that defaults missing fields without reseeding existing user libraries.
- [ ] Add safe structural import validation and v3 export formats; restore IndexedDB only for complete backups.
- [ ] Implement context vocabulary mutations and combined three-pin enforcement.
- [ ] Re-run storage tests.

### Task 3: Tabbed Library and vocabulary workflows

**Files:**
- Modify: `src/pages/NotebookPage.tsx`
- Create: `src/features/vocabulary/VocabularyTab.tsx`
- Create: `src/features/vocabulary/VocabularyForm.tsx`
- Create: `src/features/vocabulary/VocabularyDetail.tsx`
- Create: `src/features/vocabulary/VocabularyReview.tsx`
- Create: `src/features/vocabulary/VocabularyTab.test.tsx`
- Modify: `src/features.css`

**Interfaces:**
- Library tabs persist through `AppState.libraryTab`.
- Add form supports Quick Add, Paste and Detect editable preview, and complete Manual Entry.
- Detail actions call context mutations, speech, recording, phrase conversion, pinning, and review callbacks.

- [ ] Write failing interaction tests for quick/manual/paste add, edit, delete, search/filter, review completion, phrase conversion, and pin-limit messaging.
- [ ] Run the component test and confirm missing UI failures.
- [ ] Refactor Notebook into Vocabulary, Speaking Phrases, and Speaking Packs tabs while preserving phrase/packs behavior.
- [ ] Expose every phrase field independently, including `whenToUse`, example, tags, type, and status.
- [ ] Build responsive vocabulary statistics, filters, cards, detail modal, add modes, duplicate decision UI, and review session.
- [ ] Re-run the focused component tests.

### Task 4: Speech, mission, dashboard, navigation, and progress integration

**Files:**
- Modify: `src/hooks/useSpeech.ts`
- Modify: `src/pages/MissionPage.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/pages/ProgressPage.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/features/Recorder.tsx`
- Modify: `src/pages.css`
- Modify: `src/styles.css`

**Interfaces:**
- `useSpeech` exposes `speak`, sequential `speakAll`, `stop`, `speaking`, and uses the saved preferred voice when available.
- Mission support renders both pin types with stage-sensitive hints.
- Dashboard links compact quick-add/review actions into the Vocabulary Library.

- [ ] Add/update component tests for dashboard review data, vocabulary mission pin display, combined pin limit, and mobile More links.
- [ ] Extend speech with ordered recap and visible cancellation controls.
- [ ] Add vocabulary support to mission preparation and Follow/Recall/Free recorder support, incrementing speaking usage after saved practice.
- [ ] Add the compact dashboard card without displacing the Daily Mission primary action.
- [ ] Replace all hard-coded progress figures with saved progress/recording-derived values and an empty state.
- [ ] Rename navigation to Library and add a mobile More menu for Progress and Settings.

### Task 5: Export clarity and documentation

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `README.md`

- [ ] Add distinct progress/library export/import and complete backup export/import controls with accurate audio warnings.
- [ ] Update privacy copy and README storage/backup behavior.
- [ ] Confirm both import paths validate before mutating state or IndexedDB.

### Task 6: Full verification and browser QA

**Files:** all changed files.

- [ ] Run `npm test -- --run` and require zero failures.
- [ ] Run `npm run typecheck` and require exit code 0.
- [ ] Run `npm run build` and require exit code 0.
- [ ] Run the app and perform rendered QA at desktop and approximately 390px mobile width.
- [ ] Verify no console errors, no horizontal overflow, `/app/notebook` compatibility, mobile Progress/Settings access, state migration, and IndexedDB recording access.
