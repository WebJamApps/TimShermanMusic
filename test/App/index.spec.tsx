import { render, screen } from '@testing-library/react';
import { App } from 'src/App';
import { expect, describe, it } from 'vitest';

describe('App', () => {

  it('renders the Tim Sherman brand heading, tagline, contact form, and app version', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: 'Tim Sherman' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('brand-logo');

    const tagline = screen.getByText('Soulful Gigs, Live Music & Booking');
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveClass('brand-tagline');

    const versionElem = screen.getByTestId('app-version');
    expect(versionElem).toBeInTheDocument();
    expect(versionElem).toHaveTextContent(__APP_VERSION__);

    expect(screen.getByRole('heading', { name: 'Book Tim Sherman' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Event Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Venue Address')).toBeInTheDocument();
    expect(screen.getByLabelText(/Message & Event Details/i)).toBeInTheDocument();
  });

  it('renders stored branding title and subtitle when provided via DataContext', async () => {
    const { DataContext } = await import('../../src/providers/Data.provider');
    const { AuthContext } = await import('../../src/providers/Auth.provider');

    render(
      <AuthContext.Provider value={{
        auth: {
          isAuthenticated: false,
          token: '',
          error: '',
          user: { email: '', userType: '' },
        },
        setAuth: () => {},
        loginWithGoogle: () => {},
        logout: () => {},
      }}
      >
        <DataContext.Provider value={{
          pics: [],
          setPics: () => {},
          gigs: [],
          setGigs: () => {},
          bio: '',
          setBio: () => {},
          branding: { title: 'Custom Brand Title', subtitle: 'Custom Brand Subtitle' },
          setBranding: () => {},
        }}
        >
          <App />
        </DataContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('heading', { name: 'Custom Brand Title' })).toBeInTheDocument();
    expect(screen.getByText('Custom Brand Subtitle')).toBeInTheDocument();
  });

});
