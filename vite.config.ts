/// <reference types='vitest' />
import path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: 'node_modules/.vite/http-lib',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [tsconfigPaths(), react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'httpLib',
      fileName: (format) => `libs.${format}.js`,
      formats: ['es', 'umd']
    },
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    rollupOptions: {
      external: ['axios', 'ky', 'superagent', 'zod'],
      output: {
        globals: {
          axios: 'axios',
          ky: 'ky',
          superagent: 'superagent',
          zod: 'zod'
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: ['**/__tests__/**', '**/*.spec.ts', '**/*.test.ts'],
    },
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}', '**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    setupFiles: ['vitest.setup.ts'],
    passWithNoTests: true,
  },
}));
