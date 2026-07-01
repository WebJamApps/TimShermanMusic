/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const testDir = fileURLToPath(new URL('./test', import.meta.url));

export default defineConfig(async ({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST;
  // `vitest/config` is a devDependency — import it lazily so a production
  // build (npm install --omit=dev) never tries to resolve it.
  const testExclude = isTest
    ? [...(await import('vitest/config')).configDefaults.exclude]
    : [];
  return {
    plugins: [react()],
    server: {
      port: Number(process.env.PORT) || 7879,
    },
    resolve: {
      alias: {
        src: srcDir,
        test: testDir,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./test/vitest.setup.ts'],
      css: false,
      mockReset: true,
      testTimeout: 40000,
      include: ['test/**/*.{test,spec}.{ts,tsx}'],
      exclude: testExclude,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/Main.tsx'],
        // CI gate: `npm test` (which runs vitest with --coverage) fails when
        // total coverage drops below these floors.
        thresholds: {
          statements: 90,
          lines: 90,
          branches: 80,
          functions: 80,
        },
      },
    },
  } as any;
});
