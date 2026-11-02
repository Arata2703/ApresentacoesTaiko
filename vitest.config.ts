import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
        thresholds: {
          statements: 90,
          lines: 90,
          functions: 90,
          branches: 85,
          perFile: true,
          'src/domain/**': {
            statements: 100,
            lines: 100,
            functions: 100,
            branches: 100,
          },
        },
      },
    },
  }),
)
