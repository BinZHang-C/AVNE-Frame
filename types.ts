
export enum Language {
  ZH = 'zh',
  EN = 'en'
}

export enum VisualMode {
  ARCHITECTURE = 'architecture',
  INTERIOR = 'interior'
}

export enum InputMode {
  TEXT_TO_VIDEO = 'text_to_video',
  IMAGE_TO_VIDEO = 'image_to_video',
  NINE_GRID = 'nine_grid',
  FIRST_LAST_FRAMES = 'first_last_frames'
}

export enum CameraPath {
  DOLLY_IN = 'dolly_in',
  DOLLY_OUT = 'dolly_out',
  TRUCK_LEFT = 'truck_left',
  TRUCK_RIGHT = 'truck_right',
  ORBIT = 'orbit',
  LOW_ANGLE_PUSH = 'low_angle_push',
  TOP_DOWN_DROP = 'top_down_drop',
  STATIC = 'static'
}

export enum Resolution {
  R720P = '720p',
  R1080P = '1080p'
}

export enum QualityLevel {
  SKETCH = 'sketch',
  EXPRESSION = 'expression',
  REPORT = 'report'
}

export enum VeoMode {
  FAST = 'fast',
  HIGH_QUALITY = 'high_quality',
  FRAME_CONTROL = 'frame_control'
}

export enum NarrativeGoal {
  ATMOSPHERE = 'atmosphere',
  STRUCTURE = 'structure',
  MATERIAL = 'material',
  CONTEXT = 'context'
}

export enum CameraType {
  AXIAL_PUSH = 'axial_push',
  PANORAMIC = 'panoramic',
  ORBIT = 'orbit',
  STATIC = 'static'
}

export enum SceneStatus {
  EXPLORE = 'explore',
  EXPRESS = 'express',
  REPORT = 'report'
}

export enum WorkMode {
  DRAFT = 'draft',
  PRODUCTION = 'production'
}

export enum QualityMode {
  DRAFT = 'draft',
  FINAL = 'final'
}

export interface EnhancementConfig {
  creativity: number;
}

export interface SpecBarParams {
  resolution: Resolution;
  duration: 5 | 10;
  quality: QualityLevel;
  veoMode: VeoMode;
}

export interface MaterialDNA {
  texture_reference: string;
  reflection_level: number;
  roughness_level: number;
}

export interface LightingDNA {
  time_of_day: string;
  color_temperature: number;
  intensity: number;
}

export interface SpatialDNA {
  material_dna: MaterialDNA;
  lighting_dna: LightingDNA;
  floor_height: number;
  column_grid: string;
}

export interface Scene {
  id: string;
  inputMode: InputMode;
  cameraPath: CameraPath;
  prompt_input: string;
  prompt_enhanced: string;
  image_start?: string;
  image_end?: string;
  video_url?: string;
  render_status: 'idle' | 'processing' | 'completed' | 'failed';
  nine_grid_images?: string[];
  // Extended properties for SceneEditor and SceneCard
  narrative_goal?: NarrativeGoal;
  camera_type?: CameraType;
  output_parameters?: {
    resolution: Resolution;
    duration_seconds?: number;
    quality_mode?: QualityMode | string;
  };
  title?: string;
  scene_name?: string;
  status?: SceneStatus;
}

export interface Project {
  id: string;
  name: string;
  visualMode: VisualMode;
  spatial_dna: SpatialDNA;
}
