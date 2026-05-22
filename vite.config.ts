import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/ws': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    host: true,
    proxy: {
      '/ws': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
})
