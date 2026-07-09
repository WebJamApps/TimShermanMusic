/**
 * @file index.tsx
 * @description Tim Sherman Music main application component incorporating the photo slideshow and booking form.
 */

import { BookingForm } from './BookingForm';
import { GigList } from './GigList';
import { PicSlider } from './PicSlider';

export function App() {
  return (
    <div className="app-container">
      <header className="brand-header">
        <h1 className="brand-logo">Tim Sherman</h1>
        <p className="brand-tagline">Soulful Gigs, Live Music & Booking</p>
      </header>
      <main style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <PicSlider />
        </div>
        <GigList />
        <BookingForm />
      </main>
    </div>
  );
}

