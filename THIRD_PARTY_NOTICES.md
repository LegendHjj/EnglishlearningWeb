# Heart voice third-party notices

Heart speech uses `kokoro-js` 1.2.1, `@huggingface/transformers` 3.5.1, and `phonemizer` 1.2.1 under Apache-2.0 licences. Their full licence texts are copied into the production build's `heart-runtime/` directory. The production build bundles the executable JavaScript and local WebAssembly runtime from those pinned packages.

The `af_heart` voice and q8 model are fetched from the public [`onnx-community/Kokoro-82M-v1.0-ONNX`](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) repository at revision `1939ad2a8e416c0acfeecc08a694d14ef25f2231` after an explicit preview or Listen action. The source model is [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M). Model and voice files are cached by the browser when available and are excluded from user backups.
