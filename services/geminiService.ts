import { GoogleGenAI } from '@google/genai';
import {
  CameraPath,
  InputMode,
  Language,
  QualityLevel,
  Scene,
  SpatialDNA,
  SpecBarParams,
  VeoMode,
  VisualMode,
} from '../types';

const PROMPT_MODEL = 'gemini-2.5-flash';
const LOCAL_API_KEY_STORAGE = 'AVNE_GEMINI_API_KEY';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const VEO_MODEL = 'veo-2.0-generate-001';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


const isLocationUnsupportedError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return normalized.includes('user location is not supported') || normalized.includes('failed_precondition');
};

const toFriendlyError = (message: string): string => {
  if (isLocationUnsupportedError(message)) {
    return 'Current region is not supported for this API key. Please use AI Studio key flow or configure GEMINI_API_KEY on the deployed server.';
  }
  return message;
};

const extractErrorMessage = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return 'Unknown API error.';
  }

  const maybe = payload as { error?: { message?: string }; message?: string };
  return maybe.error?.message || maybe.message || 'Unknown API error.';
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
      const url = deepFindUrl(item);
      if (url) {
        return url;
      }
    }
    return null;
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const directKeys = ['videoUri', 'uri', 'downloadUri'];
    for (const key of directKeys) {
      const val = record[key];
      if (typeof val === 'string' && val.startsWith('http')) {
        return val;
      }
    }

    for (const value of Object.values(record)) {
      const url = deepFindUrl(value);
      if (url) {
        return url;
      }
    }
  }

  return null;
};

