import { defineConfig } from 'vite'
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
})
