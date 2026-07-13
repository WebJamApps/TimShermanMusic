/**
 * @file Data.provider.tsx
 * @description Provider for shared data assets like pictures, scoped to Tim Sherman.
 */

import React, { createContext, useEffect, useState } from 'react';
import fetchGigs from './fetchGigs';

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
  id?: number;
}

export interface IBranding {
  /** Page header title (h1). Empty/null means use frontend default. */
  title: string | null;
  /** Page header subtitle/tagline. Empty/null means use frontend default. */
  subtitle: string | null;
}

export interface IDataContext {
  pics: Ipic[] | null;
  setPics: (_arg0: Ipic[] | null) => void;
  gigs: Igig[] | null;
  setGigs: (_arg0: Igig[] | null) => void;
  bio?: string | null;
  setBio?: (_arg0: string | null) => void;
  branding?: IBranding | null;
  setBranding?: (_arg0: IBranding | null) => void;
}

export const DataContext = createContext<IDataContext>({
  pics: null,
  setPics: () => {},
  gigs: null,
  setGigs: () => {},
  bio: null,
  setBio: () => {},
  branding: null,
  setBranding: () => {},
});

declare const process: {
  env: {
    BackendUrl?: string;
  };
};

export function DataProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [pics, setPics] = useState<Ipic[] | null>(null);
  const [gigs, setGigs] = useState<Igig[] | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  // null = not loaded yet; { title/subtitle: null } = loaded, no stored value
  const [branding, setBranding] = useState<IBranding | null>(null);

  useEffect(() => {
    const backendUrl =
      process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

    // Scoped to the photo type only — the `books` collection under artist:'tim'
    // also holds Tim's bio record (type: 'bio') and branding (type: 'branding'),
    // and an unfiltered fetch here would load them into `pics`, where the admin
    // pics UI could delete them as if they were photos (TimShermanMusic#40).
    fetch(`${backendUrl}/book?artist=tim&type=TimShermanMusic-music`)
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

    fetch(`${backendUrl}/book?type=bio&artist=tim`)
      .then(res => {
        if (!res.ok) {
          setBio('');
          return null;
        }
        return res.json();
      })
      .then(data => {
        const bioRecord = Array.isArray(data) ? data[0] : null;
        if (bioRecord && typeof bioRecord.comments === 'string') {
          setBio(bioRecord.comments);
        } else {
          setBio('');
        }
      })
      .catch(err => {
        console.error('Failed to fetch bio:', err);
        setBio('');
      });

    // Page title (record.title) + subtitle/tagline (record.comments)
    fetch(`${backendUrl}/book?type=branding&artist=tim`)
      .then(res => {
        if (!res.ok) {
          setBranding({ title: null, subtitle: null });
          return null;
        }
        return res.json();
      })
      .then(data => {
        const record = Array.isArray(data) ? data[0] : null;
        if (record) {
          setBranding({
            title: typeof record.title === 'string' ? record.title : null,
            subtitle: typeof record.comments === 'string' ? record.comments : null,
          });
        } else {
          setBranding({ title: null, subtitle: null });
        }
      })
      .catch(err => {
        console.error('Failed to fetch branding:', err);
        setBranding({ title: null, subtitle: null });
      });

    fetchGigs.getGigs(setGigs);
  }, []);

  return (
    <DataContext.Provider value={{
      pics, setPics, gigs, setGigs, bio, setBio, branding, setBranding,
    }}
    >
      {children}
    </DataContext.Provider>
  );
}

