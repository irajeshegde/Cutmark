/**
 * Single source of truth for the product name and project links.
 * Renaming the product = edit this file, plus package.json "name" and the
 * static copies in index.html / public/*.svg (see the rename checklist in
 * docs/ARCHITECTURE.md).
 */
export const BRAND = {
  name: 'Cutmark',
  tagline: 'Cut audio where it should be cut.',
  description:
    'Cut, split, trim and time-mark MP3, WAV, M4A and other audio files entirely in your browser. No uploads, no account, no server.',
  repoUrl: 'https://github.com/irajeshegde/Cutmark',
  siteUrl: 'https://cutmark.vercel.app',
  license: 'MIT',
  /** Used for localStorage keys and ZIP manifest text. */
  slug: 'cutmark',
} as const;

export const REPO_LINKS = {
  issues: `${BRAND.repoUrl}/issues`,
  newIssue: `${BRAND.repoUrl}/issues/new/choose`,
  pulls: `${BRAND.repoUrl}/pulls`,
  contributing: `${BRAND.repoUrl}/blob/main/CONTRIBUTING.md`,
  license: `${BRAND.repoUrl}/blob/main/LICENSE`,
} as const;
