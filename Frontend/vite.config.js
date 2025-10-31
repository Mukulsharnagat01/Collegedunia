import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  base: '/', // Important for Render
  server: {
    proxy: {
      '/api': {
        target: 'https://collegedunia-o5i9.onrender.com', // Backend URL
        changeOrigin: true,
        secure: true, // Required for HTTPS
        rewrite: (path) => path, // Optional
      },
    },
  },
})