import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    hmr: false
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['adsmetal_logo.jpg', 'icon.svg'],
      manifest: {
        id: '/',
        name: 'ADS Takip',
        short_name: 'ADSTakip',
        description: 'ADS Metal İş Sağlığı ve Güvenliği ile Görev Takip Uygulaması',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/adsmetal_logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any',
          },
          {
            src: '/adsmetal_logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any',
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lucide') || id.includes('recharts') || id.includes('motion')) return 'ui-vendor';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})
