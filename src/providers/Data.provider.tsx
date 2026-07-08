/**
 * @file Data.provider.tsx
 * @description Provider for shared data assets like pictures, scoped to Tim Sherman.
 */

import React, { createContext, useEffect, useState } from 'react';

export interface Ipic {
  '_id'?: string;
  'url': string;
  'title': string;
  'type': string;
  'caption': string;
  'thumbnail': string | undefined;
  'link': string;
  'modify': React.JSX.Element | undefined;
  'comments': string;
  'created_at'?: string;
  'updated_at'?: string;
}

export interface Igig {
  _id?: string;
  date?: string;
  time?: string;
  datetime?: string | null;
  location?: string;
  city?: string;
  usState?: string;
  venue: string;
  tickets?: string;
  duration?: number;
  promoImageUrl?: string;
  artist?: string;
}

export const DataContext = createContext({
  pics: null as Ipic[] | null,
  setPics: (_arg0: Ipic[] | null) => {},
  gigs: null as Igig[] | null,
  setGigs: (_arg0: Igig[] | null) => {},
});

declare const process: {
  env: {
    BackendUrl?: string;
  };
};

export function DataProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [pics, setPics] = useState<Ipic[] | null>(null);
  const [gigs, setGigs] = useState<Igig[] | null>(null);

  useEffect(() => {
    const backendUrl =
      process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

    fetch(`${backendUrl}/book?artist=tim`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPics(data as Ipic[]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch pics:', err);
      });

    fetch(`${backendUrl}/gig?artist=tim`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setGigs(data as Igig[]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch gigs:', err);
      });
  }, []);

  return (
    <DataContext.Provider value={{ pics, setPics, gigs, setGigs }}>
      {children}
    </DataContext.Provider>
  );
}

