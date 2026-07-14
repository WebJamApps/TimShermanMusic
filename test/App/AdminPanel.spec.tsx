/**
 * @file AdminPanel.spec.tsx
 * @description Unit tests for the AdminPanel dashboard and modals.
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPanel } from '../../src/App/AdminPanel';
import { AuthContext } from '../../src/providers/Auth.provider';
import { DataContext } from '../../src/providers/Data.provider';

// Mock the adminActions module
vi.mock('../../src/lib/adminActions', () => ({
  createGig: vi.fn((gig, token, cb) => cb && cb()),
  updateGig: vi.fn((id, gig, token, cb) => cb && cb()),
  deleteGig: vi.fn((id, token, cb) => cb && cb()),
  createPic: vi.fn((pic, token, cb) => cb && cb()),
  updatePic: vi.fn((pic, token, cb) => cb && cb()),
  deletePic: vi.fn((id, token, cb) => cb && cb()),
  updateBio: vi.fn((bio, token, cb) => cb && cb()),
  updateBranding: vi.fn((branding, token, cb) => cb && cb()),
}));

const mockLoginWithGoogle = vi.fn();
const mockLogout = vi.fn();
const mockSetAdminActive = vi.fn();
const mockSetPics = vi.fn();
const mockSetGigs = vi.fn();

const defaultAuthMock = {
  auth: {
    isAuthenticated: false,
    token: '',
    error: '',
    user: { email: '', userType: '' },
  },
  setAuth: vi.fn(),
  loginWithGoogle: mockLoginWithGoogle,
  logout: mockLogout,
};

const adminAuthMock = {
  auth: {
    isAuthenticated: true,
    token: 'admin-token',
    error: '',
    user: { email: 'timsherman75@gmail.com', userType: 'tim-admin' },
  },
  setAuth: vi.fn(),
  loginWithGoogle: mockLoginWithGoogle,
  logout: mockLogout,
};

const defaultDataMock = {
  pics: [
    { _id: 'pic-1', url: 'https://example.com/pic1.jpg', title: 'Slide 1', comments: 'showCaption' },
  ],
  setPics: mockSetPics,
  setGigs: mockSetGigs,
};

function renderAdminPanel(authVal = defaultAuthMock, dataVal = defaultDataMock, props = {}) {
  return render(
    <AuthContext.Provider value={authVal}>
      <DataContext.Provider value={dataVal as any}>
        <AdminPanel
          adminActive={false}
          setAdminActive={mockSetAdminActive}
          {...props}
        />
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}

describe('AdminPanel Dashboard component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // Regression guard for the double-click login bug (issue #34): logging in
  // used to require a second "Admin" click because the OAuth redirect reloads
  // the SPA and resets isOpen to false. loginWithGoogle (Auth.provider) sets
  // the tsm_open_admin flag right before redirecting; AdminPanel must consume
  // it (open + clear) on the authenticated return, and must NOT auto-open on
  // every ordinary page load for an already-logged-in admin.
  describe('login-intent persistence across the OAuth redirect', () => {
    it('opens the panel and clears the flag when returning authenticated with the flag set', () => {
      localStorage.setItem('tsm_open_admin', '1');
      renderAdminPanel(adminAuthMock);

      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(localStorage.getItem('tsm_open_admin')).toBeNull();
    });

    it('does not auto-open the panel for an already-logged-in admin when no flag is set', () => {
      renderAdminPanel(adminAuthMock);

      expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Open Admin Portal' })).toBeInTheDocument();
    });

    it('does not open the panel when the flag is set but the user is not authenticated', () => {
      localStorage.setItem('tsm_open_admin', '1');
      renderAdminPanel(defaultAuthMock);

      expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
      // Flag stays put — not yet consumed, since the user isn't an admin yet.
      expect(localStorage.getItem('tsm_open_admin')).toBe('1');
    });
  });

  it('renders Admin trigger button initially', () => {
    renderAdminPanel();
    expect(screen.getByRole('button', { name: 'Open Admin Portal' })).toBeInTheDocument();
  });

  it('renders Google Login prompt when clicked and user is not authenticated', () => {
    renderAdminPanel();
    const trigger = screen.getByRole('button', { name: 'Open Admin Portal' });
    fireEvent.click(trigger);

    expect(screen.getByText('Admin Access')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In with Google' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign In with Google' }));
    expect(mockLoginWithGoogle).toHaveBeenCalled();
  });

  it('renders Dashboard console when clicked and user is tim-admin', () => {
    renderAdminPanel(adminAuthMock);
    const trigger = screen.getByRole('button', { name: 'Open Admin Portal' });
    fireEvent.click(trigger);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Logged in as:/)).toBeInTheDocument();
    expect(screen.getByText('timsherman75@gmail.com')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Add Performance' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle admin edit mode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage Slideshow Photos' })).toBeInTheDocument();
  });

  it('renders Dashboard console when clicked and user is Developer', () => {
    const developerAuthMock = {
      ...adminAuthMock,
      auth: {
        ...adminAuthMock.auth,
        user: { email: 'developer@webjam.com', userType: 'Developer' },
      },
    };
    renderAdminPanel(developerAuthMock);
    const trigger = screen.getByRole('button', { name: 'Open Admin Portal' });
    fireEvent.click(trigger);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('developer@webjam.com')).toBeInTheDocument();
  });

  it('does not render Dashboard console when clicked and user is JaM-admin', () => {
    const jamAdminAuthMock = {
      ...adminAuthMock,
      auth: {
        ...adminAuthMock.auth,
        user: { email: 'jamadmin@webjam.com', userType: 'JaM-admin' },
      },
    };
    renderAdminPanel(jamAdminAuthMock);
    const trigger = screen.getByRole('button', { name: 'Open Admin Portal' });
    fireEvent.click(trigger);

    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Admin Access')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In with Google' })).toBeInTheDocument();
  });

  it('toggles edit mode when clicking toggle edit button', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));

    const toggleBtn = screen.getByRole('button', { name: 'Toggle admin edit mode' });
    fireEvent.click(toggleBtn);
    expect(mockSetAdminActive).toHaveBeenCalledWith(true);
  });

  it('opens and submits gig form when clicking Add Performance', async () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add Performance' }));
    expect(screen.getByText('Add New Performance')).toBeInTheDocument();

    const venueInput = screen.getByLabelText('Venue Name');
    const cityInput = screen.getByLabelText('City');
    const datetimeInput = screen.getByLabelText('Date and Time');

    fireEvent.change(venueInput, { target: { value: 'Jam Club' } });
    fireEvent.change(cityInput, { target: { value: 'Arlington' } });
    fireEvent.change(datetimeInput, { target: { value: '2026-08-01T20:00' } });

    const form = screen.getByTestId('gig-form');
    fireEvent.submit(form);
  });

  it('opens and lists slideshow images when clicking Manage Photos', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));

    fireEvent.click(screen.getByRole('button', { name: 'Manage Slideshow Photos' }));
    expect(screen.getByText('Manage Slideshow Carousel')).toBeInTheDocument();
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Show Caption Active')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close portal modal' }));
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('navigates back to dashboard from PicsManager', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage Slideshow Photos' }));

    fireEvent.click(screen.getByRole('button', { name: 'Go back to dashboard' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('cancels the gig addition form and returns to dashboard', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Performance' }));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel editing' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('opens PicForm to add and submit a new slide photo', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage Slideshow Photos' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add slide photo' }));
    expect(screen.getByText('Add Slideshow Photo')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Image URL'), { target: { value: 'https://example.com/new.jpg' } });
    fireEvent.change(screen.getByLabelText('Title or Caption'), { target: { value: 'Beautiful Day' } });
    fireEvent.click(screen.getByLabelText('Display title caption'));

    fireEvent.click(screen.getByRole('button', { name: 'Submit photo' }));
  });

  it('opens PicForm to edit and submit an existing slide photo', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage Slideshow Photos' }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit photo Slide 1' }));
    expect(screen.getByText('Edit Slideshow Photo')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title or Caption'), { target: { value: 'Edited Slide 1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit photo' }));
  });

  it('calls deletePic when photo delete is clicked and confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage Slideshow Photos' }));

    fireEvent.click(screen.getByRole('button', { name: 'Delete photo Slide 1' }));
    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('handles parent-initiated edit gig triggers', () => {
    let capturedTrigger: any = null;
    const onRegisterTriggerEdit = (triggerFn: any) => {
      capturedTrigger = triggerFn;
    };

    renderAdminPanel(adminAuthMock, defaultDataMock, { onRegisterTriggerEdit });

    const mockGig = { _id: 'gig-99', venue: 'Parent Club', city: 'Parent City', usState: 'MD' };
    act(() => {
      capturedTrigger(mockGig);
    });

    expect(screen.getByText('Edit Performance')).toBeInTheDocument();
    expect(screen.getByLabelText('Venue Name')).toHaveValue('Parent Club');
  });

  it('handles alternate parent-initiated edit triggers', () => {
    let capturedTrigger: any = null;
    const onEditGigSelected = (triggerFn: any) => {
      capturedTrigger = triggerFn;
    };

    renderAdminPanel(adminAuthMock, defaultDataMock, { onEditGigSelected });

    const mockGig = { _id: 'gig-99', venue: 'Parent Club', city: 'Parent City', usState: 'MD' };
    act(() => {
      capturedTrigger(mockGig);
    });

    expect(screen.getByText('Edit Performance')).toBeInTheDocument();
    expect(screen.getByLabelText('Venue Name')).toHaveValue('Parent Club');
  });

  it('logs out successfully and closes modal', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));

    const logoutBtn = screen.getByRole('button', { name: 'Sign out' });
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockSetAdminActive).toHaveBeenCalledWith(false);
  });

  it('opens BioForm to edit and submit bio content', () => {
    const dataValWithBio = {
      ...defaultDataMock,
      bio: 'Original bio content',
      setBio: vi.fn(),
    };
    renderAdminPanel(adminAuthMock, dataValWithBio as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit Biography' }));
    expect(screen.getByText('Edit Biography')).toBeInTheDocument();

    const textarea = screen.getByLabelText('Biography Text');
    expect(textarea).toHaveValue('Original bio content');

    fireEvent.change(textarea, { target: { value: 'This is the newly updated bio!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save biography' }));
  });

  it('cancels the bio editing form and returns to dashboard', () => {
    const dataValWithBio = {
      ...defaultDataMock,
      bio: 'Original bio content',
      setBio: vi.fn(),
    };
    renderAdminPanel(adminAuthMock, dataValWithBio as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Biography' }));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel editing bio' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('opens BrandingForm to edit and submit page title/subtitle (TimShermanMusic#41)', async () => {
    const { updateBranding } = await import('../../src/lib/adminActions');
    const setBranding = vi.fn();
    const dataValWithBranding = {
      ...defaultDataMock,
      branding: { title: 'Original Title', subtitle: 'Original Tagline' },
      setBranding,
    };
    renderAdminPanel(adminAuthMock, dataValWithBranding as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit site branding' }));
    expect(screen.getByText('Edit Site Branding')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Page title');
    const subtitleInput = screen.getByLabelText('Page subtitle');
    expect(titleInput).toHaveValue('Original Title');
    expect(subtitleInput).toHaveValue('Original Tagline');

    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.change(subtitleInput, { target: { value: 'New Tagline' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save branding' }));

    await waitFor(() => {
      expect(updateBranding).toHaveBeenCalledWith(
        { title: 'New Title', subtitle: 'New Tagline' },
        'admin-token',
        expect.any(Function),
      );
    });
  });

  it('strips HTML from branding fields before submit', async () => {
    const { updateBranding } = await import('../../src/lib/adminActions');
    renderAdminPanel(adminAuthMock, {
      ...defaultDataMock,
      branding: { title: null, subtitle: null },
      setBranding: vi.fn(),
    } as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit site branding' }));

    fireEvent.change(screen.getByLabelText('Page title'), {
      target: { value: '<b>Tim</b> Sherman' },
    });
    fireEvent.change(screen.getByLabelText('Page subtitle'), {
      target: { value: 'Soulful <script>alert(1)</script>Gigs' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save branding' }));

    await waitFor(() => {
      expect(updateBranding).toHaveBeenCalledWith(
        { title: 'Tim Sherman', subtitle: 'Soulful Gigs' },
        'admin-token',
        expect.any(Function),
      );
    });
  });

  it('cancels the branding form and returns to dashboard', () => {
    renderAdminPanel(adminAuthMock, {
      ...defaultDataMock,
      branding: { title: 'T', subtitle: 'S' },
      setBranding: vi.fn(),
    } as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit site branding' }));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel editing branding' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('prefills branding form with defaults when no stored branding exists', () => {
    renderAdminPanel(adminAuthMock, {
      ...defaultDataMock,
      branding: { title: null, subtitle: null },
      setBranding: vi.fn(),
    } as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit site branding' }));

    expect(screen.getByLabelText('Page title')).toHaveValue('Tim Sherman');
    expect(screen.getByLabelText('Page subtitle')).toHaveValue(
      'Soulful Gigs, Live Music & Booking',
    );
  });

  it('refreshes branding from the API after a successful save', async () => {
    const setBranding = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ title: 'Saved Title', comments: 'Saved Subtitle' }],
    }));

    renderAdminPanel(adminAuthMock, {
      ...defaultDataMock,
      branding: { title: 'Old', subtitle: 'Old Sub' },
      setBranding,
    } as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit site branding' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save branding' }));

    await waitFor(() => {
      expect(setBranding).toHaveBeenCalledWith({
        title: 'Saved Title',
        subtitle: 'Saved Subtitle',
      });
    });
    vi.unstubAllGlobals();
  });

  it('clears branding state when refresh returns non-ok or empty', async () => {
    const setBranding = vi.fn();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response));

    renderAdminPanel(adminAuthMock, {
      ...defaultDataMock,
      branding: { title: 'Old', subtitle: 'Old Sub' },
      setBranding,
    } as any);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit site branding' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save branding' }));

    await waitFor(() => {
      expect(setBranding).toHaveBeenCalledWith({ title: null, subtitle: null });
    });
    vi.unstubAllGlobals();
  });

  it('closes modal when backdrop is clicked', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

    const backdrop = screen.getByLabelText('Close admin modal backdrop');
    fireEvent.click(backdrop);
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('closes modal when Escape key is pressed on the backdrop', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

    const backdrop = screen.getByLabelText('Close admin modal backdrop');
    fireEvent.keyDown(backdrop, { key: 'Escape' });
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('does not close modal when Escape key is pressed with other key', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

    const backdrop = screen.getByLabelText('Close admin modal backdrop');
    fireEvent.keyDown(backdrop, { key: 'Enter' });
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  // Regression guard for TimShermanMusic#40: refreshPics (fired after a photo
  // delete/create/update) must scope its fetch to the photo type, or the bio
  // record for artist:'tim' loads into `pics` and shows up as a deletable
  // "photo" in Manage Photos.
  describe('refreshPics scoping (TimShermanMusic#40)', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('scopes the post-delete pics refresh to the photo type', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

      renderAdminPanel(adminAuthMock);
      fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
      fireEvent.click(screen.getByRole('button', { name: 'Manage Slideshow Photos' }));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Delete photo Slide 1' }));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('type=TimShermanMusic-music'));
      });

      confirmSpy.mockRestore();
    });
  });

  describe('mobile (cellphone) login direct redirect', () => {
    let originalInnerWidth: number;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    it('redirects directly to Google login on mobile when clicked and not logged in', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      renderAdminPanel(defaultAuthMock);
      const trigger = screen.getByRole('button', { name: 'Open Admin Portal' });
      fireEvent.click(trigger);

      expect(mockLoginWithGoogle).toHaveBeenCalled();
      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
    });

    it('opens the admin dashboard on mobile when clicked and logged in as admin', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      renderAdminPanel(adminAuthMock);
      const trigger = screen.getByRole('button', { name: 'Open Admin Portal' });
      fireEvent.click(trigger);

      expect(mockLoginWithGoogle).not.toHaveBeenCalled();
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('stops event propagation on dialog panel clicks', () => {
    renderAdminPanel(adminAuthMock);
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));

    const panel = screen.getByLabelText('Admin control dialog panel');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const spy = vi.spyOn(clickEvent, 'stopPropagation');

    fireEvent(panel, clickEvent);
    expect(spy).toHaveBeenCalled();
  });
});
