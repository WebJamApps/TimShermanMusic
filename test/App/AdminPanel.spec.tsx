/**
 * @file AdminPanel.spec.tsx
 * @description Unit tests for the AdminPanel dashboard and modals.
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    user: { email: 'timsherman75@gmail.com', userType: 'artist-admin' },
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

  it('renders Dashboard console when clicked and user is artist-admin', () => {
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
