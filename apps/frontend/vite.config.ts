import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        // 由 vite-plugin-electron 自动启动 Electron（最简方案）
        // vite 启动后会等 main.ts 编译完成，再 spawn 一个 Electron 进程加载 dist-electron/main.js
        // 这样只有一个 Electron 窗口，不会双开
      },
      vite: {
        build: {
          outDir: 'dist-electron',
          rollupOptions: {
            external: ['electron'],
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    // 代理 /api/v1/* 到后端 8000 端口
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // WebSocket 代理（后续实时事件推送用）
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'echarts-vendor': ['echarts', 'echarts-for-react'],
          'tanstack-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
