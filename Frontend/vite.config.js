import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  base: '/', // Important for Render
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
})