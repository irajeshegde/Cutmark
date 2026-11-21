import { expect, test, Page } from '@playwright/test';
import { makeWav } from './fixtures';

async function controlled(page: Page) {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // clientsClaim: the worker takes over the already-open page
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test('manifest is valid and every icon it names loads', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();

  expect(manifest).toMatchObject({ name: 'Cutmark', short_name: 'Cutmark', display: 'standalone', start_url: '/', scope: '/' });
  const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose);
  expect(purposes).toContain('any');
  expect(purposes).toContain('maskable');
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '192x192')).toBe(true);
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
  for (const icon of manifest.icons) {
    const res = await request.get(`/${icon.src}`);
    expect(res.ok(), icon.src).toBe(true);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});

test('the app opens with no network once it has been visited', async ({ page, context }) => {
  await controlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('exactly');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Guide' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('two minutes');
  await context.setOffline(false);
});

test('cutting and exporting work fully offline after "Save for offline use"', async ({ page, context }) => {
  await controlled(page);

  // footer fallback: explicit download of the audio engine
  await page.getByRole('button', { name: /save for offline use/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /works offline/i })).toBeVisible({ timeout: 60_000 });

  await context.setOffline(true);
  await page.reload();
  await page.getByTestId('file-input').setInputFiles({ name: 'Offline.wav', mimeType: 'audio/wav', buffer: makeWav(20) });
  await expect(page.getByRole('timer')).toContainText('00:20');

  await page.getByLabel('Start', { exact: true }).fill('00:02.000');
  await page.getByLabel('Start', { exact: true }).blur();
  await page.getByLabel('End', { exact: true }).fill('00:05.000');
  await page.getByLabel('End', { exact: true }).blur();
  await page.getByRole('button', { name: 'Keep selection' }).click();
  await page.getByRole('button', { name: /export 1 file/i }).click();
  await expect(page.getByRole('heading', { name: /your file is ready/i })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^download/i }).click()]);
  expect(download.suggestedFilename()).toMatch(/^Offline_\d{4}-\d{2}-\d{2}\.wav$/);
  await context.setOffline(false);
});

test('install popup appears, can be closed, and the footer still offers install', async ({ page }) => {
  await controlled(page);
  await expect(page.getByRole('complementary', { name: /install cutmark/i })).toHaveCount(0);

  // what Chromium does when the app meets the install criteria
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    (window as unknown as { __prompted: number }).__prompted = 0;
    e.prompt = async () => { (window as unknown as { __prompted: number }).__prompted++; };
    e.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(e);
  });

  const popup = page.getByRole('complementary', { name: /install cutmark/i });
  await expect(popup).toBeVisible();
  await popup.getByRole('button', { name: /not now/i }).click();
  await expect(popup).toHaveCount(0);

  // missed or dismissed: the footer control is still there and opens the same browser dialog
  await page.getByRole('region', { name: /use it as an app/i }).getByRole('button', { name: /install app/i }).click();
  expect(await page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);

  // and the dismissal is remembered on the next visit
  await page.reload();
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    e.prompt = async () => {};
    e.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(e);
  });
  await expect(page.getByRole('complementary', { name: /install cutmark/i })).toHaveCount(0);
});

test('the popup steps aside while the footer install panel is on screen', async ({ page }) => {
  await controlled(page);
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    e.prompt = async () => {};
    e.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(e);
  });
  const popup = page.getByRole('complementary', { name: /install cutmark/i });
  await expect(popup).toBeVisible();
  await page.getByRole('region', { name: /use it as an app/i }).scrollIntoViewIfNeeded();
  await expect(popup).toHaveCount(0);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('install popup does not cause sideways scrolling and its buttons are tappable', async ({ page }) => {
    await controlled(page);
    await page.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
      e.prompt = async () => {};
      e.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(e);
    });
    const popup = page.getByRole('complementary', { name: /install cutmark/i });
    await expect(popup).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    for (const name of [/install app/i, /not now/i, /close install/i]) {
      const box = await popup.getByRole('button', { name }).boundingBox();
      expect(box!.height, String(name)).toBeGreaterThanOrEqual(40);
    }
  });
});
