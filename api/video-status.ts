import { getVideoOperationStatus, normalizeBody } from '../server/videoApi';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = normalizeBody<{ operationName?: string; apiKey?: string }>(req.body);
  const operationName = body.operationName?.trim();
  if (!operationName) {
    return res.status(400).json({ error: 'Missing operationName' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || body.apiKey?.trim();
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing Gemini API key on server and request body' });
  }

  try {
    const status = await getVideoOperationStatus(apiKey, operationName);
    return res.status(200).json(status);
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Unknown API error' });
  }
}
