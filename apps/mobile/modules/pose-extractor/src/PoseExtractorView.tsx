import { requireNativeView } from 'expo';
import * as React from 'react';

import { PoseExtractorViewProps } from './PoseExtractor.types';

const NativeView: React.ComponentType<PoseExtractorViewProps> =
  requireNativeView('PoseExtractor');

export default function PoseExtractorView(props: PoseExtractorViewProps) {
  return <NativeView {...props} />;
}
