import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // `npm run watch` cleans once before starting two Vite watchers. Development
    // rebuilds must keep the other watcher's files (especially content_script.js).
    emptyOutDir: mode !== 'development',
    sourcemap: mode === 'production' ? true : 'inline',
    minify: mode === 'production' ? 'terser' : false,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, 'src/background.ts'),
        options: path.resolve(__dirname, 'src/Pages/options/options.tsx'),
        changelog: path.resolve(__dirname, 'src/Pages/changelog/changelog.tsx'),
      },
      output: {
        format: 'es',
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((n) => n.endsWith('.css'))) {
            return 'styles/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
  plugins: [react()],
}));
