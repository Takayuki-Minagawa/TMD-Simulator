export const MAX_STORIES = 9;

export const REQUIRED_FOLDERS = [
  "model",
  "Wave",
  "ForceWave",
  "WaveAnalysis/avd",
  "WaveAnalysis/spectrum",
  "Result/his",
  "DisplacementView",
] as const;

export type WorkspaceFolder = (typeof REQUIRED_FOLDERS)[number];

export interface TmdSetting {
  floor: number;
  weightKn: number;
  freqHz: number;
}

export interface ModelData {
  name: string;
  storyCount: number;
  weightsKn: number[];
  stiffnessKnPerCm: number[];
  extraDampingKnPerKine: number[];
  tmdList: TmdSetting[];
}

export interface ModalResult {
  naturalPeriod: number[];
  naturalFrequency: number[];
  participationFactor: number[];
  effectiveMassRatio: number[];
  eigenVector: number[][];
  modeShape: number[][];
}

export interface WorkspaceFile {
  path: string;
  content: string;
  updatedAt: number;
}

export interface ModelRunConfig {
  modelPath: string;
  indexOrder: number;
  useUserDamping: boolean;
  userDampingH: number;
  dampingPercent: number;
}

export interface ForceInputConfig {
  wavePath: string;
  floorIndex: number;
  maxForceKn: number;
}

export interface ResponseResult {
  name: string;
  modelName: string;
  mainMassCount: number;
  tmdCount: number;
  tmdFloors: number[];
  time: number[];
  waveAcc: number[];
  mainAcc: number[][];
  mainDis: number[][];
  tmdAcc: number[][];
  tmdDis: number[][];
}

export interface WaveAnalysisResult {
  time: number[];
  acc: number[];
  vel: number[];
  dis: number[];
  period: number[];
  sa: number[];
  spectrumRows: number[][];
  amax: number;
  vmax: number;
  dmax: number;
}
