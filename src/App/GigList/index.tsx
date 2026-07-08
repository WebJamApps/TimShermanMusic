/**
 * @file index.tsx
 * @description List of upcoming gigs for Tim Sherman Music, fetched from web-jam-back.
 */

import { useContext } from 'react';
import { DataContext, Igig } from '../../providers/Data.provider';
import './gig-list.css';

export function GigList() {
  const { gigs } = useContext(DataContext);

  // Helper to format date nicely
  const formatDate = (isoString?: string | null): string => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Helper to format time/duration range nicely
  const formatTime = (isoString?: string | null, duration?: number): string => {
    if (!isoString) return '';
    try {
      const startDate = new Date(isoString);
      const startStr = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      if (!duration || duration <= 0) return startStr;
      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
      const endStr = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${startStr} - ${endStr}`;
    } catch {
      return '';
    }
  };

  const renderTickets = (tickets?: string) => {
    if (!tickets) return <span className="tickets-free">Free Entry</span>;
    
    const trimmed = tickets.trim();
    if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://')) {
      return (
        <a href={trimmed} target="_blank" rel="noopener noreferrer" className="tickets-button">
          Get Tickets
        </a>
      );
    }
    
    if (trimmed.includes('<a') && trimmed.includes('href')) {
      return <div className="tickets-html" dangerouslySetInnerHTML={{ __html: trimmed }} />;
    }

    return <span className="tickets-text">{trimmed}</span>;
  };

  const getGigLocation = (gig: Igig): string => {
    if (gig.location) return gig.location;
    if (gig.city && gig.usState) return `${gig.city}, ${gig.usState}`;
    return gig.city || '';
  };

  // Filter out past gigs (including today)
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const boundaryIso = now.toISOString();

  const upcomingGigs = gigs
    ? gigs
        .filter(g => typeof g.datetime === 'string' && g.datetime >= boundaryIso)
        .sort((a, b) => {
          if (a.datetime && b.datetime) {
            return a.datetime.localeCompare(b.datetime);
          }
          return 0;
        })
    : [];

  let content;
  if (gigs === null) {
    content = (
      <div className="gigs-loading" data-testid="gigs-loading">
        <div className="spinner"></div>
        <p>Loading gigs...</p>
      </div>
    );
  } else if (upcomingGigs.length === 0) {
    content = (
      <div className="gigs-empty" data-testid="gigs-empty">
        <p>No upcoming performances scheduled. Check back soon!</p>
      </div>
    );
  } else {
    content = (
      <div className="gigs-list">
        {upcomingGigs.map(gig => (
          <div key={gig._id || `${gig.venue}-${gig.datetime}`} className="gig-card" data-testid="gig-item">
            <div className="gig-date-badge">
              <span className="gig-day">
                {gig.datetime ? new Date(gig.datetime).toLocaleDateString('en-US', { day: 'numeric' }) : ''}
              </span>
              <span className="gig-month">
                {gig.datetime ? new Date(gig.datetime).toLocaleDateString('en-US', { month: 'short' }) : ''}
              </span>
            </div>
            <div className="gig-details">
              <h3 className="gig-venue">{gig.venue}</h3>
              <div className="gig-meta">
                <span className="gig-meta-item gig-location">
                  <svg className="gig-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {getGigLocation(gig)}
                </span>
                <span className="gig-meta-item gig-time">
                  <svg className="gig-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formatTime(gig.datetime, gig.duration) || gig.time}
                </span>
              </div>
              <div className="gig-full-date">
                {formatDate(gig.datetime) || gig.date}
              </div>
            </div>
            <div className="gig-actions">
              {renderTickets(gig.tickets)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="gigs-section" aria-labelledby="gigs-heading">
      <h2 id="gigs-heading" className="gigs-title">
        Upcoming Performances
      </h2>
      {content}
    </section>
  );
}
