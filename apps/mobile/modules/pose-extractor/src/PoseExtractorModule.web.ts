import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './PoseExtractor.types';

type PoseExtractorModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class PoseExtractorModule extends NativeModule<PoseExtractorModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(PoseExtractorModule, 'PoseExtractorModule');
