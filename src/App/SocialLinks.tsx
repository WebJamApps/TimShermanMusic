/**
 * @file SocialLinks.tsx
 * @description Renders a row of round icon buttons linking to Tim Sherman's social profiles.
 */

import React from 'react';
import { SOCIAL_LINKS, type SocialLinkItem } from '../lib/socialLinks';

function renderIcon(name: SocialLinkItem['name']): React.JSX.Element {
  if (name === 'Facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z" />
      </svg>
    );
  }
  if (name === 'Instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d={
            'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z'
            + 'm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 3.6c2.7 0 3.1 0 4.1.1 2.8.1 4.1 1.4'
            + ' 4.2 4.2.1 1.1.1 1.4.1 4.1s0 3.1-.1 4.1c-.1 2.8-1.4 4.1-4.2 4.2-1.1.1-1.4.1-4.1.1'
            + 's-3.1 0-4.1-.1c-2.8-.1-4.1-1.4-4.2-4.2-.1-1.1-.1-1.4-.1-4.1s0-3.1.1-4.1c.1-2.8 1.4-4.1'
            + ' 4.2-4.2 1-.1 1.4-.1 4.1-.1zM12 2c-2.7 0-3.1 0-4.1.1C4.2 2.2 2.2 4.2 2.1 7.9 2 8.9 2 9.3'
            + ' 2 12s0 3.1.1 4.1c.1 3.7 2.1 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.7-.1 5.7-2.1'
            + ' 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-3.7-2.1-5.7-5.8-5.8C15.1 2 14.7 2 12 2z'
          }
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={
          'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12'
          + 'a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1'
          + ' 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.8 3.1-5.8 3.1z'
        }
      />
    </svg>
  );
}

export function SocialLinks(): React.JSX.Element {
  return (
    <ul className="social-links" data-testid="social-links">
      {SOCIAL_LINKS.map(item => (
        <li key={item.name}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
          >
            {renderIcon(item.name)}
          </a>
        </li>
      ))}
    </ul>
  );
}
