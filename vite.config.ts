/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': a new version waits until the user chooses to reload, so an
      // update can never wipe clips they are in the middle of editing.
      registerType: 'prompt',
      injectRegister: false, // registered by hand in src/main.tsx
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Cutmark',
        short_name: 'Cutmark',
        description: 'Cut, split, trim and time-mark audio in your browser. Works offline. Nothing is uploaded.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f5f0e6',
        theme_color: '#f5f0e6',
        categories: ['music', 'utilities', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        clientsClaim: true,
        // App shell only. The 32 MB FFmpeg core is cached on demand (see runtimeCaching),
        // so a first visit does not download it unless the person opens the editor.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}', 'icon-192.png', 'apple-touch-icon.png'],
        globIgnores: ['ffmpeg/**'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/_vercel\//, /^\/ffmpeg\//],
        runtimeCaching: [
          {
            urlPattern: ({url}) => url.pathname.startsWith('/ffmpeg/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cutmark-engine',
              cacheableResponse: {statuses: [200]},
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    // ffmpeg.wasm spawns its own worker; pre-bundling breaks the worker URL.
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          wavesurfer: ['wavesurfer.js'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
  },
});
