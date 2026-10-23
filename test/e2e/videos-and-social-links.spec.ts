import { test, expect } from '@playwright/test';

const PLAYER_ADDRESS = 'https://www.youtube.com/embed/videoseries?list=PLdxKg_26VhE0';

const EXPECTED_SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/tim.sherman.1213',
    label: 'Tim Sherman on Facebook',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/timey_shermaney/',
    label: 'Tim Sherman on Instagram',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@timsherman4865',
    label: 'Tim Sherman on YouTube',
  },
];

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

  // Stubs backend requests, returning a fixed bio so the About Tim card renders
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

test('videos card and round social buttons device check', async ({ page }, testInfo) => {
  await page.goto('/');

  // Wait for finite entry animations (logoFadeIn 1s, cardFadeIn 0.8s) to complete
  await page.evaluate(async () => {
    const finiteAnimations = document
      .getAnimations()
      .filter(a => a.effect?.getTiming().iterations !== Infinity);
    await Promise.all(finiteAnimations.map(a => a.finished));
  });

  const aboutTimSection = page.locator('section[data-testid="bio-section"]');
  const aboutTimCard = aboutTimSection.locator('.bio-card');
  await expect(aboutTimCard).toBeVisible();

  const videosSection = page.locator('section[data-testid="videos-section"]');
  const videosCard = videosSection.locator('.video-card');
  await expect(videosCard).toBeVisible();

  // Verify gig list rendered in deterministic fixture state (not loading)
  const gigItem = page.locator('[data-testid="gig-item"]');
  await expect(gigItem.first()).toBeVisible();

  // 1. The three social buttons are visible, each at least 44 by 44 pixels,
  // all with the same top edge (one row), in the order Facebook, Instagram, YouTube,
  // each with the exact href, target, rel and accessible name from "The social links".
  const socialButtons = page.locator('.social-links a');
  await expect(socialButtons).toHaveCount(3);

  const boxes: { x: number; y: number; width: number; height: number }[] = [];

  for (const [i, expected] of EXPECTED_SOCIAL_LINKS.entries()) {
    const btn = socialButtons.nth(i);

    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', expected.href);
    await expect(btn).toHaveAttribute('target', '_blank');
    await expect(btn).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(btn).toHaveAccessibleName(expected.label);

    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    boxes.push(box!);
  }

  // All three buttons share the same top edge (one row)
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThanOrEqual(1);
  expect(Math.abs(boxes[1].y - boxes[2].y)).toBeLessThanOrEqual(1);

  // 2. The Videos section comes directly after the About Tim section in the page,
  // and its top edge is below About Tim's bottom edge.
  const isDirectlyAfter = await page.evaluate(() => {
    const bio = document.querySelector('section[data-testid="bio-section"]') as HTMLElement | null;
    const next = bio?.nextElementSibling as HTMLElement | null;
    return next?.dataset.testid === 'videos-section';
  });
  expect(isDirectlyAfter).toBe(true);

  const bioBox = await aboutTimSection.boundingBox();
  const videosBox = await videosSection.boundingBox();
  expect(bioBox).not.toBeNull();
  expect(videosBox).not.toBeNull();
  expect(videosBox!.y).toBeGreaterThanOrEqual(bioBox!.y + bioBox!.height);

  // 3. The Videos card is the same width as the About Tim card, within 1 pixel.
  const bioCardBox = await aboutTimCard.boundingBox();
  const videosCardBox = await videosCard.boundingBox();
  expect(bioCardBox).not.toBeNull();
  expect(videosCardBox).not.toBeNull();
  expect(Math.abs(videosCardBox!.width - bioCardBox!.width)).toBeLessThanOrEqual(1);

  // 4. The player's src is exactly the player address, and its height is its width × 9 / 16, within 2 pixels.
  const iframe = videosCard.locator('iframe');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', PLAYER_ADDRESS);

  const iframeBox = await iframe.boundingBox();
  expect(iframeBox).not.toBeNull();
  const expectedIframeHeight = (iframeBox!.width * 9) / 16;
  expect(Math.abs(iframeBox!.height - expectedIframeHeight)).toBeLessThanOrEqual(2);

  // 5. The page does not scroll sideways: the document's scrollWidth is no larger than its clientWidth.
  const hasNoHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
  });
  expect(hasNoHorizontalScroll).toBe(true);

  // In the desktop project it also asserts that hovering the Instagram button turns its colour to rgb(197, 160, 89).
  if (testInfo.project.name === 'desktop') {
    const instagramButton = socialButtons.nth(1);
    await instagramButton.hover();
    await expect
      .poll(async () => {
        return instagramButton.evaluate(el => window.getComputedStyle(el).color);
      })
      .toBe('rgb(197, 160, 89)');
  }
});
