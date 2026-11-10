import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { copyFileSync } from 'node:fs';

// GitHub Pages 项目页挂在子路径（如 /yfcheadquarters/）下，且不支持 SPA 深链兜底。
// 1) base 用相对路径，保证 /assets/* 在任何子路径下都能加载；
// 2) 构建后把 index.html 复制成 404.html，让未知路由也回退到 SPA。
const copyIndexTo404 = {
  name: 'copy-index-to-404',
  apply: 'build' as const,
  closeBundle() {
    const dir = fileURLToPath(new URL('.', import.meta.url));
    const dist = dir + 'dist/';
    try {
      copyFileSync(dist + 'index.html', dist + '404.html');
      console.log('[vite] copied index.html -> 404.html (SPA fallback for GitHub Pages)');
    } catch (e) {
      console.warn('[vite] could not copy 404.html:', e);
    }
  },
};

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'YFC 任务台',
        short_name: 'YFC',
        description: 'YFC 团队内部协作与任务系统',
        theme_color: '#E5484D',
        background_color: '#F9FAFB',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    copyIndexTo404,
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
