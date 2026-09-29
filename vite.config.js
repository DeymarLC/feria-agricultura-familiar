import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En desarrollo el frontend llama a /api y Vite lo enruta al backend.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})