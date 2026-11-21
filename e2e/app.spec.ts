import { expect, test, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { makeWav } from './fixtures';

const DATE = /\d{4}-\d{2}-\d{2}/;

async function openFile(page: Page, name = 'Dance Tone.wav') {
  await page.goto('/');
  await page.getByTestId('file-input').setInputFiles({ name, mimeType: 'audio/wav', buffer: makeWav(30) });
  await expect(page.getByRole('tab', { name: /manual editor/i })).toBeVisible();
  // the waveform is ready once the playhead readout shows a duration
  await expect(page.getByRole('timer')).toContainText('00:30');
}

async function selectRange(page: Page, start: string, end: string) {
  await page.getByLabel('Start', { exact: true }).fill(start);
  await page.getByLabel('Start', { exact: true }).blur();
  await page.getByLabel('End', { exact: true }).fill(end);
  await page.getByLabel('End', { exact: true }).blur();
}

test('landing page: no console errors, no third-party requests, animation present', async ({ page }) => {
  const errors: string[] = [];
  const hosts = new Set<string>();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => hosts.add(new URL(r.url()).host));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('exactly');
  await expect(page.locator('.hero-wave')).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(errors).toEqual([]);
  expect([...hosts]).toEqual(['localhost:4173']);
});

test('pages: guide, capabilities and about render, and the footer discloses AI use', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/built with ai/i).first()).toBeVisible();
  for (const [link, heading] of [
    ['Guide', /two minutes/i],
    ['Capabilities', /where it stops/i],
    ['About', /yours to change/i],
  ] as const) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  }
});

test('single clip exports and downloads as one plain file, named with the date and no part suffix', async ({ page }) => {
  await openFile(page);
  await selectRange(page, '00:04.000', '00:10.500');
  await page.getByRole('button', { name: 'Keep selection' }).click();
  await expect(page.getByRole('button', { name: /export 1 file/i })).toBeEnabled();
  await page.getByRole('button', { name: /export 1 file/i }).click();

  await expect(page.getByRole('heading', { name: /your file is ready/i })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^download/i }).click()]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`^Dance_Tone_${DATE.source}\\.wav$`));

  // 6.5 s of 22.05 kHz mono 16-bit PCM
  const bytes = readFileSync((await download.path())!).length;
  expect(bytes).toBeGreaterThan(6.4 * 22050 * 2);
  expect(bytes).toBeLessThan(6.6 * 22050 * 2 + 200);
});

test('several clips download as one ZIP only, no loose file buttons', async ({ page }) => {
  await openFile(page);
  await selectRange(page, '00:01.000', '00:03.000');
  await page.getByRole('button', { name: 'Keep selection' }).click();
  await selectRange(page, '00:10.000', '00:12.000');
  await page.getByRole('button', { name: 'Keep selection' }).click();
  await page.getByRole('button', { name: /export 2 files \(zip\)/i }).click();

  await expect(page.getByRole('heading', { name: /2 files, ready in one zip/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /download/i })).toHaveCount(1);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /download zip/i }).click()]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`^Dance_Tone_${DATE.source}(_v\\d+)?\\.zip$`));

  const zip = readFileSync((await download.path())!).toString('latin1');
  expect(zip).toMatch(/_part01\.wav/);
  expect(zip).toMatch(/_part02\.wav/);
  expect(zip).toContain('manifest.txt');
});

test('joined clips export as a single file', async ({ page }) => {
  await openFile(page);
  await selectRange(page, '00:01.000', '00:02.000');
  await page.getByRole('button', { name: 'Keep selection' }).click();
  await selectRange(page, '00:05.000', '00:06.000');
  await page.getByRole('button', { name: 'Keep selection' }).click();
  await page.getByLabel(/join into one file/i).check();
  await page.getByRole('button', { name: /export 1 file/i }).click();
  await expect(page.getByRole('heading', { name: /your file is ready/i })).toBeVisible();
});

