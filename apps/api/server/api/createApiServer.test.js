import { afterEach, describe, expect, it } from 'vitest';
import { createApiServer } from './createApiServer.js';

let app;

afterEach(async () => {
  if (app) {
    await app.close();
    app = null;
  }
});

describe('createApiServer', () => {
  it('serves health status', async () => {
    app = createApiServer({ logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true });
  });

  it('rejects malformed reading requests', async () => {
    app = createApiServer({ logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/api/reading',
      payload: { language: 'zh', cards: [] },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('cards');
  });

  it('can enable static mode without a build artifact', async () => {
    app = createApiServer({
      logger: false,
      serveStatic: true,
      staticOptions: { distDir: '/tmp/tarot-web-missing-dist' },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true, staticApp: false });
  });
});
