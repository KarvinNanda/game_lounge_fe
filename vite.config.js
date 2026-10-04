import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // VITE_API_URL is baked into the bundle at build time. Without it the app
  // silently falls back to localhost, so fail the production build instead.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build' && mode === 'production' && !env.VITE_API_URL) {
    throw new Error(
      'VITE_API_URL is required for production build (set it as a build arg / Coolify Build Variable)',
    )
  }

  return {
    plugins: [
      vue(),
      // vueDevTools causes startup errors in the vitest environment —
      // only load it during normal dev/build.
      mode !== 'test' && vueDevTools(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/**/*.spec.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{js,vue}'],
        exclude: ['src/main.js', 'src/assets/**'],
      },
    },
  }
})
