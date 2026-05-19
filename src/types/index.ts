/** Available commit message styles */
export interface CommitStyle {
  type: 'conventional' | 'emoji' | 'detailed';
}

/** Result of a commit message generation */
export interface GenerationResult {
  message: string;
  cached: boolean;
  backend: string;
}

/** Interface that all AI backends must implement */
export interface Backend {
  /** Generates a commit message from a git diff */
  generate(diff: string, style: string): Promise<string>;
  /** Checks if the backend is configured and available */
  isAvailable(): Promise<boolean>;
}

/** Summary of staged git changes */
export interface DiffSummary {
  filesChanged: number;
  additions: number;
  deletions: number;
  diff: string;
}
