# Complete local Heart voice pack

User request: deliver the full pre-generated Heart sample library and the optional content JSON files in `D:\Coding\Others\EnglishVoicePack`, and let Settings import the audio for fast playback. The user delegated extraction and implementation choices. Work proceeds under that authorization without another design approval round. No hosting, backend, login, paid API, or learner-data upload.

## Deliverable

A resumable local generator extracts every static Listen input from bundled data and the three optional JSON packs, plus individual example/challenge lines and the existing vocabulary-to-phrase flow. It uses the pinned Kokoro model and af_heart voice locally, guards against tokenizer truncation, and saves nonempty 24 kHz mono PCM16 WAVs. Standard and existing slow chunk requests are covered. Deduplication uses canonical whitespace, text, voice, model revision and rate. A coverage inventory, portable JSON copies, usage instructions and a ZIP_STORED audio archive are saved outside the repository. Completed audio and intermediate sentence segments are checksum-verified before reuse. Q8 initial calibration and FP32 native/OpenVINO CPU inference use the same immutable model revision; backend/dtype provenance is retained. The OpenVINO CPU shape cache is bounded to keep the long job's memory stable.

## Portable format

ZIP version 1 has `manifest.json`, `audio/<key>.wav`, and optional content/documentation. Manifest identifies app `fluency-reset-voice-pack`, voice, pinned model/revision, and clips `{key,text,rate,file,bytes,sha256,samples}`. Key is SHA256 of UTF8 JSON `["af_heart",revision,rate,text.replace(/\s+/g," ").trim()]`. Audio checksum is SHA256 of complete WAV bytes. Only stored, unencrypted ZIP entries are accepted; ZIP64, duplicate paths, traversal, inconsistent offsets and oversize files are rejected. Limits: archive 2 GiB, 15,000 clips, manifest 32 MiB, each clip 32 MiB, canonical text 30,000 chars, rate 0.7–1.5, WAV PCM16 mono 24 kHz, finite samples.

## Import and persistence

Settings adds an Offline Heart audio card, ZIP selector, preview with count/size, explicit Import action, progress and clear errors. Import is audio only; companion JSONs use the existing merge importer. Existing voice selection and practice edits are preserved. Success offers a direct Use Heart action and explains how to add matching JSONs. Imported sample audio lives in a separate IndexedDB database, excluded from personal-recording backups and progress counts.

Read ZIP directory with Blob slices; validate manifest before writes, then validate/hash each WAV while staging batches bounded by 16 clips or 8 MiB (plus at most one clip). Waveform validation does not allocate decoded PCM during import. Publish the new installation only after every clip succeeds. Failed/cancelled imports preserve the previous installation and remove their staging rows. Web Locks serialize imports across tabs; a staging marker supports abandoned-import recovery on the next attempt. Import requires Web Locks rather than risking deletion of another tab's active staging. Reimport is idempotent. Full quota errors are actionable. Imports show device-local scope and site-data deletion behavior. No audio is embedded in LocalStorage.

## Playback

Shared speech controller tries installed audio before loading live Heart. Exact matching rate/text is required; sequences match their individual items. The installed WAV decoder produces Float32 PCM for the existing audio player. Stop, owner cleanup, microphone locks, browser fallback, stale-request protection and error handling remain authoritative. Stop after lookup or between clips must not start another clip. Missing clips or unavailable IndexedDB fall back to live Heart. Imported matches require no model download or worker.

## Verification

Tests exercise ZIP/manifest/checksum/WAV rejection, atomic installation, cancellation/quota, idempotence and real IndexedDB lookup; controller tests exercise cache-first no-worker playback, misses, sequences and cancellation; Settings tests verify real import. Required full tests, typecheck, build, desktop/mobile browser import/reload/play/Stop and preservation checks. Validate the actual full archive and report exact clip count, bytes and remaining limitations. Browser QA uses Playwright because the Browser plugin skill is not available.
