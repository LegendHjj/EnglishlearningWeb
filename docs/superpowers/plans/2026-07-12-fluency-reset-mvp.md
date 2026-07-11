# Fluency Reset MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, local-first speaking practice MVP with functional onboarding, missions, notebook, recording, practice, progress, and data portability.

**Architecture:** A React Router application composes focused route pages from reusable UI and feature modules. Versioned LocalStorage holds JSON domain state; IndexedDB owns audio blobs; recorder and speech hooks isolate browser APIs.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, React Router, Lucide React, Recharts, Vitest, Testing Library.

## Global Constraints

- No backend, login, payments, external AI APIs, speech-to-text, or pronunciation scoring.
- Audio stays on-device in IndexedDB; JSON state uses versioned LocalStorage.
- One clear major action at a time during speaking practice.
- Mobile-first, keyboard accessible, reduced-motion aware, and non-punitive copy.

---

### Task 1: Foundation and design system

**Files:** Create package/config files, `src/main.tsx`, `src/styles.css`, `src/App.tsx`, `src/components/ui/*`, `src/components/layout/AppShell.tsx`.

**Interfaces:** Produces the router shell, global tokens, and reusable Button/Card/Field/Progress/Modal primitives.

- [ ] Write a route smoke test asserting the landing page renders at `/` and app navigation is labelled.
- [ ] Run `npm test -- --run` and confirm the missing app fails.
- [ ] Scaffold Vite/TypeScript/Tailwind/Vitest and implement the shell and primitives.
- [ ] Run the test and confirm it passes; commit foundation.

### Task 2: Domain model, seeds, and persistence

**Files:** Create `src/types/index.ts`, `src/data/{missions,phrases,bigQuestions,practice}.ts`, `src/services/storage.ts`, `src/context/AppContext.tsx`, tests under `src/services` and `src/data`.

**Interfaces:** Produces `UserPreferences`, `SpeakingMission`, `Phrase`, `SpeakingPack`, `Recording`, `DailyProgress`, `BigQuestion`, `PracticeResult`; `loadState`, `saveState`, `exportState`, `importState`.

- [ ] Write failing tests for seed counts, safe corrupted-state fallback, and import schema rejection.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement types, required seed quantities, versioned persistence, and context mutations.
- [ ] Run focused and full tests; commit domain foundation.

### Task 3: Landing, onboarding, and dashboard

**Files:** Create `src/pages/{Landing,Onboarding,Dashboard}Page.tsx`, `src/features/onboarding/OnboardingFlow.tsx`, dashboard components, route tests.

**Interfaces:** Consumes app context; produces stored onboarding preferences and session selection routes.

- [ ] Write failing tests for landing CTA, one-question onboarding progression, and dashboard session options.
- [ ] Verify failures, then implement responsive pages and persistence.
- [ ] Run tests and commit acquisition and start flow.

### Task 4: Notebook and speaking packs

**Files:** Create `src/pages/NotebookPage.tsx`, `src/features/notebook/{PhraseCard,PhraseForm,NotebookFilters,PackCard}.tsx`, tests.

**Interfaces:** Consumes phrase/pack mutations; produces search/filter, add/edit/delete/favourite/status, TTS, and pack actions.

- [ ] Write failing interaction tests for adding, editing, filtering, favouriting, and deletion confirmation.
- [ ] Verify failures, implement the notebook and pack management, then verify all tests.
- [ ] Commit notebook workflows.

### Task 5: Recording storage and browser recorder

**Files:** Create `src/services/recordingDb.ts`, `src/hooks/{useRecorder,useSpeech}.ts`, `src/features/recordings/Recorder.tsx`, tests.

**Interfaces:** Produces `saveRecording`, `listRecordings`, `deleteRecording`, `useRecorder`, and `speak`; exposes denied/unsupported/recording/paused/ready states.

- [ ] Write failing tests for unsupported MediaRecorder, duration formatting, and IndexedDB metadata behavior.
- [ ] Verify failures, implement explicit permission recording controls and local privacy messaging.
- [ ] Run focused/full tests and commit recording infrastructure.

### Task 6: Daily mission flow

**Files:** Create `src/pages/MissionPage.tsx`, `src/features/missions/{DifficultyPicker,MissionPrep,PhrasePicker,NoteStageControl,MissionResult}.tsx`, tests.

**Interfaces:** Consumes missions, phrases, recorder, and progress mutations; produces memo saving, up-to-three pinned phrases, Follow/Recall/Free display, retry prompt, and completion metrics.

- [ ] Write failing tests for three-phrase cap, note-stage transforms, retry, and progress completion.
- [ ] Verify failures, implement the staged flow, verify tests, and commit.

### Task 7: Big 30 and Practice Room

**Files:** Create `src/pages/{Big30,Practice}Page.tsx`, `src/features/practice/*`, tests.

**Interfaces:** Consumes seeded questions/exercises, speech/recorder hooks, and progress; produces question planners, note stages, and five practice modes.

- [ ] Write failing tests for question filtering/progress and Tight/Loose/Free/Mouth Reps mode switching.
- [ ] Implement and verify interactive practice flows; commit.

### Task 8: Recordings, progress, and settings

**Files:** Create `src/pages/{Recordings,Progress,Settings}Page.tsx`, chart/recording/settings feature components, tests.

**Interfaces:** Consumes recording DB and app context; produces replay/rename/link/compare/delete, charts, preferences, export/import, reset, and safe errors.

- [ ] Write failing tests for empty recordings, delete confirmation, export payload, invalid import preservation, and settings updates.
- [ ] Implement route features, lazy-load charts, verify tests, and commit.

### Task 9: Visual and end-to-end verification

**Files:** Modify responsive styles and feature components; create `README.md`; remove temporary QA artifacts.

- [ ] Run `npm test -- --run`, `npm run typecheck`, and `npm run build` with zero failures.
- [ ] Start the app and verify landing → onboarding → dashboard → mission → notebook → progress at desktop and mobile sizes.
- [ ] Verify microphone denied/unsupported messaging and local privacy copy.
- [ ] Compare implementation screenshots to the accepted concept with at least five fidelity checks and repair all material mismatches.
- [ ] Document setup, browser requirements, persistence, privacy, and MVP limitations; commit final polish.
