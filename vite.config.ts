import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import netlify from '@netlify/vite-plugin-netlify';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    netlify()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));