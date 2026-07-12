/**
 * @file index_admin.spec.tsx
 * @description Unit tests for the App component combined with AdminPanel and GigList interactions.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../src/App';
import { AuthContext } from '../../src/providers/Auth.provider';
import { DataContext } from '../../src/providers/Data.provider';

// Mock adminActions
vi.mock('../../src/lib/adminActions', () => ({
  deleteGig: vi.fn((id, token, cb) => cb && cb()),
}));

const mockGigs = [
  {
    _id: 'g1',
    venue: 'Future Club',
    datetime: '2026-12-15T19:00:00.000Z',
    location: 'Arlington, VA',
    tickets: 'https://tickets.com/g1',
  },
];

const mockAuthAdmin = {
  auth: {
    isAuthenticated: true,
    token: 'admin-token',
    error: '',
    user: { email: 'timsherman75@gmail.com', userType: 'tim-admin' },
  },
  setAuth: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
};

const mockDataGigs = {
  pics: [],
  gigs: mockGigs,
  setPics: vi.fn(),
  setGigs: vi.fn(),
};

describe('App Component Admin Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin badge, opens edit, and handles deletions', async () => {
    render(
      <AuthContext.Provider value={mockAuthAdmin}>
        <DataContext.Provider value={mockDataGigs as any}>
          <App />
        </DataContext.Provider>
      </AuthContext.Provider>
    );

    // Open Admin Portal
    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Portal' }));
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

    // Click Enter Edit Mode
    fireEvent.click(screen.getByRole('button', { name: 'Toggle admin edit mode' }));

    // Badge should be active
    expect(screen.getByTestId('admin-badge')).toBeInTheDocument();
    expect(screen.getByText('Admin Editing Mode Active')).toBeInTheDocument();

    // Find inline Edit and Delete buttons on gig card
    const editBtn = screen.getByRole('button', { name: 'Edit' });
    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    // Click Edit to open edit form
    fireEvent.click(editBtn);
    expect(screen.getByText('Edit Performance')).toBeInTheDocument();

    // Click Delete and confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    fireEvent.click(deleteBtn);
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
