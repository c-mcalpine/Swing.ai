import * as React from 'react';

import { PoseExtractorViewProps } from './PoseExtractor.types';

export default function PoseExtractorView(props: PoseExtractorViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
