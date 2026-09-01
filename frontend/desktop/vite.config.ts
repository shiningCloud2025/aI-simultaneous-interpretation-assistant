import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    // 注意：平台端 web 占用 5173，桌面端必须错开，否则 Electron dev 模式
    // 会竞态加载到平台端页面（IPv4/IPv6 双栈下 strictPort 也拦不住）。
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
