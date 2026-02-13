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

const FALLBACK_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
const PROMPT_MODEL = 'gemini-2.5-flash';
const LOCAL_API_KEY_STORAGE = 'AVNE_GEMINI_API_KEY';

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
      detail: error instanceof Error ? error.message : 'Unknown Gemini API error',
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

  onProgress('Gemini backend responded. Returning preview clip placeholder.');
  return FALLBACK_VIDEO_URL;
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
