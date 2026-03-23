import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Minha Nutricionista',
        short_name: 'NutriApp',
        theme_color: '#1D9E75',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          { urlPattern: /\/api\/nutricao\/meu-plano/, handler: 'NetworkFirst', options: { cacheName: 'plano-cache' } }
        ]
      }
    })
  ],
  server: { port: 5174, proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } } }
})
