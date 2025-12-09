import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Photo-Manger/',  // GitHub Pages repository path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.test.js']
    }
  }
});
