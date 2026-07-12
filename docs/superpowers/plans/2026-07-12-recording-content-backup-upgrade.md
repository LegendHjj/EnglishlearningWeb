# Recording, Content, and Backup Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recordings contextual and controllable, add complete audio backup, and deepen evidence-based speaking content.

**Architecture:** Recording metadata links audio in IndexedDB to missions and Big 30 questions. Reusable recording playback renders in the library and question detail. Versioned JSON backup serializes blobs only during explicit export/import, while normal runtime storage remains unchanged. Seed migration merges stable built-in IDs into existing LocalStorage state.

**Tech Stack:** React 19, TypeScript, IndexedDB, LocalStorage, SpeechSynthesis, Vitest, Testing Library.

## Global Constraints

- Keep the app backend-free and login-free.
- Keep normal audio storage in IndexedDB and other state in versioned LocalStorage.
- Preserve existing user phrases and progress during seed expansion.
- Preserve the Big 30 question wording.
- Add no external AI, speech-to-text, scoring, payments, or social features.

---

### Task 1: Recording metadata and playback

**Files:** Modify `src/features/Recorder.tsx`, `src/pages/RecordingsPage.tsx`, `src/services/recordingDb.ts`, `src/types/index.ts`; create focused tests and a reusable recording list component.

- [ ] Write failing tests for play/pause state and question metadata.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement synchronized playback, contextual labels, and source filtering.
- [ ] Run focused tests and confirm passes.

### Task 2: Big 30 contextual practice

**Files:** Modify `src/pages/Big30Page.tsx`, `src/data/seed.ts`, and styles.

- [ ] Write failing tests for saved question IDs, per-question memos, speech controls, and embedded recordings.
- [ ] Implement model answers, memo playback/persistence, and question recording history.
- [ ] Verify focused tests.

### Task 3: Complete backup

**Files:** Modify `src/services/storage.ts`, `src/services/recordingDb.ts`, `src/pages/SettingsPage.tsx`, and service tests.

- [ ] Write a failing audio backup round-trip test.
- [ ] Implement version 2 export/import with version 1 compatibility and atomic validation-before-replace behavior.
- [ ] Verify service tests.

### Task 4: Research-backed content expansion

**Files:** Modify `src/data/seed.ts`, `src/services/storage.ts`, `src/pages/NotebookPage.tsx`, `src/pages/PracticePage.tsx`, `src/pages/DashboardPage.tsx`, and `src/pages/MissionPage.tsx`.

- [ ] Write failing seed-count and merge-preservation tests.
- [ ] Add stable categorized phrase, mission, and practice seeds plus category filtering.
- [ ] Make the daily mission selection deterministic and route it into the mission flow.
- [ ] Verify content and storage tests.

### Task 5: Full verification

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run desktop and mobile browser QA on recordings, Big 30, notebook, practice, and settings.
