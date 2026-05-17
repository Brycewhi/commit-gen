export interface CommitStyle {
  type: 'conventional' | 'emoji' | 'detailed';
}

export interface GenerationResult {
  message: string;
  cached: boolean;
  backend: string;
}

export interface Backend {
  generate(diff: string, style: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface DiffSummary {
  filesChanged: number;
  additions: number;
  deletions: number;
  diff: string;
}
