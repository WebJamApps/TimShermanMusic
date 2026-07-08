/**
 * @file caption.tsx
 * @description Premium glassmorphism caption overlay for the photo slideshow.
 */

import React from 'react';

interface ICaptionProps {
  caption?: string;
}

export function Caption({ caption = '' }: ICaptionProps): React.JSX.Element {
  return (
    <div className="slider-caption">
      {caption}
    </div>
  );
}

export default Caption;
