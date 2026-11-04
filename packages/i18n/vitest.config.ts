import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'i18n',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