const generateVideoByGeminiApi = async (
  prompt: string,
  specs: SpecBarParams,
  onProgress: (message: string) => void,
): Promise<string> => {
  const apiKey = getStoredApiKey() || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('No API key configured for Gemini video generation.');
  }

  onProgress('Submitting video generation task to backend...');

  try {
    const createResp = await fetch('/api/video-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        durationSeconds: specs.duration,
      }),
    });

    const createData = await createResp.json();
    if (!createResp.ok) {
      throw new Error(toFriendlyError(`Backend create failed: ${extractErrorMessage(createData)}`));
    }

    const operationName = (createData as { operationName?: string }).operationName;
    if (!operationName) {
      throw new Error('Backend returned no operation name.');
    }

    for (let attempt = 0; attempt < 50; attempt += 1) {
      onProgress(`Polling backend video task... (${attempt + 1}/50)`);
      await sleep(2000);

      const statusResp = await fetch('/api/video-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operationName }),
      });

      const statusData = await statusResp.json();
      if (!statusResp.ok) {
        throw new Error(toFriendlyError(`Backend status failed: ${extractErrorMessage(statusData)}`));
      }

      const done = (statusData as { done?: boolean }).done;
      if (!done) {
        continue;
      }

      const videoUrl = (statusData as { videoUrl?: string }).videoUrl;
      if (!videoUrl) {
        throw new Error('Backend status done but no video URL returned.');
      }

      onProgress('Backend video generation completed.');
      return videoUrl;
    }

    throw new Error('Backend video generation timed out.');
  } catch (backendError) {
    const message = backendError instanceof Error ? backendError.message : 'Unknown backend error';
    onProgress(`Backend route unavailable, trying direct Gemini API... (${message})`);
  }

  const createResp = await fetch(`${GEMINI_API_BASE}/models/${VEO_MODEL}:generateVideos?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: { text: prompt },
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        durationSeconds: specs.duration,
      },
    }),
  });

  const createData = await createResp.json();
  if (!createResp.ok) {
    throw new Error(toFriendlyError(`Gemini video create failed: ${extractErrorMessage(createData)}`));
  }

  const operationName = (createData as { name?: string }).name;
  if (!operationName) {
    throw new Error('Gemini video API returned no operation id.');
  }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    onProgress(`Polling direct Gemini video task... (${attempt + 1}/40)`);
    await sleep(2000);

    const statusResp = await fetch(`${GEMINI_API_BASE}/${operationName}?key=${encodeURIComponent(apiKey)}`);
    const statusData = await statusResp.json();

    if (!statusResp.ok) {
      throw new Error(toFriendlyError(`Gemini video status failed: ${extractErrorMessage(statusData)}`));
    }

    const statusRecord = statusData as { done?: boolean; error?: { message?: string } };
    if (statusRecord.error?.message) {
      throw new Error(`Gemini video operation failed: ${statusRecord.error.message}`);
    }

    if (!statusRecord.done) {
      continue;
    }

    const videoUrl = deepFindUrl(statusData);
    if (!videoUrl) {
      throw new Error('Video task finished but no playable video URL was returned.');
    }

    onProgress('Gemini video generation completed.');
    return videoUrl;
  }

  throw new Error('Video generation timed out. Please retry with shorter duration or fast mode.');
};

export const getStoredApiKey = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(LOCAL_API_KEY_STORAGE)?.trim() || '';
};

export const setStoredApiKey = (apiKey: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const trimmed = apiKey.trim();
  if (!trimmed) {
    window.localStorage.removeItem(LOCAL_API_KEY_STORAGE);
    return;
  }

  window.localStorage.setItem(LOCAL_API_KEY_STORAGE, trimmed);
};


export const verifyGeminiApi = async (): Promise<{ ok: boolean; detail: string }> => {
  const client = getClient();
  if (!client) {
    return { ok: false, detail: 'Missing Gemini API key.' };
  }

  try {
    const response = await client.models.generateContent({
      model: PROMPT_MODEL,
      contents: 'Reply with only: GEMINI_OK',
    });
    const text = response.text?.trim() || '';
    return {
      ok: text.includes('GEMINI_OK'),
      detail: text || 'Gemini API responded without expected marker.',
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? toFriendlyError(error.message) : 'Unknown Gemini API error',
    };
  }
};

const qualityDirectives: Record<QualityLevel, string> = {
  [QualityLevel.SKETCH]: 'Prefer speed and structure blockout over heavy detail; keep edits conservative.',
  [QualityLevel.EXPRESSION]: 'Balance detail and motion readability; preserve focal subject continuity.',
  [QualityLevel.REPORT]: 'Maximize physically plausible texture response, lighting fidelity, and stable composition continuity.',
};

const motionDirectives: Record<CameraPath, string> = {
  [CameraPath.DOLLY_IN]: 'Single-axis forward push-in, fixed horizon, slow acceleration.',
  [CameraPath.DOLLY_OUT]: 'Single-axis pull-back, maintain center subject scale consistency.',
  [CameraPath.TRUCK_LEFT]: 'Lateral left truck, parallax from foreground to background layers.',
  [CameraPath.TRUCK_RIGHT]: 'Lateral right truck, smooth velocity with no sudden heading change.',
  [CameraPath.ORBIT]: 'Constant-radius orbit around subject centroid, stable framing.',
  [CameraPath.LOW_ANGLE_PUSH]: 'Low-angle push with vertical convergence control and reduced distortion.',
  [CameraPath.TOP_DOWN_DROP]: 'Top-down descending move with perspective stabilization.',
  [CameraPath.STATIC]: 'Locked camera with subtle environmental motion only.',
};

const modeDirectives: Record<InputMode, string> = {
  [InputMode.TEXT_TO_VIDEO]: 'Translate textual intent into coherent spatial narrative with controlled motion beats.',
  [InputMode.IMAGE_TO_VIDEO]: 'Anchor all geometry and materials to the reference image; no subject identity drift.',
  [InputMode.NINE_GRID]: 'Design nine coherent shot variants with progressive motion logic and lens diversity.',
  [InputMode.FIRST_LAST_FRAMES]: 'Strong boundary consistency: start frame and end frame must be semantically and structurally matched.',
};

const getClient = () => {
  const key = getStoredApiKey() || process.env.GEMINI_API_KEY || process.env.API_KEY;
  return key ? new GoogleGenAI({ apiKey: key }) : null;
};

const buildSpatialLock = (dna: SpatialDNA): string => {
  return [
    `Material texture reference: ${dna.material_dna.texture_reference}`,
    `Reflection level: ${dna.material_dna.reflection_level}`,
    `Roughness level: ${dna.material_dna.roughness_level}`,
    `Lighting time of day: ${dna.lighting_dna.time_of_day}`,
    `Lighting color temperature: ${dna.lighting_dna.color_temperature}K`,
    `Lighting intensity factor: ${dna.lighting_dna.intensity}`,
    `Architectural constraints: floor height ${dna.floor_height}m; column grid ${dna.column_grid}`,
  ].join('\n');
};

const frameContinuityDirective = (scene: Scene): string => {
  if (scene.inputMode !== InputMode.FIRST_LAST_FRAMES) {
    return 'Ensure temporal continuity across the full clip: no abrupt geometry mutation, color flicker, or camera jump.';
  }

  return [
    'Continuity hard constraints:',
    '- Frame 1 must align with provided start frame composition and subject identity.',
    '- Final frame must align with provided end frame composition and lens perspective.',
    '- Interpolation must be physically plausible; avoid morphing artifacts and impossible object transitions.',
    '- Keep texture IDs, material response, and light direction stable across all intermediate frames.',
  ].join('\n');
};

const buildRenderControlPrompt = (scene: Scene, specs: SpecBarParams): string => {
  return [
    'You are a cinematic video planner for architectural visualization.',
    `Visual mode: ${scene.inputMode}.`,
    `Intent: ${modeDirectives[scene.inputMode]}`,
    `Camera directive: ${motionDirectives[scene.cameraPath]}`,
    `Quality directive: ${qualityDirectives[specs.quality]}`,
    `Resolution target: ${specs.resolution}; duration: ${specs.duration}s; render mode: ${specs.veoMode}`,
    frameContinuityDirective(scene),
    '',
    'Shot grammar requirements:',
    '- Motion path must be smooth and monotonic unless explicitly requested otherwise.',
    '- Exposure and white balance must remain stable.',
    '- Composition should protect horizon level and vertical lines.',
    '- Prevent over-sharpening, flicker, ghosting, and temporal aliasing.',
    '',
    `Creative prompt:\n${scene.prompt_enhanced || scene.prompt_input}`,
  ].join('\n');
};

const optimizeFallback = (
  prompt: string,
  visualMode: VisualMode,
  cameraPath: CameraPath,
  inputMode: InputMode,
  spatialDna: SpatialDNA,
): string => {
  return [
    `[${visualMode.toUpperCase()} | ${inputMode}]`,
    prompt.trim(),
    `Camera: ${motionDirectives[cameraPath]}`,
    `Spatial DNA lock: ${spatialDna.material_dna.texture_reference}; ${spatialDna.lighting_dna.time_of_day}, ${spatialDna.lighting_dna.color_temperature}K.`,
    'Continuity: keep subject identity, material consistency, and coherent depth transitions across every frame.',
  ].join('\n');
};

export const optimizeArchitecturalPrompt = async (
  prompt: string,
  visualMode: VisualMode,
  cameraPath: CameraPath,
  inputMode: InputMode,
  spatialDna: SpatialDNA,
  lang: Language,
): Promise<string> => {
  const client = getClient();
  if (!client || !prompt.trim()) {
    return optimizeFallback(prompt, visualMode, cameraPath, inputMode, spatialDna);
  }

  const instruction = lang === Language.ZH
    ? '请将用户输入优化为可执行的视频生成指令。强化镜头语言、时序一致性、材质和光照稳定性，并保持原意。'
    : 'Rewrite the user input into a production-ready video generation prompt with stronger camera grammar, temporal consistency, and stable material/lighting logic.';

  const request = [
    instruction,
    `Mode: ${visualMode}; input mode: ${inputMode}; camera path: ${cameraPath}.`,
    `Spatial DNA:\n${buildSpatialLock(spatialDna)}`,
    `Original prompt:\n${prompt}`,
    'Output one concise paragraph only.',
  ].join('\n\n');

  const response = await client.models.generateContent({
    model: PROMPT_MODEL,
    contents: request,
  });

  return response.text?.trim() || optimizeFallback(prompt, visualMode, cameraPath, inputMode, spatialDna);
};

export const runNarrativeRender = async (
  scene: Scene,
  specs: SpecBarParams,
  onProgress: (message: string) => void,
): Promise<string> => {
  const finalPrompt = buildRenderControlPrompt(scene, specs);

  onProgress('Planning cinematic constraints...');

  const aiStudio = typeof window !== 'undefined' ? window.aistudio : undefined;
  if (aiStudio?.generateVideo) {
    onProgress('Calling AI Studio video backend...');
    const result = await aiStudio.generateVideo({
      prompt: finalPrompt,
      durationSeconds: specs.duration,
      resolution: specs.resolution,
      mode: specs.veoMode,
      startImage: scene.image_start,
      endImage: scene.image_end,
    });

    if (typeof result === 'string') {
      onProgress('Video backend completed.');
      return result;
    }

    if (result?.videoUrl) {
      onProgress('Video backend completed.');
      return result.videoUrl as string;
    }

    throw new Error('AI Studio backend returned no video url.');
  }

  const client = getClient();
  if (!client) {
    throw new Error('No API backend available. Please configure API key first.');
  }

  onProgress('Calling Gemini backend for render planning...');
  const validation = await client.models.generateContent({
    model: PROMPT_MODEL,
    contents: `${finalPrompt}

Return ONLY: CONTROLS_VALIDATED`,
  });

  if (!validation.text?.includes('CONTROLS_VALIDATED')) {
    throw new Error('Gemini backend did not validate render controls.');
  }

  return generateVideoByGeminiApi(finalPrompt, specs, onProgress);
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load source image'));
    img.src = src;
  });
};

const shotOffsets = [
  { x: 0, y: 0, zoom: 1.0 },
  { x: -0.08, y: -0.05, zoom: 1.1 },
  { x: 0.08, y: -0.05, zoom: 1.1 },
  { x: -0.1, y: 0.02, zoom: 1.15 },
  { x: 0, y: 0.02, zoom: 1.2 },
  { x: 0.1, y: 0.02, zoom: 1.15 },
  { x: -0.06, y: 0.08, zoom: 1.1 },
  { x: 0.06, y: 0.08, zoom: 1.1 },
  { x: 0, y: 0, zoom: 1.05 },
];

const renderShot = (img: HTMLImageElement, shotIndex: number): string => {
  const width = 960;
  const height = 540;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return img.src;
  }

  const { x, y, zoom } = shotOffsets[shotIndex];
  const sourceW = img.width / zoom;
  const sourceH = img.height / zoom;
  const sourceX = Math.max(0, Math.min(img.width - sourceW, ((img.width - sourceW) * (0.5 + x))));
  const sourceY = Math.max(0, Math.min(img.height - sourceH, ((img.height - sourceH) * (0.5 + y))));

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = shotIndex % 3 === 0 ? 'contrast(1.03) saturate(1.05)' : shotIndex % 3 === 1 ? 'brightness(1.02)' : 'contrast(1.01)';
  ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.92);
};

export const generate9Grid = async (
  sourceImage: string,
  _visualMode: VisualMode,
  _lang: Language,
): Promise<string[]> => {
  const img = await loadImage(sourceImage);
  return shotOffsets.map((_, index) => renderShot(img, index));
};
