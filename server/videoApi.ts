const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const VEO_MODEL = 'veo-2.0-generate-001';

export const normalizeBody = <T>(body: unknown): T => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return {} as T;
    }
  }

  return (body || {}) as T;
};

export const getErrorMessage = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return 'Unknown API error';
  }

  const p = payload as { error?: { message?: string }; message?: string };
  return p.error?.message || p.message || 'Unknown API error';
};

export const deepFindUrl = (input: unknown): string | null => {
  if (!input) return null;
  if (typeof input === 'string') return input.startsWith('http') ? input : null;

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = deepFindUrl(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    for (const key of ['videoUri', 'uri', 'downloadUri']) {
      const value = record[key];
      if (typeof value === 'string' && value.startsWith('http')) return value;
    }

    for (const value of Object.values(record)) {
      const found = deepFindUrl(value);
      if (found) return found;
    }
  }

  return null;
};

export const createVideoOperation = async (apiKey: string, prompt: string, durationSeconds = 5): Promise<{ operationName: string }> => {
  const response = await fetch(`${GEMINI_API_BASE}/models/${VEO_MODEL}:generateVideos?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: { text: prompt },
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        durationSeconds,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  const operationName = (data as { name?: string }).name;
  if (!operationName) {
    throw new Error('No operation name returned by Gemini');
  }

  return { operationName };
};

export const getVideoOperationStatus = async (apiKey: string, operationName: string): Promise<{ done: boolean; videoUrl?: string }> => {
  const response = await fetch(`${GEMINI_API_BASE}/${operationName}?key=${encodeURIComponent(apiKey)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  const statusRecord = data as { done?: boolean; error?: { message?: string } };
  if (statusRecord.error?.message) {
    throw new Error(statusRecord.error.message);
  }

  if (!statusRecord.done) {
    return { done: false };
  }

  const videoUrl = deepFindUrl(data);
  if (!videoUrl) {
    throw new Error('Operation finished but no playable video URL was returned');
  }

  return { done: true, videoUrl };
};
