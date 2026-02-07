import { NativeModule, requireNativeModule } from 'expo';

import { PoseExtractorModuleEvents } from './PoseExtractor.types';

declare class PoseExtractorModule extends NativeModule<PoseExtractorModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<PoseExtractorModule>('PoseExtractor');
