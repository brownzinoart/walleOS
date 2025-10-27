import { test, expect } from '@playwright/test';

const PLAYGROUND_HASH = '#playground';

test.describe('Playground route navigation', () => {
  test('navigates via sidebar button and renders bento grid', async ({ page }) => {
    await page.goto('/');

    const playgroundNav = page.getByRole('button', { name: 'Playground' });
    await playgroundNav.click();

    await expect(page).toHaveURL(new RegExp(`${PLAYGROUND_HASH}$`));
    await expect(page).toHaveTitle(/Playground - WalleOS$/);

    const playgroundSection = page.locator('[data-playground-root]');
    await expect(playgroundSection).toBeVisible();
    await expect(page.locator('.bento-grid-container')).toBeVisible();

    const cards = page.locator('[data-bento-card]');
    await expect(cards).toHaveCount(7);
    await expect(cards.first().locator('.bento-card__title')).toContainText(/Neon Drift/i);
  });

  test('loads Playground route directly via hash', async ({ page }) => {
    await page.goto(`/${PLAYGROUND_HASH}`);

    const grid = page.locator('.bento-grid-container');
    await expect(grid).toBeVisible();
    await expect(page.locator('[data-bento-card]')).toHaveCount(7);
  });

  test('animates cards on hover', async ({ page }) => {
    await page.goto(`/${PLAYGROUND_HASH}`);

    const card = page.locator('[data-bento-card]').first();
    const initialTransform = await card.evaluate((element) => getComputedStyle(element).transform);

    await card.hover();
    await page.waitForTimeout(150);

    const hoverTransform = await card.evaluate((element) => getComputedStyle(element).transform);
    expect(hoverTransform).not.toEqual(initialTransform);
  });

  test('collapses to a single column layout on mobile widths', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 960 });
    await page.goto(`/${PLAYGROUND_HASH}`);

    const columnTemplate = await page
      .locator('.bento-grid-container')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns);

    expect(columnTemplate.trim()).toBe('1fr');
  });

  test('respects reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${PLAYGROUND_HASH}`);

    const transitionDuration = await page
      .locator('[data-bento-card]')
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);

    expect(transitionDuration).toBe('0s');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
});
