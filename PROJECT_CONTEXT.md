# Fluency Reset — Project Context and Handoff

Last updated: 2026-07-12

## What this project is

Fluency Reset is a responsive, local-first English speaking gym for adults who understand basic or intermediate English but freeze when they need to speak. It trains retrieval, mouth repetition, reusable phrases, and real-life speaking confidence rather than grammar scores or passive study.

Tagline: “Stop studying English. Start training your speaking reflex.”

The main product loop is:

1. Choose a Quick Win (2 minutes), Normal Practice (5 minutes), or Full Workout (10 minutes).
2. Choose Easy, Practical, or Brave mission difficulty.
3. Prepare a keyword memo rather than an essay.
4. Pin up to three phrases from the Speaking Notebook.
5. Record an answer locally.
6. Try one focused retry.
7. Receive positive, measurable completion feedback.

The gradual support system is Follow → Recall → Free, or Refer → Recall → Speak Naturally.

## Current implementation status

The core-complete MVP is implemented. It is not a static mockup.

Implemented routes and features:

- Landing page with product explanation and CTA
- Six-step onboarding stored locally
- Personalised dashboard and three session durations
- Daily Mission flow with difficulty, memo, phrase picker, pinned phrases, note stages, recorder, retry, and completion state
- Speaking Notebook with search, status filtering, add/edit/delete, favourites, TTS playback, phrase pinning, and four Speaking Packs
- Big 30 Questions with planners, sentence frames, memo, note stages, and recording
- Practice Room with Mouth Reps, Tight, Loose, Free, and Shadowing modes
- Recordings library using IndexedDB audio blobs
- Progress page using Recharts
- Settings for preferences, JSON export/import, reset, and recording deletion
- Responsive desktop sidebar and mobile bottom navigation
- Browser microphone permission, denial, and unsupported-browser handling
- Browser SpeechSynthesis phrase playback

Seed content includes 12 missions, 30 Big Questions, 30 phrase cards (including five rescue phrases and five sentence frames), four packs, six Tight exercises, six Loose exercises, six Free exercises, and five Mouth Reps.

## Technology and structure

- React 19
- Vite 7
- TypeScript
- Tailwind CSS 4 plus project CSS tokens
- React Router
- Lucide React icons
- Recharts, lazy-loaded with the Progress route
- Vitest and Testing Library
- Browser MediaRecorder and SpeechSynthesis APIs
- LocalStorage for versioned JSON application state
- IndexedDB for audio blobs and recording metadata

Important folders:

- `src/pages/` — route-level screens
- `src/features/` — recorder feature
- `src/components/` — app shell and shared UI
- `src/context/` — application state and mutations
- `src/data/` — seeded missions, phrases, questions, packs, and exercises
- `src/hooks/` — recorder and speech browser APIs
- `src/services/` — LocalStorage and IndexedDB persistence
- `src/types/` — shared domain interfaces
- `src/utils/` — note-stage and timer helpers

## Visual direction

The accepted design is an adult wellness/habit-building product rather than a school LMS. The implementation uses:

- Warm off-white background
- Deep forest/teal green primary colour
- Restrained coral accent
- Pale sage selected states
- Fine neutral borders and subtle shadows
- Large editorial headings and compact readable UI type
- Rounded cards without childish styling
- A strong circular microphone action
- Minimal distractions during speaking

The generated concept originally used a leaf logo. The implementation intentionally uses a simpler reset-arrow mark. The rest of the primary dashboard and mission visual language was matched closely.

## Verification already completed

The following passed immediately before the handoff:

```bash
npm test -- --run
npm run typecheck
npm run build
```

Result: 3 test files and 7 tests passed; TypeScript passed; the production build passed.

Playwright fallback QA was used because the Browser plugin was unavailable. Verified viewports:

- Desktop: 1536 × 1024
- Mobile: 390 × 844

Verified interaction paths:

- Landing → onboarding → dashboard
- Dashboard → mission difficulty → preparation → speaking screen → Recall mode
- Notebook → add phrase → save → search and display result
- All application routes render at mobile width
- Mobile navigation has five horizontal items
- No mobile horizontal overflow
- No console errors or warnings after final fixes

## Known MVP limitations

- There is no backend, account, or cross-device sync.
- Audio is not included in JSON exports.
- Live recording format and pause support depend on the browser.
- Real microphone capture requires user permission and a supported device/browser.
- Phrase usage is user-directed rather than automatically detected because speech-to-text is excluded.
- No pronunciation scoring, live AI conversation, grammar correction, payment, community, or teacher features.
- Progress seed metrics such as 12 speaking days and 46 minutes are demonstration data until replaced by accumulated user activity.

## Safe next improvements

If the user asks for continued development, useful next steps are:

1. Add deeper component interaction tests for onboarding, notebook CRUD, mission progression, and IndexedDB recording operations.
2. Add explicit rename/link/compare implementation polish in the recordings library.
3. Improve progress calculations so every dashboard metric is derived only from saved activity.
4. Add a comeback-mode dashboard message based on last activity date.
5. Add more complete Big 30 “Then vs Now” comparison flows.
6. Test actual microphone capture manually in the user’s preferred browser.
7. Run accessibility auditing with axe and keyboard-only browser QA.

Do not add these automatically; confirm scope with the user first.

## Repository and location

User-facing project location:

`D:\Development\EnglishlearningWeb`

Current implementation branch at handoff:

`feature/fluency-reset-mvp`

Primary implementation commit before these handoff docs:

`75e850a feat: build Fluency Reset speaking MVP`
