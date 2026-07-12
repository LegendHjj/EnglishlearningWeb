# Recording, Content, and Backup Upgrade Design

## Outcome

Fluency Reset should make every saved recording easy to replay and find in context, provide evidence-based speaking material beyond the Big 30, and let users move all local data—including audio—to another browser or device.

## Recording experience

- Use one accessible custom play/pause control per recording, synchronized to the actual audio element.
- Remove rename and compare icons until those workflows are complete and understandable.
- Save `questionId` or `missionId` plus a descriptive name with each recording.
- Show Big 30 recordings both in the main recording library and under their source question.
- Persist Big 30 completion to LocalStorage before awaiting the IndexedDB audio write.

## Speaking support

- Preserve the existing 30 question texts.
- Add a short model answer and text-to-speech controls for the model and the learner's memo.
- Persist a separate memo per Big 30 question.
- Keep Follow, Recall, and Free support fading.

## Content system

- Expand built-in phrases across workplace, meetings, customer service, clarification, social connection, travel, interviews, presentations, recovery, and opinion categories.
- Add a category filter to the Speaking Notebook.
- Expand missions and Tight, Loose, Free, Mouth Reps, and Shadowing practice with realistic communicative outcomes.
- Merge new seeded content into saved state by stable ID without overwriting user-edited or personal phrases.
- Base content on the supplied fluency PDFs, CEFR action-oriented spoken interaction categories, British Council real-life task guidance, and task-repetition research.

## Complete backup

- Export a version 2 JSON envelope containing versioned application state and every recording with base64 audio.
- Import version 1 progress-only files for backwards compatibility.
- Import version 2 files by validating all state first, then replacing IndexedDB recordings and application state.
- Clearly label export/import as complete backup and warn that audio makes files larger.

## Verification

- Unit tests cover custom playback state, recording source metadata, seed merging, and audio backup round-trips.
- Interaction tests cover Big 30 memo/model playback and question recording display.
- Required test, typecheck, and build commands pass.
- Desktop and mobile browser QA verifies recording rows, Big 30 detail layout, notebook filtering, and settings backup copy.
