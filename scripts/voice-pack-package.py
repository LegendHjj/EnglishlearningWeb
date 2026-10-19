"""Validate every completed Heart clip and create a standard stored ZIP archive."""
import hashlib
import atexit
import ctypes
import json
import pathlib
import shutil
import struct
import sys
import wave
import zipfile


def package(folder):
    folder = pathlib.Path(folder).resolve()
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    coverage = json.loads((folder / 'coverage.json').read_text(encoding='utf-8'))
    requests = {item['key']: item for item in coverage['requests']}
    clips = {item['key']: item for item in manifest['clips']}
    if len(clips) != len(manifest['clips']) or set(clips) != set(requests):
        raise ValueError(f'Incomplete coverage: {len(clips)}/{len(requests)}')
    total_samples = total_bytes = 0
    for key, clip in clips.items():
        request = requests[key]
        canonical = ' '.join(request['text'].split())
        identity = json.dumps(['af_heart', manifest['revision'], request['rate'], canonical], ensure_ascii=False, separators=(',', ':'))
        if hashlib.sha256(identity.encode()).hexdigest() != key:
            raise ValueError(f'Wrong key: {key}')
        if clip['text'] != canonical or clip['rate'] != request['rate'] or clip['file'] != f'audio/{key}.wav':
            raise ValueError(f'Wrong request metadata: {key}')
        filename = folder / clip['file']
        data = filename.read_bytes()
        if len(data) != clip['bytes'] or hashlib.sha256(data).hexdigest() != clip['sha256']:
            raise ValueError(f'Corrupted WAV: {key}')
        if data[:4] != b'RIFF' or len(data) < 46 or struct.unpack_from('<I', data, 4)[0] != len(data) - 8:
            raise ValueError(f'Invalid RIFF size: {key}')
        with wave.open(str(filename), 'rb') as audio:
            if (audio.getnchannels(), audio.getsampwidth(), audio.getframerate(), audio.getnframes()) != (1, 2, 24000, clip['samples']):
                raise ValueError(f'Wrong WAV format: {key}')
            pcm = audio.readframes(audio.getnframes())
            if not pcm or not any(pcm):
                raise ValueError(f'Empty or silent WAV: {key}')
        total_samples += clip['samples']
        total_bytes += clip['bytes']
    dtype_counts = {}
    backend_counts = {}
    for clip in clips.values():
        dtype = clip.get('dtype', 'q8')
        dtype_counts[dtype] = dtype_counts.get(dtype, 0) + 1
        backend = clip.get('backend', 'native onnxruntime-node CPU')
        backend_counts[backend] = backend_counts.get(backend, 0) + 1
    summary = {'clips': len(clips), 'requests': len(requests), 'audioSeconds': round(total_samples / 24000, 3), 'audioBytes': total_bytes, 'coverageComplete': True, 'modelPrecisions': dtype_counts, 'backends': backend_counts}
    (folder / 'validation.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    readme = f'''# Heart complete practice library

This pack contains {len(clips):,} prerecorded Heart text/rate clips covering the built-in practice library and all three optional content packs. Audio is PCM16 mono WAV at 24,000 Hz. Total playback time including alternate-speed clips: {total_samples / 24000 / 3600:.2f} hours.

## Use in Fluency Reset

1. In Settings, import Heart-complete-practice-library.zip using the Heart voice pack control.
2. Select Natural Female · Heart. Matching Listen requests play imported audio immediately on this device.
3. For optional lesson content, import the three separate JSON files beside this archive using Optional practice packs. The voice archive supplies audio; it does not automatically add lesson content.

Personal text you write or edit is not included. Such text continues through the app's existing local voice generation or browser fallback. Audio packs and recordings remain local to the browser/device; browser storage limits still apply.

## Files and reproducibility

- manifest.json: complete portable clip identity, source model, bytes, sample counts and SHA-256 hashes.
- coverage.json: every text/rate request with source references, deduplicated by the exact importer identity.
- validation.json: final independent WAV, checksum and coverage validation.
- content/*.json and the three adjacent JSON files: optional practice content, unchanged from this repository.
- audio/: individual clips; the stored ZIP contains the same complete files.
- segments/: resumable intermediate sentence audio, not required for import.
- model-cache/: pinned public model/tokenizer resources, not required for importing prerecorded audio.

Generation ran locally with kokoro-js 1.2.1 and Transformers.js 3.5.1. CPU backend clip counts: {json.dumps(backend_counts)}. The optional OpenVINO CPU adapter executes the same unmodified pinned ONNX model with identical local phonemizer, tokenizer, Heart style vectors and speed inputs. Voice: af_heart. Model precision clip counts: {json.dumps(dtype_counts)} (initial q8 calibration; faster fp32 for remaining generation). Model: {manifest['model']}. Immutable revision: {manifest['revision']}.

Long requests are split into complete ordered sentences/pieces with truncation disabled and a 512-token guard. Exact repeated sentence segments are reused. Alternate slow chunk examples are actually generated at speed 0.8; normal clips use speed 1.0.

Resume from the project: node scripts/voice-pack-generate.mjs "{folder}" --openvino
Omit --openvino to use native ONNX Runtime when the optional local OpenVINO runtime is unavailable.
HEART_PYTHON optionally selects the Python executable for validation/packaging. HEART_OPENVINO_PYTHON optionally selects a separate compatible interpreter for the local OpenVINO adapter; it defaults to HEART_PYTHON. HEART_THREADS defaults to 3. The OpenVINO worker holds a process-scoped Windows idle-sleep request while active and releases it on exit; display sleep and global power settings are unchanged.
Package/validate: python scripts/voice-pack-package.py "{folder}"

Generation code and libraries retain their respective licences; see licences/ and THIRD_PARTY_NOTICES.md. The source lesson content remains the user's existing practice material. No paid service or external AI inference was used.
'''
    (folder / 'README.md').write_text(readme, encoding='utf-8')
    repo = pathlib.Path(__file__).resolve().parent.parent
    notices = repo / 'THIRD_PARTY_NOTICES.md'
    shutil.copyfile(notices, folder / notices.name)
    licences = folder / 'licences'
    licences.mkdir(exist_ok=True)
    for package_name in ['kokoro-js', '@huggingface/transformers', 'phonemizer', 'onnxruntime-node']:
        source = repo / 'node_modules' / package_name / 'LICENSE'
        if source.exists():
            shutil.copyfile(source, licences / (package_name.replace('/', '-').replace('@', '') + '-LICENSE.txt'))
    target = folder / 'Heart-complete-practice-library.zip'
    selected = [folder / 'manifest.json', folder / 'coverage.json', folder / 'validation.json', folder / 'README.md', folder / 'THIRD_PARTY_NOTICES.md']
    if (folder / 'generation-provenance.json').exists():
        selected.append(folder / 'generation-provenance.json')
    selected += sorted((folder / 'content').glob('*.json')) + sorted(licences.glob('*'))
    selected += [folder / clip['file'] for clip in manifest['clips']]
    if sum(p.stat().st_size + len(p.name) * 2 + 200 for p in selected) >= 2 ** 31:
        raise ValueError('Pack exceeds supported 2GiB archive limit')
    temporary = target.with_suffix('.zip.tmp')
    with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_STORED, allowZip64=False) as archive:
        for filename in selected:
            archive.write(filename, filename.relative_to(folder).as_posix())
    with zipfile.ZipFile(temporary) as archive:
        if any(item.compress_type != 0 or item.flag_bits & 1 for item in archive.infolist()) or archive.testzip() is not None:
            raise ValueError('Invalid stored ZIP')
    temporary.replace(target)
    with target.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    (folder / 'SHA256SUMS.txt').write_text(f'{digest}  {target.name}\n', encoding='ascii')
    print(json.dumps({**summary, 'archive': str(target), 'archiveBytes': target.stat().st_size, 'sha256': digest}, indent=2), flush=True)


if __name__ == '__main__':
    if sys.platform == 'win32':
        ctypes.windll.kernel32.SetThreadExecutionState(ctypes.c_uint(0x80000001))
        atexit.register(lambda: ctypes.windll.kernel32.SetThreadExecutionState(ctypes.c_uint(0x80000000)))
    package(sys.argv[1] if len(sys.argv) > 1 else 'D:/Coding/Others/EnglishVoicePack')
