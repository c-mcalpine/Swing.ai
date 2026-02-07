import { requireNativeModule } from 'expo-modules-core';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseExtractorNativeModule {
  initialize(): Promise<void>;
  detectPoseFromImage(uri: string): Promise<PoseLandmark[]>;
  dispose(): void;
}

const PoseExtractorModule = requireNativeModule<PoseExtractorNativeModule>('PoseExtractor');

export default PoseExtractorModule;
