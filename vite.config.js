// File: vite.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Listen on all interfaces
        port: 3123,
        allowedHosts: ['echo.soulwax.dev', 'localhost', 'isobel.battlecry.tech'],
        proxy: {
            '/api/auth': {
                target: process.env.VITE_AUTH_API_URL || 'http://localhost:3001',
                changeOrigin: true,
            },
            '/api/guilds': {
                target: process.env.VITE_AUTH_API_URL || 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: '0.0.0.0', // Listen on all interfaces for production
        port: 3123,
    },
});
