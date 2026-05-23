import Fastify from 'fastify';
import cors from '@fastify/cors';
import { buildCorsOptions } from './http/cors.js';
import { registerConnectionTestRoutes } from './routes/connectionTest.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerReadingRoutes } from './routes/reading.js';
import { registerStaticRoutes } from './static/staticApp.js';

export const createApiServer = ({ logger = true, serveStatic = false, staticOptions = {} } = {}) => {
  const app = Fastify({
    bodyLimit: 1024 * 1024,
    logger,
  });

  app.register(cors, buildCorsOptions());
  const staticApp = serveStatic ? registerStaticRoutes(app, staticOptions) : false;

  registerHealthRoutes(app, { staticApp });
  registerConnectionTestRoutes(app);
  registerReadingRoutes(app);

  return app;
};
