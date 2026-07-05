import { BookingForm } from './BookingForm';

export function App() {
  return (
    <div className="app-container">
      <header className="brand-header">
        <h1 className="brand-logo">Tim Sherman</h1>
        <p className="brand-tagline">Soulful Gigs, Live Music & Booking</p>
      </header>
      <main style={{ width: '100%' }}>
        <BookingForm />
      </main>
    </div>
  );
}

