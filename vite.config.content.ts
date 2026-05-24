import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  publicDir: false, // Don't overwrite the public directory files
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear what the main build generated
    sourcemap: mode === 'production' ? true : 'inline',
    rollupOptions: {
      input: {
        content_script: path.resolve(__dirname, 'src/contentScripts/content_script.ts'),
      },
      output: {
        format: 'iife', // Compile as a single script that Chrome can run natively
        entryFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((n) => n.endsWith('.css'))) {
            return 'styles/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
}));
