const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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

const deepFindUrl = (input: unknown): string | null => {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    return input.startsWith('http') ? input : null;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const maybe = deepFindUrl(item);
      if (maybe) return maybe;
    }
    return null;
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    for (const key of ['videoUri', 'uri', 'downloadUri']) {
      const value = record[key];
      if (typeof value === 'string' && value.startsWith('http')) {
        return value;
      }
    }

    for (const value of Object.values(record)) {
      const maybe = deepFindUrl(value);
      if (maybe) return maybe;
    }
  }

  return null;
};

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

  const response = await fetch(`${GEMINI_API_BASE}/${operationName}?key=${encodeURIComponent(apiKey)}`);
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: getErrorMessage(data), raw: data });
  }

  const statusRecord = data as { done?: boolean; error?: { message?: string } };
  if (statusRecord.error?.message) {
    return res.status(502).json({ error: statusRecord.error.message, raw: data });
  }

  if (!statusRecord.done) {
    return res.status(200).json({ done: false });
  }

  const videoUrl = deepFindUrl(data);
  if (!videoUrl) {
    return res.status(502).json({ error: 'Operation finished but no playable video URL was returned', raw: data });
  }

  return res.status(200).json({ done: true, videoUrl });
}