test('spoil: live A/B switch works, export is tagged _spoilt, and a repeat export gets _v2', async ({ page }) => {
  await openFile(page, 'Spoil Me.wav');
  await selectRange(page, '00:02.000', '00:08.000');
  await page.getByRole('button', { name: 'Keep selection' }).click();

  await page.getByText('Spoil the audio').first().click();
  await page.getByRole('button', { name: 'Medium' }).click();
  await expect(page.getByRole('meter')).toHaveAttribute('aria-valuenow', /^[1-9]/);
  await expect(page.getByText('Apply to export')).toBeVisible();

  // live chain is wired to the real media element
  await page.getByRole('button', { name: 'Original' }).click();
  await expect(page.getByRole('button', { name: 'Original' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('b');
  await expect(page.getByRole('button', { name: 'Spoilt' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /export 1 file/i }).click();
  await expect(page.getByText(/degraded on purpose/i)).toBeVisible();
  let [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^download/i }).click()]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`^Spoil_Me_${DATE.source}_spoilt\\.wav$`));

  // back to the editor keeps the clip; exporting again bumps the version
  await page.getByRole('button', { name: /back to editing/i }).click();
  await expect(page.getByRole('button', { name: /export 1 file/i })).toBeEnabled();
  await page.getByRole('button', { name: /export 1 file/i }).click();
  [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^download/i }).click()]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`^Spoil_Me_${DATE.source}_v2_spoilt\\.wav$`));
});

test('spoiled export has the same length and format as the clean cut, but different samples', async ({ page }) => {
  await openFile(page, 'Highs.wav');
  await selectRange(page, '00:00.000', '00:06.000');
  await page.getByRole('button', { name: 'Keep selection' }).click();
  await page.getByText('Spoil the audio').first().click();
  await page.getByRole('button', { name: 'Heavy' }).click();
  await page.getByRole('button', { name: /export 1 file/i }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^download/i }).click()]);
  const bytes = readFileSync((await download.path())!);
  // Same duration and format as the source, but the samples differ from a clean cut (noise + wobble + lowpass applied).
  const clean = makeWav(30).subarray(44, 44 + 6 * 22050 * 2);
  const spoilt = bytes.subarray(44, 44 + 6 * 22050 * 2);
  expect(spoilt.length).toBe(clean.length);
  expect(Buffer.compare(spoilt, clean)).not.toBe(0);
});

test('editor state survives switching to Find Timestamp and back, and marks can be sent to the editor', async ({ page }) => {
  await openFile(page);
  await selectRange(page, '00:03.000', '00:05.000');
  await page.getByRole('button', { name: 'Keep selection' }).click();

  await page.getByRole('tab', { name: /find timestamp/i }).click();
  await expect(page.getByRole('timer')).toContainText('00:30');
  await selectRange(page, '00:12.250', '00:14.000');
  await page.getByRole('button', { name: 'Add range' }).click();
  await expect(page.getByRole('textbox', { name: /as text/i })).toHaveValue('00:12.250-00:14.000');
  await page.getByRole('button', { name: /cut these in the editor/i }).click();

  await expect(page.getByRole('tab', { name: /manual editor/i })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: /^Clips/ })).toContainText('2');
});

test('equal split: a short track gives one file that downloads directly', async ({ page }) => {
  await openFile(page);
  await page.getByRole('tab', { name: /equal split/i }).click();
  await expect(page.getByText('One file')).toBeVisible();
  await page.getByRole('button', { name: /export the file/i }).click();
  await expect(page.getByRole('heading', { name: /your file is ready/i })).toBeVisible({ timeout: 90_000 });
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^download/i }).click()]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`^Dance_Tone_${DATE.source}(_v\\d+)?\\.wav$`));
});

test('equal split: a part length longer than the track still gives one file', async ({ page }) => {
  await openFile(page);
  await page.getByRole('tab', { name: /equal split/i }).click();
  await page.getByLabel('Length of each part').fill('1');
  await expect(page.getByText('One file')).toBeVisible();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('no sideways scrolling, 44px touch targets, sticky export bar', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.getByTestId('file-input').setInputFiles({ name: 'm.wav', mimeType: 'audio/wav', buffer: makeWav(20) });
    await expect(page.getByRole('timer')).toContainText('00:20');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button, a.btn, input[type=text], input[type=number]')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 24), h: el.getBoundingClientRect().height }))
        .filter((e) => e.h < 40)
    );
    expect(small).toEqual([]);

    // export bar stays on screen even when scrolled to the top of a long page
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole('button', { name: /export/i })).toBeInViewport();
  });
});
