import { build } from 'vite';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 构建 electron 主进程
const mainConfig = defineConfig({
  root,
  build: {
    outDir: 'dist-electron',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(root, 'electron/main.ts'),
      output: {
        entryFileNames: 'main.js',
        format: 'es',
      },
      external: ['electron', 'path', 'url', 'zlib', 'module'],
    },
    minify: false,
    sourcemap: true,
  },
});

// 构建 preload 脚本
const preloadConfig = defineConfig({
  root,
  build: {
    outDir: 'dist-electron',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(root, 'electron/preload.ts'),
      output: {
        entryFileNames: 'preload.js',
        format: 'cjs',
      },
      external: ['electron'],
    },
    minify: false,
    sourcemap: true,
  },
});

await build(mainConfig);
await build(preloadConfig);
console.log('✅ Electron main + preload built successfully!');
