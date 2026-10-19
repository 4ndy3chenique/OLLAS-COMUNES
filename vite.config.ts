/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA: solo se precachean los estáticos (shell). Las respuestas de /api NUNCA se guardan en caché
// (datos personales, Ley N.° 29733; los dispositivos pueden ser compartidos).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ollas Comunes',
        short_name: 'Ollas',
        description: 'Plataforma del Solicitante para empadronar y dar seguimiento a tu olla común.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        theme_color: '#1F4D3F',
        background_color: '#FAF8F3',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.hostname.endsWith('.azurewebsites.net'), handler: 'NetworkOnly' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Si usas JavaScript puro, cámbialo a ./src/setupTests.js
    css: false, // Deshabilita el procesamiento de CSS durante las pruebas para que corran mucho más rápido
    // Valor fijo para las pruebas: ninguna prueba llama a la API real (fetch siempre va mockeado).
    // También cubre el CI, donde no existe un archivo .env.
    env: {
      VITE_API_BASE_URL: 'http://api.local/api',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/setupTests.ts', 'src/vite-env.d.ts', 'src/__tests__/**'],
    },
  },
})