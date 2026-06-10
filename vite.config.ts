import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // This project lives in a Dropbox-synced folder. Dropbox locks files while
  // syncing, which breaks Vite's dep-optimizer cache writes (endless
  // "504 Outdated Optimize Dep"). Keeping the cache in the OS temp dir
  // sidesteps that entirely.
  cacheDir: path.join(os.tmpdir(), 'mathmon-vite-cache'),
  // Pre-bundle Phaser at server start so the first page load never races
  // the dep optimizer.
  optimizeDeps: {
    include: ['phaser'],
  },
  build: {
    chunkSizeWarningLimit: 2200,
  },
  server: {
    port: 5173,
    open: false,
  },
});
