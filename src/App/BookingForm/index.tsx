/**
 * @file index.tsx
 * @description Tim Sherman Music booking and contact form component.
 * Reuses the inquiry submission pattern from JaMmusic, customized for Tim's fields and scoped to artist 'tim'.
 */

import { useState, ChangeEvent, FormEvent } from 'react';
import { VenueAddress } from './VenueAddress';
import './booking-form.css';

declare const process: {
  env: {
    BackendUrl?: string;
  };
};

export interface IBookingFormData {
  artist: string;
  form: string;
  website: string;
  formLoadedAt: number;
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  venuePlaceId: string;
  message: string;
}

const eventTypes = [
  ['brewery-winery', 'Brewery or winery'],
  ['restaurant-bar', 'Restaurant or bar'],
  ['wedding', 'Wedding'],
  ['private-party', 'Private party'],
  ['festival-fair', 'Festival or fair'],
  ['church', 'Church event'],
  ['corporate', 'Corporate event'],
  ['other', 'Other'],
] as const;

function emptyForm(): IBookingFormData {
  return {
    artist: 'tim',
    form: 'tim-booking',
    website: '',
    formLoadedAt: Date.now(),
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventType: '',
    venuePlaceId: '',
    message: '',
  };
}

function today(): string {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function validEventDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today()) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function BookingForm() {
  const [formData, setFormData] = useState<IBookingFormData>(emptyForm);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Simple and robust email validation regex
  const validateEmail = (emailStr: string): boolean => {
    const regEx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return regEx.test(emailStr) && emailStr.includes('.');
  };

  // Client-side validation function to toggle the submit button and provide feedback
  const isFormInvalid = (): boolean => {
    const { name, email, phone, eventDate, eventType, venuePlaceId, message } = formData;
    if (!name.trim()) return true;
    if (!validateEmail(email)) return true;
    if (!phone.trim()) return true;
    if (!validEventDate(eventDate)) return true;
    if (eventTypes.every(([value]) => value !== eventType)) return true;
    if (!venuePlaceId) return true;
    if (!message.trim()) return true;
    return false;
  };

  function handleInputChange(
    evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { id, value } = evt.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  }

  async function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    if (isSubmitting || isFormInvalid()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // In production, process.env.BackendUrl is injected by vite.
    // In dev, fall back to localhost. Never use localhost in production builds.
    const backendUrl =
      process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

    try {
      const res = await fetch(`${backendUrl}/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const body: unknown = await res.json();
          if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
            setSubmitError(body.message);
            return;
          }
        }
        throw new Error(`${res.status} ${res.statusText}`);
      }

      setHasSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(
        'Sorry, we could not deliver your inquiry at this moment. Please try again, or email us directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    setFormData(emptyForm());
    setHasSubmitted(false);
    setSubmitError(null);
  };

  // Compute email validation class name to avoid nested ternary warning
  let emailClass = 'form-input';
  if (formData.email) {
    emailClass += validateEmail(formData.email) ? ' is-valid' : ' is-invalid';
  }

  if (hasSubmitted) {
    return (
      <div className="booking-card success-card" role="alert" aria-live="polite">
        <div className="success-icon-wrapper">
          <svg
            className="success-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="success-title">Inquiry Sent!</h2>
        <p className="success-message">
          Thank you for reaching out to book Tim. Your request has been received, and we will get back to you as soon as possible.
        </p>
        <button
          onClick={handleReset}
          className="reset-button btn-premium"
          type="button"
        >
          Send Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="booking-card">
      <div className="booking-header">
        <h2 className="booking-title">Book Tim Sherman</h2>
        <p className="booking-subtitle">
          Fill out the form below to book Tim for your next event or get in touch.
        </p>
      </div>

      {submitError && (
        <div className="error-alert" role="alert">
          <p className="error-text">{submitError}</p>
          <p className="error-fallback">
            Direct Booking Email:{' '}
            <a href="mailto:timsherman75@gmail.com" className="email-link">
              timsherman75@gmail.com
            </a>
          </p>
        </div>
      )}

      <form id="booking-contact-form" onSubmit={handleSubmit} noValidate className="booking-form-element">
        <div className="booking-bot-trap" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            aria-label="Website"
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-grid">
          {/* Name Field */}
          <div className="form-group full-width">
            <label htmlFor="name" className="form-label">
              Full Name <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="name"
              aria-label="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${formData.name.trim() ? 'is-valid' : ''}`}
              placeholder="e.g. John Doe"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required-asterisk">*</span>
            </label>
            <input
              type="email"
              id="email"
              aria-label="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className={emailClass}
              placeholder="e.g. john@example.com"
              required
              disabled={isSubmitting}
            />
            {formData.email && !validateEmail(formData.email) && (
              <span className="field-error-msg">Please enter a valid email address</span>
            )}
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number <span className="required-asterisk">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              aria-label="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
              className={`form-input ${formData.phone.trim() ? 'is-valid' : ''}`}
              placeholder="e.g. 555-123-4567"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Event Date Field */}
          <div className="form-group">
            <label htmlFor="eventDate" className="form-label">
              Event Date <span className="required-asterisk">*</span>
            </label>
            <input
              type="date"
              id="eventDate"
              aria-label="Event Date"
              value={formData.eventDate}
              min={today()}
              aria-invalid={Boolean(formData.eventDate && !validEventDate(formData.eventDate))}
              aria-describedby="event-date-help"
              onChange={handleInputChange}
              className={`form-input ${validEventDate(formData.eventDate) ? 'is-valid' : ''}`}
              required
              disabled={isSubmitting}
            />
            <span id="event-date-help" className="field-help">Choose today or a future date.</span>
          </div>

          <div className="form-group">
            <label htmlFor="eventType" className="form-label">
              Event Type <span className="required-asterisk">*</span>
            </label>
            <select
              aria-label="Event Type"
              id="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={isSubmitting}
            >
              <option value="">Choose an event type</option>
              {eventTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <VenueAddress
            placeId={formData.venuePlaceId}
            onSelect={venuePlaceId => { setFormData(prev => ({ ...prev, venuePlaceId })); }}
            disabled={isSubmitting}
          />

          {/* Message Field */}
          <div className="form-group full-width">
            <label htmlFor="message" className="form-label">
              Message & Event Details <span className="required-asterisk">*</span>
            </label>
            <textarea
              id="message"
              aria-label="Message & Event Details"
              value={formData.message}
              onChange={handleInputChange}
              className={`form-input form-textarea ${formData.message.trim() ? 'is-valid' : ''}`}
              placeholder="Tell us about your event (venue, duration, expectations, etc.)..."
              required
              disabled={isSubmitting}
              rows={4}
            />
          </div>
        </div>

        <div className="form-footer">
          <span className="required-notice">
            <span className="required-asterisk">*</span> Required fields
          </span>
          <button
            type="submit"
            disabled={isSubmitting || isFormInvalid()}
            className={`btn-premium submit-button ${isSubmitting ? 'is-loading' : ''}`}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              'Submit Booking Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
