// File: vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import netlify from '@netlify/vite-plugin' // <--- 1. ADD THIS IMPORT

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    netlify() // <--- 2. ADD THE PLUGIN HERE
  ],
})