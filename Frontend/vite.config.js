import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  base: '/', // Important for Render
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4002', // Backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
})