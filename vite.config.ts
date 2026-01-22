import { defineConfig, build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

/**
 * Custom plugin to copy manifest.json and build content script separately.
 */
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension-plugin',
    async closeBundle() {
      // Copy manifest.json to dist
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist', 'manifest.json')
      );
      console.log('✓ Copied manifest.json to dist/');

      // Build content script as IIFE (must be self-contained, no imports)
      console.log('Building content script as IIFE...');
      await build({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          lib: {
            entry: resolve(__dirname, 'src/content/contentScript.ts'),
            name: 'contentScript',
            formats: ['iife'],
            fileName: () => 'contentScript.js',
          },
          rollupOptions: {
            output: {
              // No external dependencies - bundle everything inline
              inlineDynamicImports: true,
            },
          },
          minify: true,
          sourcemap: false,
        },
      });
      console.log('✓ Built content script as IIFE');
    },
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        serviceWorker: resolve(__dirname, 'src/background/serviceWorker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'serviceWorker') {
            return 'serviceWorker.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    modulePreload: false,
  },
});
