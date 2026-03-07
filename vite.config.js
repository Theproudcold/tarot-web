import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, globalThis.process?.cwd?.() || '.', '');
  const basePath = env.VITE_BASE_PATH || '/';
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const apiPort = env.PORT || '8787';
  const devApiTarget = env.VITE_DEV_API_TARGET || `http://localhost:${apiPort}`;

  return {
    plugins: [react()],
    base: normalizedBasePath,
    server: {
      proxy: {
        '/api': devApiTarget,
        '/health': devApiTarget,
      },
    },
  };
});
