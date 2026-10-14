import mjs from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url'
import wasm from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url'

// These executable assets must go through Vite's asset graph. Dynamic imports
// of JavaScript in public/ are rejected by the development server.
export const heartRuntimePaths = { mjs, wasm }
