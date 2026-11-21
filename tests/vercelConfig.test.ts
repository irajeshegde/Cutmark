import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND } from '../src/brand';

const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));

describe('vercel.json', () => {
  it('sends the old AudioSlice address permanently to the Cutmark site, keeping the path', () => {
    const rule = config.redirects.find((r: { has?: { value: string }[] }) => r.has?.[0]?.value === 'audio-slice.vercel.app');
    expect(rule).toBeDefined();
    expect(rule.permanent).toBe(true);
    expect(rule.destination).toBe(`${BRAND.siteUrl}/:path`);
  });

  it('turns the clean URLs /guide, /capabilities and /about into their hash routes', () => {
    for (const page of ['guide', 'capabilities', 'about']) {
      const rule = config.redirects.find((r: { source: string }) => r.source === `/${page}`);
      expect(rule, page).toBeDefined();
      expect(rule.destination).toBe(`/#/${page}`);
    }
  });

  it('only redirects the old host, never the new one (no redirect loop)', () => {
    for (const rule of config.redirects.filter((r: { has?: unknown }) => r.has)) {
      const hosts = (rule.has ?? []).map((h: { value: string }) => h.value);
      expect(hosts.length).toBeGreaterThan(0);
      expect(hosts).not.toContain(new URL(BRAND.siteUrl).host);
    }
  });
});
