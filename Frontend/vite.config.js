import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://chatgpt-bfup.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://chatgpt-bfup.onrender.com',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
