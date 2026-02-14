import { InputMode, Language, Scene, SpecBarParams, SpatialDNA, VisualMode, CameraPath } from '../types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function optimizeArchitecturalPrompt(
  promptInput: string,
  visualMode: VisualMode,
  cameraPath: CameraPath,
  inputMode: InputMode,
  spatialDNA: SpatialDNA,
  lang: Language
): Promise<string> {
  await sleep(250);

  const modeLabel = lang === Language.ZH ? '模式' : 'mode';
  const cameraLabel = lang === Language.ZH ? '镜头' : 'camera';
  const material = spatialDNA.material_dna.texture_reference;

  return `${promptInput}\n\n[${modeLabel}: ${visualMode}] [${cameraLabel}: ${cameraPath}] [input: ${inputMode}] [material: ${material}]`;
}

export async function runNarrativeRender(scene: Scene, specs: SpecBarParams, onProgress?: (message: string) => void): Promise<string> {
  onProgress?.('preparing');
  await sleep(200);
  onProgress?.('rendering');
  await sleep(200);

  const payload = encodeURIComponent(JSON.stringify({
    prompt: scene.prompt_enhanced || scene.prompt_input,
    resolution: specs.resolution,
    duration: specs.duration
  }));

  return `https://example.com/mock-video.mp4?payload=${payload}`;
}

export async function generate9Grid(imageStart: string, visualMode: VisualMode, lang: Language): Promise<string[]> {
  await sleep(250);
  return Array.from({ length: 9 }, (_, index) => `${imageStart}#grid-${index + 1}-${visualMode}-${lang}`);
}
