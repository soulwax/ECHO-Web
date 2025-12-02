import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3123,
    allowedHosts: ['echo.soulwax.dev'],
    proxy: {
      '/api/auth': {
        target: process.env.VITE_AUTH_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
