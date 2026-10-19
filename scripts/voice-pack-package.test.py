"""Independent archive construction checks using tiny real PCM fixtures."""
import hashlib
import importlib.util
import json
import pathlib
import tempfile
import unittest
import wave
import zipfile

spec = importlib.util.spec_from_file_location('packager', pathlib.Path(__file__).with_name('voice-pack-package.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PackagerTests(unittest.TestCase):
    def fixture(self, folder):
        folder = pathlib.Path(folder)
        (folder / 'audio').mkdir()
        (folder / 'content').mkdir()
        revision = '1939ad2a8e416c0acfeecc08a694d14ef25f2231'
        identity = json.dumps(['af_heart', revision, 1, 'Hello.'], separators=(',', ':'))
        key = hashlib.sha256(identity.encode()).hexdigest()
        filename = folder / 'audio' / (key + '.wav')
        with wave.open(str(filename), 'wb') as audio:
            audio.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
            audio.writeframes(b'\x00\x00\x00\x40\x00\xc0')
        data = filename.read_bytes()
        clip = dict(key=key, text='Hello.', rate=1, file='audio/' + key + '.wav', bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), samples=3)
        (folder / 'manifest.json').write_text(json.dumps(dict(app='fluency-reset-voice-pack', version=1, id='fixture', name='Fixture', voice='af_heart', model='onnx-community/Kokoro-82M-v1.0-ONNX', revision=revision, createdAt='2026-10-19T00:00:00.000Z', clips=[clip])), encoding='utf-8')
        (folder / 'coverage.json').write_text(json.dumps(dict(requests=[dict(key=key, text='Hello.', rate=1)])), encoding='utf-8')
        return filename

    def test_archive_contains_verified_pcm_without_descriptors_or_compression(self):
        with tempfile.TemporaryDirectory() as folder:
            filename = self.fixture(folder)
            module.package(folder)
            archive_path = pathlib.Path(folder) / 'Heart-complete-practice-library.zip'
            with zipfile.ZipFile(archive_path) as archive:
                self.assertEqual(archive.read('audio/' + filename.name), filename.read_bytes())
                self.assertTrue(all(item.compress_type == 0 and not item.flag_bits & 9 for item in archive.infolist()))
                self.assertIn('manifest.json', archive.namelist())
                self.assertIsNone(archive.testzip())
            expected = hashlib.sha256(archive_path.read_bytes()).hexdigest()
            self.assertEqual((pathlib.Path(folder) / 'SHA256SUMS.txt').read_text().split()[0], expected)

    def test_missing_coverage_prevents_publishing_final_archive(self):
        with tempfile.TemporaryDirectory() as folder:
            self.fixture(folder)
            (pathlib.Path(folder) / 'coverage.json').write_text(json.dumps(dict(requests=[])), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Incomplete coverage'):
                module.package(folder)
            self.assertFalse((pathlib.Path(folder) / 'Heart-complete-practice-library.zip').exists())

    def test_corrupted_audio_prevents_publishing_final_archive(self):
        with tempfile.TemporaryDirectory() as folder:
            filename = self.fixture(folder)
            filename.write_bytes(filename.read_bytes()[:-2])
            with self.assertRaisesRegex(ValueError, 'Corrupted WAV'):
                module.package(folder)
            self.assertFalse((pathlib.Path(folder) / 'Heart-complete-practice-library.zip').exists())


if __name__ == '__main__':
    unittest.main()
