import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createVideoOperation, getVideoOperationStatus } from './server/videoApi';

const readJsonBody = async (req: any): Promise<any> => {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve());
    req.on('error', reject);
  });

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const sendJson = (res: any, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const localApiPlugin = (env: Record<string, string>): Plugin => ({
  name: 'local-api-video-routes',
  configureServer(server) {
    server.middlewares.use('/api/video-create', async (req, res, next) => {
      if (req.method !== 'POST') return next();

      const body = await readJsonBody(req);
      const prompt = body?.prompt?.trim();
      if (!prompt) return sendJson(res, 400, { error: 'Missing prompt' });

      const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || body?.apiKey?.trim();
      if (!apiKey) return sendJson(res, 400, { error: 'Missing Gemini API key on server and request body' });

      try {
        const result = await createVideoOperation(apiKey, prompt, body?.durationSeconds || 5);
        return sendJson(res, 200, result);
      } catch (error) {
        return sendJson(res, 502, { error: error instanceof Error ? error.message : 'Unknown API error' });
      }
    });

    server.middlewares.use('/api/video-status', async (req, res, next) => {
      if (req.method !== 'POST') return next();

      const body = await readJsonBody(req);
      const operationName = body?.operationName?.trim();
      if (!operationName) return sendJson(res, 400, { error: 'Missing operationName' });

      const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || body?.apiKey?.trim();
      if (!apiKey) return sendJson(res, 400, { error: 'Missing Gemini API key on server and request body' });

      try {
        const result = await getVideoOperationStatus(apiKey, operationName);
        return sendJson(res, 200, result);
      } catch (error) {
        return sendJson(res, 502, { error: error instanceof Error ? error.message : 'Unknown API error' });
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), localApiPlugin(env)],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
