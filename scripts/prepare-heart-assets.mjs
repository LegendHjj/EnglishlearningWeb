import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const versions = { 'kokoro-js': '1.2.1', '@huggingface/transformers': '3.5.1', 'phonemizer': '1.2.1' }
for (const [name, expected] of Object.entries(versions)) {
  const pkg = JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8'))
  if (pkg.version !== expected) throw new Error(`Heart runtime expected ${name}@${expected}; found ${pkg.version}.`)
}
const source = join(root, 'node_modules', '@huggingface', 'transformers', 'dist')
const target = join(root, 'public', 'heart-runtime')
await mkdir(target, { recursive: true })
for (const file of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) {
  await copyFile(join(source, file), join(target, file))
}
for (const name of ['kokoro-js', '@huggingface/transformers', 'phonemizer']) {
  await copyFile(join(root, 'node_modules', name, 'LICENSE'), join(target, `${name.replaceAll('/', '-')}-LICENSE.txt`))
}
console.log('Prepared pinned Heart WebAssembly runtime assets.')
