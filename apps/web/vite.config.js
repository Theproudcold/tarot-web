import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, globalThis.process?.cwd?.() || '.', '');
  const basePath = env.VITE_BASE_PATH || '/';
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const apiPort = env.PORT || '8787';
  const devApiTarget = env.VITE_DEV_API_TARGET || `http://localhost:${apiPort}`;

  return {
    root: __dirname,
    plugins: [react()],
    base: normalizedBasePath,
    build: {
      outDir: resolve(__dirname, '../../dist'),
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/api': devApiTarget,
        '/health': devApiTarget,
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: resolve(__dirname, 'src/test/setup.js'),
      include: [
        'src/**/*.test.{js,jsx}',
        '../api/server/**/*.test.js',
      ],
      exclude: [...configDefaults.exclude, '**/.worktrees/**'],
      pool: 'forks',
    },
  };
});
