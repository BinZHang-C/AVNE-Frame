const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const VEO_MODEL = 'veo-2.0-generate-001';

type CreateBody = {
  prompt?: string;
  durationSeconds?: number;
  apiKey?: string;
};

const normalizeBody = <T>(body: unknown): T => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return {} as T;
    }
  }

  return (body || {}) as T;
};

const getErrorMessage = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return 'Unknown API error';
  }

  const p = payload as { error?: { message?: string }; message?: string };
  return p.error?.message || p.message || 'Unknown API error';
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

  const response = await fetch(`${GEMINI_API_BASE}/models/${VEO_MODEL}:generateVideos?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: { text: prompt },
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        durationSeconds: body.durationSeconds || 5,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json({ error: getErrorMessage(data), raw: data });
  }

  const operationName = (data as { name?: string }).name;
  if (!operationName) {
    return res.status(502).json({ error: 'No operation name returned by Gemini', raw: data });
  }

  return res.status(200).json({ operationName });
}
