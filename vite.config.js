import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  css: {
    // Make SCSS variables/mixins available globally in every .scss file
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/themes/_mixins.scss" as *;`,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});