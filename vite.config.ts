/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const testDir = fileURLToPath(new URL('./test', import.meta.url));

const APP_ENV_KEYS = [
  'BackendUrl',
  'NODE_ENV',
  'SCS_HOST',
  'SCS_PORT',
  'SOCKETCLUSTER_SECURE',
  'GoogleClientId',
] as const;


function replaceProcessEnv(env: Record<string, string>): Plugin {
  return {
    name: 'replace-process-env',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(t|j)sx?$/.test(id)) return null;
      let out = code;
      for (const key of APP_ENV_KEYS) {
        const re = new RegExp(`process\\.env\\.${key}\\b`, 'g');
        out = out.replace(re, JSON.stringify(env[key] ?? ''));
      }
      return out === code ? null : { code: out, map: null };
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const env: Record<string, string> = { ...loadEnv(mode, process.cwd(), ''), NODE_ENV: mode };
  const isTest = mode === 'test' || process.env.VITEST;
  // `vitest/config` is a devDependency — import it lazily so a production
  // build (npm install --omit=dev) never tries to resolve it.
  const testExclude = isTest
    ? [...(await import('vitest/config')).configDefaults.exclude]
    : [];
  return {
    plugins: [
      ...(isTest ? [] : [replaceProcessEnv(env)]),
      react(),
    ],
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

