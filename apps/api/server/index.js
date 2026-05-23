import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiServer } from './api/createApiServer.js';

const env = globalThis.process?.env ?? {};
const PORT = Number(env.PORT || 8787);

export const createTarotServer = (options = {}) => createApiServer(options);

export const startServer = async () => {
  const app = createTarotServer({ serveStatic: true });

  await app.listen({
    port: PORT,
    host: env.HOST || '0.0.0.0',
  });

  console.log(`Tarot AI API listening on http://localhost:${PORT}`);
  return app;
};

const argv = globalThis.process?.argv || [];
const isMainModule = argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  await startServer();
}
