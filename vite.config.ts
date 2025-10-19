import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 配置 vite-plugin-html，只针对主入口 index.html 注入变量
    createHtmlPlugin({
      minify: true,
      entry: resolve(__dirname, 'src/main.ts'), // 指定你的 JS 入口
      inject: {
        data: {
          title: 'CiRemote Frontend',
          // 其他注入的 EJS 模板变量
        }
      }
    }),
    // 配置 vite-plugin-pwa
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'CiRemote Frontend',
        short_name: 'CiRemote',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
      // 根据需要配置 Workbox 缓存策略
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    // 只设置一个 Rollup 入口
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})