import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const env = globalThis.process?.env ?? {};
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../../..');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const getStaticContentType = (filePath) => mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';

const createStaticResolver = ({ distDir = resolve(projectRoot, env.STATIC_DIST_DIR || 'dist') } = {}) => {
  const distIndexPath = resolve(distDir, 'index.html');
  const canServeStatic = existsSync(distIndexPath);

  const resolveStaticFilePath = (pathname) => {
    const decodedPath = decodeURIComponent(pathname);
    const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
    const filePath = resolve(distDir, `.${relativePath}`);

    if (!filePath.startsWith(distDir)) {
      return null;
    }

    return filePath;
  };

  return {
    canServeStatic,
    distIndexPath,
    resolveStaticFilePath,
  };
};

const sendFile = async (request, reply, filePath) => {
  const fileStats = await stat(filePath);

  reply
    .header('Content-Type', getStaticContentType(filePath))
    .header('Content-Length', fileStats.size)
    .header('Cache-Control', filePath.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');

  if (request.method === 'HEAD') {
    return reply.send();
  }

  return reply.send(createReadStream(filePath));
};

export const registerStaticRoutes = (app, options = {}) => {
  const resolver = createStaticResolver(options);

  if (!resolver.canServeStatic) {
    return false;
  }

  app.route({
    method: ['GET', 'HEAD'],
    url: '/*',
    handler: async (request, reply) => {
      const pathname = new URL(request.raw.url || '/', 'http://localhost').pathname;

      if (pathname === '/health' || pathname.startsWith('/api/')) {
        reply.code(404);
        return { error: 'Not found' };
      }

      const directFilePath = resolver.resolveStaticFilePath(pathname);

      if (directFilePath) {
        try {
          const fileStats = await stat(directFilePath);
          if (fileStats.isFile()) {
            return sendFile(request, reply, directFilePath);
          }
        } catch {
          // fall through to SPA fallback
        }
      }

      if (extname(pathname)) {
        reply.code(404);
        return { error: 'Not found' };
      }

      return sendFile(request, reply, resolver.distIndexPath);
    },
  });

  return true;
};
