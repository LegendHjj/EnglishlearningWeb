# Fluency Reset 60-Day Programme Design

## Outcome

Extend the existing local-first Fluency Reset MVP into a progressive 60-practice-day programme without replacing the current visual system, routes, Library, vocabulary, recordings, or saved user data. A learner always receives the earliest incomplete programme mission, regardless of calendar gaps.

## Content architecture

The three JSON files in `src/content/` remain the authored source of truth. TypeScript models describe their structures, runtime validators reject malformed packs, and a content repository exposes phases, missions, linked drills, Big 30 guides, and the content version. Pages consume repository functions rather than importing or duplicating large content arrays.

If validation fails, repository calls return safe empty results and a friendly content-unavailable state. Validation never mutates learner state.

## State and migration

Application state advances from schema version 3 to version 4 and stores a separate programme content version. New state covers completed programme IDs, completed drill IDs, mission self-checks, unfinished session state, checkpoint recording references, and a maximum-ten-item practice queue.

Migration preserves preferences, phrases, packs, vocabulary, memos, Big 30 progress, old progress rows, practice results, pins, and Library state. Existing `m1`-`m24` mission IDs remain as legacy history. A curated map credits only strong semantic equivalents; progression still selects the earliest incomplete programme day, so later credited lessons never cause a learner to jump ahead. IndexedDB stays on the existing database and object store, with optional recording metadata added compatibly.

## Programme and mission experience

The dashboard shows the next incomplete day, phase, situation, outcome, skill focus, session duration, and a linked recommendation. A new programme page shows phase progress, checkpoint days, completed missions, and upcoming previews. Replaying a completed mission does not change progression.

Session length determines the flow:

- Quick Win: situation, optional memo, one recording, self-check, complete.
- Normal Practice: preparation, first recording, focused retry, self-check, complete.
- Full Workout: linked warm-up, preparation, first recording, retry, follow-up response, reflection, complete.

Difficulty consumes the selected mission level. Easy shows full support with longer preparation; Practical uses keywords and partial phrase hints; Brave uses minimal notes, short preparation, the advanced prompt, a follow-up, and a no-restart rule during the timed answer. The interface states the actual requirements before recording.

Completion requires an honest learner self-check: message outcome, pinned items actually used, confidence 1-5, follow-up completion, and Follow/Recall/Free support stage. Only recording duration is measured automatically.

## Practice Room

The Practice Room renders the seven JSON-backed modes through focused mode components under a shared workout shell. Every workout explains the skill and real-world value, then moves through setup, first attempt, one focused retry, reflection, and completion. Drill completions are stored independently from programme completion.

Mission links use `linkedPracticeIds`. Full Workout opens a short linked warm-up and returns to the preserved mission session. The Practice Room supports mode, phase, category, and communicative-function filters and labels mission-linked recommendations.

## Big 30

Existing question identity and memos remain intact while each question receives its JSON guide through an explicit `q1` to `big-01` mapping. Purpose, specific key points, support frames, common trap, follow-up, stage instructions, and timed rounds replace the generic planner. Existing and new recordings remain comparable in the same history view.

## Progress and recordings

Progress metrics derive from saved mission self-checks, completed drills, legacy activity, and IndexedDB recording metadata. The UI no longer writes hard-coded confidence or assumes pinned items were spoken. Empty datasets show neutral empty states.

Recording rows retain their existing shape and audio. Optional programme day, drill, attempt kind, and checkpoint fields support linking and comparison without an IndexedDB schema reset.

## Accessibility and failure handling

Redesigned pages work at 390px without horizontal overflow. Controls remain keyboard accessible, timers have readable labels, long content wraps, dialogs scroll, SpeechSynthesis exposes stop controls, and microphone failures keep their recovery guidance. Content errors, missing IDs, storage errors, and empty collections show actionable messages without blanking the app.

## Verification

Automated tests cover content validation, progression, migration, session flows, difficulty, honest self-reporting, all seven practice modes, mission/drill links, Big 30 guide mapping, backups, and preserved recording access. Final verification runs the full Vitest suite, TypeScript, production build, and browser QA at desktop and 390px mobile widths across onboarding, dashboard, programme, mission, Practice Room, Big 30, Library, recordings, progress, and settings.
