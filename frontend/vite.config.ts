import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://backend:3000',
      '/ws': {
        target: 'ws://backend:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
});
