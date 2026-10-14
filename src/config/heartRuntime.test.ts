// @vitest-environment node
import { expect, test } from 'vitest'
import { createServer } from 'vite'

test('Heart runtime module can load through the Vite development server', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true } })
  try {
    const { heartRuntimePaths } = await server.ssrLoadModule('/src/services/heartRuntime.ts')
    const runtime = await server.transformRequest(heartRuntimePaths.mjs)
    expect(runtime?.code).toContain('export default')
    expect(heartRuntimePaths.wasm).toMatch(/\.wasm$/)
  } finally {
    await server.close()
  }
}, 30000)
