# Complete Heart voice pack implementation plan

**Goal:** deliver all static sample audio and matching JSONs, with a persistent Settings importer and fast playback.

**Spec:** `docs/superpowers/specs/2026-10-19-heart-voice-pack-design.md`.

**Architecture:** an external resumable batch generator and a separate IndexedDB audio bank share a strict ZIP/manifest contract. Existing speech controller and PCM playback handle cancellation and microphone safety. Preserve the current app and all learner data.

## Tasks

1. Generator (parallel independent worker): test extraction/dedup/resume, generate the full library locally, validate every file and package the completed archive plus matching JSONs. Files `scripts/voice-pack*`; output outside Git.
2. Import storage: write failing tests for valid and malformed archives, waveform decoding, key matching, failed/cancelled installation preservation and idempotence; implement `src/services/voicePack*.ts` with bounded ZIP reads and staged publication; run focused tests.
3. Playback: write failing controller tests for installed audio without live model load, misses, multi-item sequences, cancellation and microphone locks. Implement lookup-first path in `speechController.ts`; run controller/import tests.
4. Settings: implement an existing-style card in `src/features/speech/VoicePackSettings.tsx`, add real import/preservation UI tests, then integrate Settings and update explanatory copy. Run focused tests.
5. Verify: full required tests, typecheck, build; real Chromium desktop/mobile import and playback, reload, Stop, malformed preservation, no console errors/overflow. Independent final code review and necessary fixes; verify complete actual deliverable, README and project handoff.

## Review focus

- Large archives must not be loaded completely into RAM.
- Corrupt, cancelled or quota-failed replacements must preserve installed audio and learner data.
- Late asynchronous lookup must never play after Stop/navigation/recording.
- Every static Listen composition, including slow chunk examples, must be covered.
- Pack import must not depend on model/network availability, and real data files must match the shipped importer.

## Progress

- Repository initially clean on `mainbranch`; changes isolated on `codex/heart-voice-pack`.
- Shared generator/importer contract agreed before parallel work; no conflicting file ownership.
- User explicitly delegated implementation choices and requested complete deliverable; no extra approval round or publishing action.
- Core storage/playback/UI tests exercised RED→GREEN; initial whole suite 139/139, typecheck and build passed before review fixes.
- Independent review: four Important findings. Fixed interrupted-import recovery with cross-tab Web Locks, byte-bounded batching without decode allocation, missing vocabulary extraction, and actual quota/publication-failure coverage. Recovery and batching tests observed RED then GREEN. ZIP overlap/ZIP64 validation also strengthened with a failing regression test.
- Browser plugin unavailable; real headless Chrome used. Real generated 36-clip subset imported at 1440×1000 and 390×844, survived reload, played with zero Heart workers or external requests, Stop worked, invalid ZIP preserved installation, memo/microphone recording/unsaved settings preserved, no overflow or console errors. Full-archive browser validation pending generation.
- Ruling: genuine pinned-model FP32 inference allowed alongside initial q8 clips to reduce generation time; voice, immutable model revision, text, rate and content keys stay identical. Per-clip dtype/provenance recorded. No inference is delegated to an external service.
- Generator review fixed ten missing vocabulary-to-phrase keys and added checksum verification for reusable sentence WAVs. Inventory frozen at 4,076 requests. Local OpenVINO CPU preserves actual Kokoro phonemes, IDs, style and speed; CPU cache capacity 64 holds memory stable. JS generator/IPC tests 8/8 and independent Python packaging checks 3/3 passed.
- Additional interruption audit found that closing a tab after publication but before retiring the previous bank could orphan old audio. A durable cleanup marker is now committed with the new active pointer. Regression observed RED (two banks remained after retry) → GREEN (one active bank and metadata record remain); storage/playback/Settings focused suite 23/23 passed. Final whole suite/build must include this fix.
- Settings preview wording now reads “Preview Heart” consistently with saved-audio playback; existing no-download preference test retained.
