import { test, expect } from '@playwright/test';

test.describe('For Fun route navigation', () => {
  test('navigates via sidebar button and renders carousel', async ({ page }) => {
    await page.goto('/');

    const forFunNav = page.getByRole('button', { name: 'For Fun' });
    await forFunNav.click();

    await expect(page).toHaveURL(/#for-fun$/);
    await expect(page).toHaveTitle(/For Fun - WalleOS$/);

    const forFunSection = page.locator('[data-for-fun-root]');
    await expect(forFunSection).toBeVisible();
    await expect(page.locator('.slider')).toBeVisible();
    await expect(page.locator('.slide')).toBeVisible();
    await expect(page.locator('.slide-main-img')).toBeVisible();
    await expect(page.locator('.slide-copy')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer .slider-counter')).toBeVisible();
  });

  test('loads For Fun route directly via hash', async ({ page }) => {
    await page.goto('/#for-fun');

    const slider = page.locator('.slider');
    await expect(slider).toBeVisible();
    await expect(page.locator('.slider-counter .count p')).toHaveText('1');
  });

  test('navigates between slides with scroll', async ({ page }) => {
    await page.goto('/#for-fun');

    const counter = page.locator('.slider-counter .count p');
    await expect(counter).toHaveText('1');

    const initialTitle = await page.locator('.slide-title h1').first().textContent();

    await page.evaluate(() => {
      window.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 800, bubbles: true, cancelable: true })
      );
    });

    await expect(counter).toHaveText('2', { timeout: 2000 });

    const activeTitle = await page.locator('.slide-title h1[data-active="true"]').textContent();
    expect(activeTitle && activeTitle.trim()).not.toEqual(initialTitle?.trim());
  });

  test('wraps from last to first slide', async ({ page }) => {
    await page.goto('/#for-fun');

    const counter = page.locator('.slider-counter .count p');
    await expect(counter).toHaveText('1');

    for (let index = 0; index < 6; index += 1) {
      await page.evaluate(() => {
        window.dispatchEvent(
          new WheelEvent('wheel', { deltaY: 800, bubbles: true, cancelable: true })
        );
      });

      await expect(counter).toHaveText(String(index + 2), { timeout: 2000 });
    }

    await expect(counter).toHaveText('7');

    await page.evaluate(() => {
      window.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 800, bubbles: true, cancelable: true })
      );
    });

    await expect(counter).toHaveText('1', { timeout: 2000 });
  });

  test('respects reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#for-fun');

    const counter = page.locator('.slider-counter .count p');
    await expect(counter).toHaveText('1');

    const start = Date.now();
    await page.evaluate(() => {
      window.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 800, bubbles: true, cancelable: true })
      );
    });

    await expect(counter).toHaveText('2', { timeout: 500 });
    expect(Date.now() - start).toBeLessThan(200);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
});
