/*
 * File: index.tsx
 * Project: TimShermanMusic
 * Description: Tim Sherman Music main application component incorporating the photo slideshow, booking form, and admin area.
 */

import { useState, useRef, useContext } from 'react';
import { BookingForm } from './BookingForm';
import { GigList } from './GigList';
import { PicSlider } from './PicSlider';
import { AdminPanel } from './AdminPanel';
import { deleteGig } from '../lib/adminActions';
import { AuthContext } from '../providers/Auth.provider';
import { DataContext } from '../providers/Data.provider';
import fetchGigs from '../providers/fetchGigs';

export function App() {
  const { auth } = useContext(AuthContext);
  const { setGigs } = useContext(DataContext);
  const [adminActive, setAdminActive] = useState(false);
  const triggerEditGigRef = useRef<((gig: any) => void) | null>(null);

  const refreshGigs = () => {
    fetchGigs.getGigs(setGigs);
  };

  const handleDeleteGig = async (gigId: string) => {
    // eslint-disable-next-line no-alert, no-restricted-globals
    if (window.confirm('Are you sure you want to delete this performance?')) {
      await deleteGig(gigId, auth.token, () => {
        refreshGigs();
      });
    }
  };

  return (
    <div className="app-container">
      {adminActive && (
        <div className="admin-edit-badge" data-testid="admin-badge">
          Admin Editing Mode Active
        </div>
      )}
      <header className="brand-header">
        <h1 className="brand-logo">Tim Sherman</h1>
        <p className="brand-tagline">Soulful Gigs, Live Music & Booking</p>
      </header>
      <main style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <PicSlider />
        </div>
        <GigList
          adminActive={adminActive}
          onEditGig={gig => triggerEditGigRef.current?.(gig)}
          onDeleteGig={handleDeleteGig}
        />
        <BookingForm />
      </main>
      <AdminPanel
        adminActive={adminActive}
        setAdminActive={setAdminActive}
        onRegisterTriggerEdit={trigger => {
          triggerEditGigRef.current = trigger;
        }}
      />
    </div>
  );
}
