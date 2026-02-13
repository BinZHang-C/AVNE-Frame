import { createVideoOperation, normalizeBody } from '../server/videoApi';

type CreateBody = {
  prompt?: string;
  durationSeconds?: number;
  apiKey?: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = normalizeBody<CreateBody>(req.body);
  const prompt = body.prompt?.trim();
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || body.apiKey?.trim();
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing Gemini API key on server and request body' });
  }

  try {
    const { operationName } = await createVideoOperation(apiKey, prompt, body.durationSeconds || 5);
    return res.status(200).json({ operationName });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Unknown API error' });
  }
}
