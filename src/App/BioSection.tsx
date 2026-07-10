/**
 * @file BioSection.tsx
 * @description Renders a beautifully styled, dynamic bio section for Tim Sherman.
 */

import React, { useContext } from 'react';
import { DataContext } from '../providers/Data.provider';

export function BioSection(): React.JSX.Element | null {
  const { bio } = useContext(DataContext);

  if (bio === null || bio === undefined) {
    return (
      <div className="bio-section-loading" data-testid="bio-loading">
        <div className="bio-loading-skeleton" />
      </div>
    );
  }

  if (bio.trim() === '') {
    return null;
  }

  // Split comments by double newlines to render proper paragraphs
  const paragraphs = bio
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <section className="bio-section-container" data-testid="bio-section">
      <div className="bio-card">
        <h2 className="bio-title">About Tim</h2>
        <div className="bio-content">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="bio-paragraph">
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
