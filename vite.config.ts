import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({ base: command === 'build' ? '/EnglishlearningWeb/' : '/', plugins: [react(), tailwindcss()], test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' } }))
