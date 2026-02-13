interface AIStudioBridge {
  hasSelectedApiKey?: () => Promise<boolean>;
  openSelectKey?: () => Promise<void>;
  generateVideo?: (params: {
    prompt: string;
    durationSeconds: number;
    resolution: string;
    mode: string;
    startImage?: string;
    endImage?: string;
  }) => Promise<string | { videoUrl?: string }>;
}

declare global {
  interface Window {
    aistudio?: AIStudioBridge;
  }
}

export {};
