import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      'n8n-workflow': path.resolve(__dirname, 'tests/__mocks__/n8n-workflow.ts'),
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});