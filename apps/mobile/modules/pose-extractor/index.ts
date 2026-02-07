// Reexport the native module. On web, it will be resolved to PoseExtractorModule.web.ts
// and on native platforms to PoseExtractorModule.ts
export { default } from './src/PoseExtractorModule';
export { default as PoseExtractorView } from './src/PoseExtractorView';
export * from  './src/PoseExtractor.types';
