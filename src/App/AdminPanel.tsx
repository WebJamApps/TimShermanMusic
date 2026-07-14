/**
 * @file AdminPanel.tsx
 * @description Admin Panel and modals for managing gigs and slideshow pictures.
 */

import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../providers/Auth.provider';
import { DataContext } from '../providers/Data.provider';
import fetchGigs from '../providers/fetchGigs';
import {
  createGig,
  updateGig,
  createPic,
  updatePic,
  deletePic,
  updateBio,
  updateBranding,
  IGigInput,
  IPicInput,
  IBrandingInput,
} from '../lib/adminActions';
import {
  DEFAULT_PAGE_TITLE,
  DEFAULT_PAGE_SUBTITLE,
  sanitizePlainText,
} from '../lib/sanitizePlainText';
import { IBranding } from '../providers/Data.provider';
import './admin.css';

const US_STATES = [
  'Virginia', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
  'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

interface IAdminPanelProps {
  adminActive: boolean;
  setAdminActive: (active: boolean) => void;
  onEditGigSelected?: (gig: any) => void;
  onRegisterTriggerEdit?: (trigger: (gig: any) => void) => void;
}

export type SubModalType =
  | 'addGig'
  | 'editGig'
  | 'managePics'
  | 'addPic'
  | 'editPic'
  | 'editBio'
  | 'editBranding'
  | null;

const checkIsAdmin = (auth: any): boolean => {
  if (auth && auth.isAuthenticated && auth.user) {
    const { userType } = auth.user;
    // Site admins for TimShermanMusic: Developer + tim-admin (TimShermanMusic#41, TimShermanMusic#44).
    const adminRoles = ['Developer', 'tim-admin'];
    return !!(userType && adminRoles.includes(userType));
  }
  return false;
};

// 1. Sub-component for Google Login
function LoginForm({ onLogin }: { onLogin: () => void }): React.JSX.Element {
  return (
    <div className="admin-field-group full-width" style={{ textAlign: 'center', padding: '1rem 0' }}>
      <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Please sign in with Google to access the administrator capabilities.
      </p>
      <button
        aria-label="Sign In with Google"
        type="button"
        className="admin-trigger-btn"
        onClick={onLogin}
        style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }}
      >
        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M21.35,11.1H12v2.7h5.3c-0.22,1.2-1.01,2.2-2.22,2.7v2.2h3.6c2.1-1.9,3.3-4.8,3.3-8.1C22,12.3,21.8,11.7,21.35,11.1z"
          />
          <path
            fill="currentColor"
            d="M12,21c2.43,0,4.47-0.8,5.96-2.2l-3.6-2.2C13.3,17.2,12.7,17.3,12,17.3c-2.33,0-4.31-1.6-5.02-3.7H3.28v2.3C4.77,18.8,8.13,21,12,21z"
          />
          <path
            fill="currentColor"
            d="M6.98,13.6c-0.18-0.5-0.28-1.1-0.28-1.6s0.1-1.1,0.28-1.6V8.1H3.28C2.67,9.3,2.3,10.6,2.3,12s0.37,2.7,0.98,3.9L6.98,13.6z"
          />
          <path
            fill="currentColor"
            d="M12,6.7c1.3,0,2.48,0.4,3.4,1.3l2.5-2.5C16.4,4.2,14.37,3.3,12,3.3c-3.87,0-7.23,2.2-8.72,5.1l3.7,2.3C7.69,8.6,9.67,6.7,12,6.7z"
          />
        </svg>
        Sign In with Google
      </button>
    </div>
  );
}

// 2. Sub-component for Dashboard Controls
interface IDashboardProps {
  auth: any;
  adminActive: boolean;
  setAdminActive: (active: boolean) => void;
  onAddGig: () => void;
  onManagePics: () => void;
  onEditBio: () => void;
  onEditBranding: () => void;
  onLogout: () => void;
}

