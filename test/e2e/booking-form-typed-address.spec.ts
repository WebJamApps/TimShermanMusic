import { test, expect } from '@playwright/test';

const FIXTURE_GIGS = [
  {
    _id: 'gig-fixture-1',
    venue: 'The Spot on Kirk',
    datetime: '2026-12-15T19:00:00.000Z',
    location: 'Roanoke, VA',
    tickets: 'Free',
    artist: 'tim',
  },
];

test.beforeEach(async ({ page }) => {
  // Answers requests to YouTube embed with an empty page
  await page.route('https://www.youtube.com/embed/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!DOCTYPE html><html><body><div>YouTube Player Stub</div></body></html>',
    });
  });

  // Stubs backend requests so cards render deterministically
  await page.route('**/book**', async route => {
    const url = route.request().url();
    if (url.includes('type=bio')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            comments:
              'Tim Sherman — Trombonist and vocalist based in Virginia. '
              + 'Tim has performed with various ensembles including as the leader of his own jazz combo.\n\n'
              + 'Tim’s influences range from traditional to modern: '
              + 'from Duke Ellington and Cole Porter to the Beatles and more.',
          },
        ]),
      });
      return;
    }
    if (url.includes('type=branding')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            title: 'Tim Sherman',
            comments: 'Soulful Gigs, Live Music & Booking',
          },
        ]),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Intercept WebSocket connections to isolate SocketCluster gig fetching
  await page.routeWebSocket(/.*/, ws => {
    ws.onMessage(message => {
      if (typeof message !== 'string' || !message.startsWith('{')) return;
      try {
        const packet = JSON.parse(message);
        switch (packet.event) {
          case '#handshake':
            ws.send(
              JSON.stringify({
                rid: packet.cid,
                data: { id: 'fixture-socket', pingTimeout: 20000, isAuthenticated: false },
              }),
            );
            break;
          case '#subscribe':
            ws.send(JSON.stringify({ rid: packet.cid }));
            break;
          case 'gigsForArtist':
          case 'initial message':
            ws.send(
              JSON.stringify({
                event: 'allGigs:tim',
                data: FIXTURE_GIGS,
              }),
            );
            break;
          default:
            break;
        }
      } catch {
        // ignore malformed message
      }
    });
  });
});

test('submits typed venue address when Google Maps script fails to load', async ({ page }) => {
  // Abort Google Maps scripts to simulate address lookup being unavailable
  await page.route(/.*maps\.googleapis\.com.*/, async route => {
    await route.abort();
  });

  // Capture POST /inquiry payload
  let postedPayload: Record<string, unknown> | null = null;
  await page.route('**/inquiry', async route => {
    postedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Inquiry received' }),
    });
  });

  // Fix browser clock so date validation is deterministic
  await page.clock.setFixedTime(new Date('2026-10-23T12:00:00Z'));

  await page.goto('/');

  // Wait for finite entry animations to complete
  await page.evaluate(async () => {
    const finiteAnimations = document
      .getAnimations()
      .filter(a => a.effect?.getTiming().iterations !== Infinity);
    await Promise.all(finiteAnimations.map(a => a.finished));
  });

  // Verify the unavailable note is shown
  await expect(
    page.getByText("Address suggestions are unavailable. Type the venue's full street address."),
  ).toBeVisible();

  const venueInput = page.getByLabel('Venue Address');
  await expect(venueInput).toBeEnabled();

  const submitButton = page.getByRole('button', { name: 'Submit Booking Request' });
  await expect(submitButton).toBeDisabled();

  // Fill in booking form fields
  await page.getByLabel('Full Name').fill('Jane Doe');
  await page.getByLabel('Email Address').fill('jane.doe@example.com');
  await page.getByLabel('Phone Number').fill('540-555-9876');
  await page.getByLabel('Event Date').fill('2026-10-25');
  await page.getByLabel('Event Type').selectOption('brewery-winery');
  await page.getByLabel('Message & Event Details').fill('Looking forward to booking Tim for our fall festival.');

  // Submit button remains disabled until address is typed
  await expect(submitButton).toBeDisabled();

  // Type the venue address
  await venueInput.fill('456 Grandin Road, Roanoke, VA 24015');

  // Assert Send button is now enabled
  await expect(submitButton).toBeEnabled();

  // Submit the form
  await submitButton.click();

  // Assert confirmation is displayed
  await expect(page.getByText('Inquiry Sent!')).toBeVisible();

  // Assert posted payload carries venueAddress and no venuePlaceId
  expect(postedPayload).not.toBeNull();
  const payload = postedPayload as unknown as Record<string, unknown>;
  expect(payload.artist).toBe('tim');
  expect(payload.form).toBe('tim-booking');
  expect(payload.venueAddress).toBe('456 Grandin Road, Roanoke, VA 24015');
  expect(payload).not.toHaveProperty('venuePlaceId');
});
