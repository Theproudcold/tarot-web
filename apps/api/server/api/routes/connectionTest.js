import { testReadingProviderConnection } from '../../ai/orchestrator.js';
import { validateConnectionTestRequest } from '../http/body.js';

export const registerConnectionTestRoutes = (app) => {
  app.post('/api/connection-test', async (request, reply) => {
    try {
      const payload = validateConnectionTestRequest(request.body);
      return await testReadingProviderConnection(payload);
    } catch (error) {
      reply.code(400);
      return { error: error.message || 'Connection test failed' };
    }
  });
};
