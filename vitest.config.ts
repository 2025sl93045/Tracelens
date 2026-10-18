import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Resolve the shared workspace package to its source so tests don't require a
// prior build step. (At build/typecheck time it resolves to dist as usual.)
export default defineConfig({
  resolve: {
    alias: {
      '@tracelens/shared': resolve(import.meta.dirname, 'packages/shared/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.{ts,tsx}'],
  },
});
