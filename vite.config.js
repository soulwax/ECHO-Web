// File: vite.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Listen on all interfaces
        port: 3001,
        allowedHosts: ['echo.soulwax.dev', 'localhost', 'isobel.battlecry.tech', 'isobel.soulwax.dev'],
        proxy: {
            '/api': {
                target: process.env.VITE_AUTH_API_URL || 'http://localhost:3003',
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: '0.0.0.0', // Listen on all interfaces for production
        port: 3001,
    },
});