function Dashboard({
  auth,
  adminActive,
  setAdminActive,
  onAddGig,
  onManagePics,
  onEditBio,
  onEditBranding,
  onLogout,
}: IDashboardProps): React.JSX.Element {
  return (
    <div>
      <div className="admin-dash-welcome">
        Logged in as: <span className="admin-dash-user">{auth.user.email}</span> ({auth.user.userType})
      </div>
      <div className="admin-dash-grid">
        <div className="admin-dash-card">
          <span className="admin-dash-icon">🎸</span>
          <h4 className="admin-dash-title">Performances</h4>
          <p className="admin-dash-desc">Create, update, or remove performances.</p>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
            <button
              aria-label="Add Performance"
              type="button"
              className="admin-btn primary"
              style={{ flexGrow: 1, padding: '0.5rem' }}
              onClick={onAddGig}
            >
              Add Gig
            </button>
            <button
              aria-label="Toggle admin edit mode"
              type="button"
              className="admin-btn secondary"
              style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => setAdminActive(!adminActive)}
            >
              {adminActive ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </button>
          </div>
        </div>
        <div className="admin-dash-card">
          <span className="admin-dash-icon">📸</span>
          <h4 className="admin-dash-title">Slideshow</h4>
          <p className="admin-dash-desc">Manage slider photos and image captions.</p>
          <button
            aria-label="Manage Slideshow Photos"
            type="button"
            className="admin-btn primary"
            style={{ width: '100%', padding: '0.5rem' }}
            onClick={onManagePics}
          >
            Manage Photos
          </button>
        </div>
        <div className="admin-dash-card">
          <span className="admin-dash-icon">📝</span>
          <h4 className="admin-dash-title">Biography</h4>
          <p className="admin-dash-desc">Edit Tim's public biography page content.</p>
          <button
            aria-label="Edit Biography"
            type="button"
            className="admin-btn primary"
            style={{ width: '100%', padding: '0.5rem' }}
            onClick={onEditBio}
          >
            Edit Bio
          </button>
        </div>
        <div className="admin-dash-card">
          <span className="admin-dash-icon">🏷️</span>
          <h4 className="admin-dash-title">Site Branding</h4>
          <p className="admin-dash-desc">Edit the page title and subtitle shown at the top of the site.</p>
          <button
            aria-label="Edit site branding"
            type="button"
            className="admin-btn primary"
            style={{ width: '100%', padding: '0.5rem' }}
            onClick={onEditBranding}
          >
            Edit Title
          </button>
        </div>
      </div>
      <div
        className="admin-form-actions"
        style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}
      >
        <button aria-label="Sign out" type="button" className="admin-btn danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

// 3. Sub-component for Gig Form (Add / Edit)
interface IGigFormProps {
  initialGig?: any;
  onCancel: () => void;
  onSubmit: (gigData: IGigInput) => void;
}

function GigForm({ initialGig, onCancel, onSubmit }: IGigFormProps): React.JSX.Element {
  const formatDatetimeForInput = (isoString?: string | null): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzOffset = date.getTimezoneOffset() * 60000;
      return (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [venue, setVenue] = useState(initialGig?.venue || '');
  const [city, setCity] = useState(initialGig?.city || '');
  const [usState, setUsState] = useState(initialGig?.usState || 'Virginia');
  const [datetime, setDatetime] = useState(formatDatetimeForInput(initialGig?.datetime) || '');
  const [tickets, setTickets] = useState(initialGig?.tickets || '');
  const [duration, setDuration] = useState(initialGig?.duration || 2);
  const [promoImageUrl, setPromoImageUrl] = useState(initialGig?.promoImageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue || !city || !datetime) return;
    const isoDatetime = new Date(datetime).toISOString();
    onSubmit({
      venue,
      city,
      usState,
      tickets,
      promoImageUrl,
      datetime: isoDatetime,
      duration: Number(duration),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form-grid" data-testid="gig-form">
      <div className="admin-field-group full-width">
        <label htmlFor="venue-input" className="admin-label">Venue *</label>
        <input
          aria-label="Venue Name"
          id="venue-input"
          className="admin-input"
          type="text"
          value={venue}
          onChange={e => setVenue(e.target.value)}
          required
        />
      </div>
      <div className="admin-field-group">
        <label htmlFor="city-input" className="admin-label">City *</label>
        <input
          aria-label="City"
          id="city-input"
          className="admin-input"
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          required
        />
      </div>
      <div className="admin-field-group">
        <label htmlFor="state-select" className="admin-label">US State *</label>
        <select
          aria-label="US State"
          id="state-select"
          className="admin-select"
          value={usState}
          onChange={e => setUsState(e.target.value)}
        >
          {US_STATES.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>
      <div className="admin-field-group">
        <label htmlFor="datetime-input" className="admin-label">Date & Time *</label>
        <input
          aria-label="Date and Time"
          id="datetime-input"
          className="admin-input"
          type="datetime-local"
          value={datetime}
          onChange={e => setDatetime(e.target.value)}
          required
        />
      </div>
      <div className="admin-field-group">
        <label htmlFor="duration-input" className="admin-label">Duration (Hours)</label>
        <input
          aria-label="Duration in Hours"
          id="duration-input"
          className="admin-input"
          type="number"
          step="0.5"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>
      <div className="admin-field-group full-width">
        <label htmlFor="tickets-input" className="admin-label">Tickets URL or Info Text</label>
        <input
          aria-label="Tickets details or URL"
          id="tickets-input"
          className="admin-input"
          type="text"
          value={tickets}
          onChange={e => setTickets(e.target.value)}
          placeholder="e.g. Free Entry, or https://tickets.com"
        />
      </div>
      <div className="admin-field-group full-width">
        <label htmlFor="promo-input" className="admin-label">Promo Image URL (Optional)</label>
        <input
          aria-label="Promo Image URL"
          id="promo-input"
          className="admin-input"
          type="url"
          value={promoImageUrl}
          onChange={e => setPromoImageUrl(e.target.value)}
          placeholder="https://example.com/promo.jpg"
        />
      </div>
      <div className="admin-form-actions full-width">
        <button aria-label="Cancel editing" type="button" className="admin-btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button aria-label="Save performance" type="submit" className="admin-btn primary">
          {initialGig ? 'Update Performance' : 'Add Performance'}
        </button>
      </div>
    </form>
  );
}

// 4. Sub-component for Slideshow Photos Manager
interface IPicsManagerProps {
  pics: any[] | null;
  onAddPic: () => void;
  onEditPic: (pic: any) => void;
  onDeletePic: (picId: string) => void;
  onBack: () => void;
}

function PicsManager({
  pics,
  onAddPic,
  onEditPic,
  onDeletePic,
  onBack,
}: IPicsManagerProps): React.JSX.Element {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>
          Current slideshow carousel images.
        </p>
        <button
          aria-label="Add slide photo"
          type="button"
          className="admin-btn primary"
          onClick={onAddPic}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          + Add Photo
        </button>
      </div>
      <div className="admin-pic-list">
        {Array.isArray(pics) && pics.map(pic => (
          <div key={pic._id} className="admin-pic-row">
            <img className="admin-pic-thumb" src={pic.url} alt={pic.title} />
            <div className="admin-pic-info">
              <h5 className="admin-pic-title">{pic.title}</h5>
              <p className="admin-pic-url">{pic.url}</p>
              {pic.comments === 'showCaption' && (
                <span className="admin-pic-caption-status">Show Caption Active</span>
              )}
            </div>
            <div className="admin-pic-row-actions">
              <button
                aria-label={`Edit photo ${pic.title}`}
                type="button"
                className="admin-inline-btn"
                onClick={() => onEditPic(pic)}
              >
                Edit
              </button>
              <button
                aria-label={`Delete photo ${pic.title}`}
                type="button"
                className="admin-inline-btn delete"
                onClick={() => {
                  // eslint-disable-next-line no-alert, no-restricted-globals
                  if (confirm('Are you sure you want to delete this photo?')) {
                    onDeletePic(pic._id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        className="admin-form-actions"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '1.5rem', paddingTop: '1rem' }}
      >
        <button aria-label="Go back to dashboard" type="button" className="admin-btn secondary" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// 5. Sub-component for Picture Add/Edit Form
interface IPicFormProps {
  initialPic?: any;
  onCancel: () => void;
  onSubmit: (picData: IPicInput) => void;
}

function PicForm({ initialPic, onCancel, onSubmit }: IPicFormProps): React.JSX.Element {
  const [url, setUrl] = useState(initialPic?.url || '');
  const [title, setTitle] = useState(initialPic?.title || '');
  const [showCaption, setShowCaption] = useState(initialPic?.comments === 'showCaption');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;
    onSubmit({
      url,
      title,
      comments: showCaption ? 'showCaption' : '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form-grid">
      <div className="admin-field-group full-width">
        <label htmlFor="url-input" className="admin-label">Image URL *</label>
        <input
          aria-label="Image URL"
          id="url-input"
          className="admin-input"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
      </div>
      <div className="admin-field-group full-width">
        <label htmlFor="title-input" className="admin-label">Title / Caption *</label>
        <input
          aria-label="Title or Caption"
          id="title-input"
          className="admin-input"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="admin-field-group full-width" style={{ margin: '0.5rem 0' }}>
        <label htmlFor="caption-checkbox" className="admin-checkbox-label">
          <input
            aria-label="Display title caption"
            id="caption-checkbox"
            className="admin-checkbox"
            type="checkbox"
            checked={showCaption}
            onChange={e => setShowCaption(e.target.checked)}
          />
          Display this title/caption over the slideshow image
        </label>
      </div>
      <div className="admin-form-actions full-width">
        <button aria-label="Cancel" type="button" className="admin-btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button aria-label="Submit photo" type="submit" className="admin-btn primary">
          {initialPic ? 'Update Photo' : 'Add Photo'}
        </button>
      </div>
    </form>
  );
}

// Sub-component for Bio Form
interface IBioFormProps {
  initialBio: string;
  onCancel: () => void;
  onSubmit: (bioText: string) => void;
}

function BioForm({ initialBio, onCancel, onSubmit }: IBioFormProps): React.JSX.Element {
  const [bioText, setBioText] = useState(initialBio);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(bioText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form" data-testid="bio-form">
      <div className="admin-field-group full-width">
        <label htmlFor="bio-textarea" className="admin-label">
          Biography Text
        </label>
        <textarea
          id="bio-textarea"
          aria-label="Biography Text"
          className="admin-input"
          style={{ minHeight: '240px', fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', lineHeight: '1.5', resize: 'vertical' }}
          value={bioText}
          onChange={e => setBioText(e.target.value)}
          placeholder="Write Tim's biography here... Use double newlines for separate paragraphs."
          required
          disabled={submitting}
        />
        <span className="admin-field-help">
          Formatting tip: leave an empty line (double newline) to create a new paragraph.
        </span>
      </div>
      <div className="admin-form-actions">
        <button
          aria-label="Cancel editing bio"
          type="button"
          className="admin-btn secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          aria-label="Save biography"
          type="submit"
          className="admin-btn primary"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// Sub-component for page title / subtitle (site branding)
interface IBrandingFormProps {
  initialBranding: IBranding | null | undefined;
  onCancel: () => void;
  onSubmit: (branding: IBrandingInput) => void;
}

function BrandingForm({
  initialBranding,
  onCancel,
  onSubmit,
}: IBrandingFormProps): React.JSX.Element {
  const [title, setTitle] = useState(
    initialBranding?.title?.trim() ? initialBranding.title : DEFAULT_PAGE_TITLE,
  );
  const [subtitle, setSubtitle] = useState(
    initialBranding?.subtitle?.trim()
      ? initialBranding.subtitle
      : DEFAULT_PAGE_SUBTITLE,
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizePlainText(title);
    const cleanSubtitle = sanitizePlainText(subtitle);
    if (!cleanTitle || !cleanSubtitle) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: cleanTitle, subtitle: cleanSubtitle });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form" data-testid="branding-form">
      <div className="admin-field-group full-width">
        <label htmlFor="branding-title-input" className="admin-label">
          Page Title *
        </label>
        <input
          id="branding-title-input"
          aria-label="Page title"
          type="text"
          className="admin-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={DEFAULT_PAGE_TITLE}
          required
          maxLength={120}
          disabled={submitting}
        />
        <span className="admin-field-help">
          Shown as the large heading at the top of the site. Plain text only.
        </span>
      </div>
      <div className="admin-field-group full-width">
        <label htmlFor="branding-subtitle-input" className="admin-label">
          Subtitle / Tagline *
        </label>
        <input
          id="branding-subtitle-input"
          aria-label="Page subtitle"
          type="text"
          className="admin-input"
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          placeholder={DEFAULT_PAGE_SUBTITLE}
          required
          maxLength={200}
          disabled={submitting}
        />
        <span className="admin-field-help">
          Shown under the title. HTML and scripts are stripped on save.
        </span>
      </div>
      <div className="admin-form-actions">
        <button
          aria-label="Cancel editing branding"
          type="button"
          className="admin-btn secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          aria-label="Save branding"
          type="submit"
          className="admin-btn primary"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// Helper handlers for submit operations, extracted to keep component complexity low.
const handleAdminGigSubmit = async (
  activeSubModal: SubModalType,
  editingGig: any,
  gigData: IGigInput,
  token: string,
  onRefresh: () => void,
  onClose: () => void
) => {
  if (activeSubModal === 'addGig') {
    await createGig(gigData, token, () => {
      onRefresh();
      onClose();
    });
  } else if (activeSubModal === 'editGig' && editingGig) {
    await updateGig(editingGig._id, gigData, token, () => {
      onRefresh();
      onClose();
    });
  } else {
    // fallback
  }
};

const handleAdminPicSubmit = async (
  activeSubModal: SubModalType,
  editingPic: any,
  picData: IPicInput,
  token: string,
  onRefresh: () => void,
  onClose: () => void
) => {
  if (activeSubModal === 'addPic') {
    await createPic(picData, token, () => {
      onRefresh();
      onClose();
    });
  } else if (activeSubModal === 'editPic' && editingPic) {
    const editPicPayload = {
      _id: editingPic._id,
      url: picData.url,
      title: picData.title,
      comments: picData.comments,
      type: editingPic.type || 'TimShermanMusic-music',
    };
    await updatePic(editPicPayload, token, () => {
      onRefresh();
      onClose();
    });
  } else {
    // fallback
  }
};

// 6. External helper function to extract render dispatching and maintain strict cyclomatic complexity limits.
interface IModalRendererProps {
  activeSubModal: SubModalType;
  editingGig: any;
  editingPic: any;
  auth: any;
  pics: any[] | null;
  bio: string | null | undefined;
  branding: IBranding | null | undefined;
  adminActive: boolean;
  setAdminActive: (active: boolean) => void;
  loginWithGoogle: () => void;
  setActiveSubModal: (val: SubModalType) => void;
  setEditingPic: (val: any) => void;
  handleGigSubmit: (data: IGigInput) => void;
  handlePicSubmit: (data: IPicInput) => void;
  handleBioSubmit: (bioText: string) => void;
  handleBrandingSubmit: (branding: IBrandingInput) => void;
  handleDeletePic: (id: string) => void;
  handleLogout: () => void;
  isAdmin: boolean;
}

function getModalContent(props: IModalRendererProps): {
  modalTitle: string;
  bodyContent: React.JSX.Element;
  isWide: boolean;
} {
  if (!props.isAdmin) {
    return {
      modalTitle: 'Admin Access',
      bodyContent: <LoginForm onLogin={props.loginWithGoogle} />,
      isWide: false,
    };
  }

  switch (props.activeSubModal) {
    case 'addGig':
    case 'editGig':
      return {
        modalTitle: props.activeSubModal === 'addGig' ? 'Add New Performance' : 'Edit Performance',
        bodyContent: (
          <GigForm
            initialGig={props.activeSubModal === 'editGig' ? props.editingGig : undefined}
            onCancel={() => props.setActiveSubModal(null)}
            onSubmit={props.handleGigSubmit}
          />
        ),
        isWide: false,
      };
    case 'managePics':
      return {
        modalTitle: 'Manage Slideshow Carousel',
        bodyContent: (
          <PicsManager
            pics={props.pics}
            onAddPic={() => props.setActiveSubModal('addPic')}
            onEditPic={pic => {
              props.setEditingPic(pic);
              props.setActiveSubModal('editPic');
            }}
            onDeletePic={props.handleDeletePic}
            onBack={() => props.setActiveSubModal(null)}
          />
        ),
        isWide: true,
      };
    case 'addPic':
    case 'editPic':
      return {
        modalTitle: props.activeSubModal === 'addPic' ? 'Add Slideshow Photo' : 'Edit Slideshow Photo',
        bodyContent: (
          <PicForm
            initialPic={props.activeSubModal === 'editPic' ? props.editingPic : undefined}
            onCancel={() => props.setActiveSubModal('managePics')}
            onSubmit={props.handlePicSubmit}
          />
        ),
        isWide: false,
      };
    case 'editBio':
      return {
        modalTitle: 'Edit Biography',
        bodyContent: (
          <BioForm
            initialBio={props.bio || ''}
            onCancel={() => props.setActiveSubModal(null)}
            onSubmit={props.handleBioSubmit}
          />
        ),
        isWide: false,
      };
    case 'editBranding':
      return {
        modalTitle: 'Edit Site Branding',
        bodyContent: (
          <BrandingForm
            initialBranding={props.branding}
            onCancel={() => props.setActiveSubModal(null)}
            onSubmit={props.handleBrandingSubmit}
          />
        ),
        isWide: false,
      };
    default:
      return {
        modalTitle: 'Admin Dashboard',
        bodyContent: (
          <Dashboard
            auth={props.auth}
            adminActive={props.adminActive}
            setAdminActive={props.setAdminActive}
            onAddGig={() => props.setActiveSubModal('addGig')}
            onManagePics={() => props.setActiveSubModal('managePics')}
            onEditBio={() => props.setActiveSubModal('editBio')}
            onEditBranding={() => props.setActiveSubModal('editBranding')}
            onLogout={props.handleLogout}
          />
        ),
        isWide: false,
      };
  }
}

// Main AdminPanel Coordinator Component
export function AdminPanel({
  adminActive,
  setAdminActive,
  onEditGigSelected,
  onRegisterTriggerEdit,
}: IAdminPanelProps): React.JSX.Element {
  const { auth, loginWithGoogle, logout } = useContext(AuthContext);
  const {
    pics, setPics, setGigs, bio, setBio, branding, setBranding,
  } = useContext(DataContext);

  const [isOpen, setIsOpen] = useState(false);
  const [activeSubModal, setActiveSubModal] = useState<SubModalType>(null);
  const [editingGig, setEditingGig] = useState<any>(null);
  const [editingPic, setEditingPic] = useState<any>(null);

  const isAdmin = checkIsAdmin(auth);

  // Login is a full-page redirect (Auth.provider's loginWithGoogle), which
  // reloads the SPA on return and resets isOpen to its default (false) — so the
  // admin panel used to require a second "Admin" click after a successful login.
  // loginWithGoogle sets this flag right before redirecting; once we come back
  // authenticated, reopen the panel and clear the flag so it doesn't reopen on
  // every later page load for an already-logged-in admin.
  useEffect(() => {
    if (isAdmin && localStorage.getItem('tsm_open_admin') === '1') {
      localStorage.removeItem('tsm_open_admin');
      setIsOpen(true);
    }
  }, [isAdmin]);

  const handleTriggerEditGig = (gig: any) => {
    setEditingGig(gig);
    setActiveSubModal('editGig');
    setIsOpen(true);
  };

  useEffect(() => {
    if (onRegisterTriggerEdit) {
      onRegisterTriggerEdit(handleTriggerEditGig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterTriggerEdit]);

  // Handle parent-initiated edits
  useEffect(() => {
    if (onEditGigSelected) {
      onEditGigSelected(handleTriggerEditGig);
    }
  }, [onEditGigSelected]);

  const refreshGigs = () => {
    fetchGigs.getGigs(setGigs);
  };

  const refreshPics = () => {
    const backendUrl = process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');
    // Type-scoped to photos only, so the bio doc (type: 'bio') never lands in
    // the pics list and can't be deleted from Manage Photos (TimShermanMusic#40).
    fetch(`${backendUrl}/book?artist=tim&type=TimShermanMusic-music`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('pics refresh failed');
      })
      .then(data => {
        if (Array.isArray(data)) setPics(data);
      })
      .catch(err => console.error(err));
  };

  const refreshBio = () => {
    const backendUrl = process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');
    fetch(`${backendUrl}/book?type=bio&artist=tim`)
      .then(res => {
        if (!res.ok) {
          if (setBio) setBio('');
          return null;
        }
        return res.json();
      })
      .then(data => {
        const bioRecord = Array.isArray(data) ? data[0] : null;
        if (bioRecord && typeof bioRecord.comments === 'string') {
          if (setBio) setBio(bioRecord.comments);
        } else {
          if (setBio) setBio('');
        }
      })
      .catch(err => {
        console.error(err);
        if (setBio) setBio('');
      });
  };

  const refreshBranding = () => {
    const backendUrl = process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');
    fetch(`${backendUrl}/book?type=branding&artist=tim`)
      .then(res => {
        if (!res.ok) {
          if (setBranding) setBranding({ title: null, subtitle: null });
          return null;
        }
        return res.json();
      })
      .then(data => {
        const record = Array.isArray(data) ? data[0] : null;
        if (record && setBranding) {
          setBranding({
            title: typeof record.title === 'string' ? record.title : null,
            subtitle: typeof record.comments === 'string' ? record.comments : null,
          });
        } else if (setBranding) {
          setBranding({ title: null, subtitle: null });
        }
      })
      .catch(err => {
        console.error(err);
        if (setBranding) setBranding({ title: null, subtitle: null });
      });
  };

  const handleLogout = () => {
    logout();
    setAdminActive(false);
    setIsOpen(false);
    setActiveSubModal(null);
  };

  if (!isOpen) {
    return (
      <div className="admin-trigger-container">
        <button
          aria-label="Open Admin Portal"
          type="button"
          className="admin-trigger-btn"
          onClick={() => {
            if (!isAdmin && window.innerWidth <= 600) {
              loginWithGoogle();
            } else {
              setIsOpen(true);
            }
          }}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="admin-trigger-text">Admin</span>
        </button>
      </div>
    );
  }

  const { modalTitle, bodyContent, isWide } = getModalContent({
    activeSubModal,
    editingGig,
    editingPic,
    auth,
    pics,
    bio,
    branding,
    adminActive,
    setAdminActive,
    loginWithGoogle,
    setActiveSubModal,
    setEditingPic,
    handleLogout,
    isAdmin,
    handleDeletePic: async (picId: string) => {
      await deletePic(picId, auth.token, () => {
        refreshPics();
      });
    },
    handleGigSubmit: async (gigData: IGigInput) => {
      await handleAdminGigSubmit(
        activeSubModal,
        editingGig,
        gigData,
        auth.token,
        refreshGigs,
        () => {
          setActiveSubModal(null);
          setEditingGig(null);
        }
      );
    },
    handlePicSubmit: async (picData: IPicInput) => {
      await handleAdminPicSubmit(
        activeSubModal,
        editingPic,
        picData,
        auth.token,
        refreshPics,
        () => {
          setActiveSubModal('managePics');
          setEditingPic(null);
        }
      );
    },
    handleBioSubmit: async (bioText: string) => {
      await updateBio(bioText, auth.token, () => {
        refreshBio();
        setActiveSubModal(null);
      });
    },
    handleBrandingSubmit: async (brandingData: IBrandingInput) => {
      await updateBranding(brandingData, auth.token, () => {
        refreshBranding();
        setActiveSubModal(null);
      });
    },
  });

  return (
    <div
      aria-label="Close admin modal backdrop"
      className="admin-modal-backdrop"
      role="button"
      tabIndex={0}
      onClick={() => {
        setIsOpen(false);
        setActiveSubModal(null);
      }}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          setActiveSubModal(null);
        }
      }}
    >
      <div
        aria-label="Admin control dialog panel"
        className={`admin-modal ${isWide ? 'wide' : ''}`}
        role="button"
        tabIndex={0}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{modalTitle}</h3>
          <button
            aria-label="Close portal modal"
            type="button"
            className="admin-close-btn"
            onClick={() => {
              setIsOpen(false);
              setActiveSubModal(null);
            }}
          >
            &times;
          </button>
        </div>
        <div className="admin-modal-body">
          {bodyContent}
        </div>
      </div>
    </div>
  );
}
