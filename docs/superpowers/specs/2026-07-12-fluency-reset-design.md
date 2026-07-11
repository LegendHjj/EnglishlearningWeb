# Fluency Reset — Core-Complete MVP Design

## Product outcome

Fluency Reset is a local-first speaking gym for adults who understand English but freeze when speaking. The product rewards completed communication, short daily wins, phrase reuse, and gradual independence from notes. A first-time user can begin speaking within two minutes.

## Scope

The MVP includes the landing page, six-step onboarding, dashboard, daily mission flow, Speaking Notebook, Big 30, Practice Room, recordings library, progress dashboard, and settings. The deepest workflows are missions, phrase pinning, recording/replay, notebook management, note hiding, and progress tracking. Authentication, payments, AI conversation, transcription, scoring, and external APIs are excluded.

## Experience direction

The interface uses warm off-white surfaces, deep ink text, restorative teal, and a restrained coral accent. Large rounded cards, soft depth, readable type, quiet motion, and ample spacing make it feel like an adult wellness product rather than a classroom. The recording interface removes navigation distractions and exposes one dominant action at a time.

## Primary journey

1. The landing page explains why speaking freezes happen and introduces the Refer → Recall → Speak Naturally method.
2. Onboarding asks one question per screen and stores the resulting profile locally.
3. The dashboard offers Quick Win, Normal Practice, and Full Workout, with “Start Today’s Speaking Mission” as the primary action.
4. A mission moves through setup, memo, phrase selection, recording, one encouraged retry, and a measurable positive result.
5. Completion updates daily progress and offers an optional continuation without pressure.
6. Saved phrases and recordings remain available in the Notebook and Recordings pages.

## Architecture

The application uses React, Vite, TypeScript, Tailwind CSS, React Router, Lucide icons, and Recharts. Route pages compose focused feature components. Shared UI primitives cover buttons, cards, badges, fields, dialogs, navigation, progress bars, and empty states. Seed content is kept in dedicated data modules, domain shapes in a shared types module, and persistence behind service functions.

State is local and versioned. A small application context exposes preferences, phrases, packs, progress, and mutations while keeping frequently changing recorder state inside the recorder feature. Static routes and heavier chart/recording pages may be lazy-loaded to keep the initial bundle lean.

## Data and persistence

Versioned LocalStorage stores onboarding preferences, phrase edits, packs, mission state, Big 30 progress, practice results, and aggregate progress. IndexedDB stores audio blobs plus recording metadata. Import validates a versioned JSON envelope before replacing non-audio state; malformed imports leave existing data untouched. Export excludes audio blobs and clearly states that limitation.

Seed content includes 12 missions, 30 Big Questions, 30 useful phrases, 5 rescue phrases, 5 sentence frames, 4 packs, 6 exercises for each Tight/Loose/Free mode, and 5 Mouth Reps exercises.

## Recording and speech

The recorder requests microphone access only after an explicit user action. It supports start, pause/resume when available, stop, timer, replay, delete, retry, save, and duration/size limits. Clear states cover denied permission, missing MediaRecorder support, empty capture, and storage errors. SpeechSynthesis provides model phrase playback and respects the saved voice preference.

## Note hiding and practice

Mission phrases and Big 30 answers support Follow (full text), Recall (phrase opening), and Free (topic/key points only). Practice Room separates Mouth Reps, Tight, Loose, Free, and Shadowing while sharing the same recorder and speech controls. Phrases and whole Speaking Packs can be pinned into a mission, with a maximum of three visible phrases for focus.

## Accessibility and responsive behavior

All controls use semantic elements, visible focus states, text labels, sufficient contrast, and keyboard-operable dialogs. Reduced-motion preferences disable nonessential transitions. Desktop uses a compact left rail for signed-in product pages; mobile uses a top bar and bottom navigation. Recording layouts keep the microphone action reachable and uncluttered at narrow widths.

## Error handling and privacy

Destructive phrase, recording, and reset actions require confirmation. Empty states include a direct next action. Corrupted stored data falls back safely to seeds while preserving recoverable fields. The recorder and settings pages state: “Your recordings are stored on this device for the MVP and are not uploaded to a server.”

## Verification

Verification covers TypeScript compilation, production build, responsive rendering, onboarding persistence, notebook create/edit/delete/favourite/status flows, mission phrase pinning and memo persistence, microphone fallback states, recording save/replay/delete where browser permissions allow, progress updates, Big 30 note stages, and settings export/import validation. Desktop and mobile screenshots are compared against the approved visual concept before handoff.

## Deliberate MVP limitations

Usage of a selected phrase is user-confirmed rather than detected because speech-to-text is excluded. Audio is not included in JSON exports. Cross-device sync is unavailable without a backend. Browser codec and microphone support vary; unsupported browsers receive a clear fallback rather than simulated recording.
