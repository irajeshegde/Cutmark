/**
 * Install + offline state for the PWA, as a tiny external store so the install
 * popup and the footer controls always agree. The browser fires
 * `beforeinstallprompt` once and early, so this module is imported (and the
 * listeners attached) from main.tsx before React mounts.
 */
import { useSyncExternalStore } from 'react';

/** Chromium's install prompt event; not in lib.dom yet. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type OfflineState = 'unknown' | 'ready' | 'downloading' | 'error';

export interface PwaState {
  /** Browser offered an install prompt we are holding. */
  canInstall: boolean;
  /** Running as an installed app (standalone window). */
  installed: boolean;
  /** iPhone/iPad Safari: no prompt exists, only "Add to Home Screen". */
  iosManual: boolean;
  /** The FFmpeg engine is cached, so the editor works with no network. */
  offline: OfflineState;
  /** A newer version is downloaded and waiting for a reload. */
  updateReady: boolean;
  /** The person closed the popup; the footer controls stay. */
  bannerDismissed: boolean;
}

export const DISMISS_KEY = 'cutmark-install-dismissed';
export const ENGINE_FILES = ['/ffmpeg/ffmpeg-core.js', '/ffmpeg/ffmpeg-core.wasm'] as const;
export const ENGINE_SIZE_LABEL = '32 MB';

/* ------------------------------ pure helpers ------------------------------ */

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** True for Safari on iPhone/iPad (including iPadOS, which reports as a Mac with touch). */
export function isIosSafari(ua: string = navigator.userAgent, maxTouchPoints: number = navigator.maxTouchPoints): boolean {
  const iPadOs = /Macintosh/.test(ua) && maxTouchPoints > 1;
  const ios = /iPhone|iPad|iPod/.test(ua) || iPadOs;
  if (!ios) return false;
  // Other iOS browsers (Chrome, Firefox, Edge) cannot add to home screen from their own UI the same way.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false; // storage blocked
  }
}

/* --------------------------------- store ---------------------------------- */

let deferred: BeforeInstallPromptEvent | null = null;
let state: PwaState = {
  canInstall: false,
  installed: false,
  iosManual: false,
  offline: 'unknown',
  updateReady: false,
  bannerDismissed: false,
};
const listeners = new Set<() => void>();
let applyUpdate: (() => void) | null = null;

function set(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): PwaState {
  return state;
}

export function usePwa(): PwaState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Test hook: reset the store to a known state. */
export function __resetPwaForTests(patch: Partial<PwaState> = {}): void {
  deferred = null;
  applyUpdate = null;
  state = {
    canInstall: false,
    installed: false,
    iosManual: false,
    offline: 'unknown',
    updateReady: false,
    bannerDismissed: false,
    ...patch,
  };
  listeners.forEach((l) => l());
}

/* -------------------------------- actions --------------------------------- */

/** Is the engine already in the browser's cache? */
export async function checkEngineCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const hits = await Promise.all(ENGINE_FILES.map((f) => caches.match(f)));
    return hits.every(Boolean);
  } catch {
    return false;
  }
}

export async function refreshOfflineState(): Promise<void> {
  if (state.offline === 'downloading') return;
  set({ offline: (await checkEngineCached()) ? 'ready' : 'unknown' });
}

/**
 * Download the FFmpeg engine now, so the editor works offline later. The service
 * worker caches the responses as they pass through it.
 */
export async function prepareOffline(): Promise<void> {
  if (state.offline === 'downloading') return;
  set({ offline: 'downloading' });
  try {
    for (const file of ENGINE_FILES) {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`${file}: ${res.status}`);
      await res.arrayBuffer(); // read it fully so the cache write completes
    }
    // The worker stores the copy asynchronously; give it a moment, then confirm.
    for (let i = 0; i < 10; i++) {
      if (await checkEngineCached()) {
        set({ offline: 'ready' });
        return;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    // No service worker controlling this page (dev server, or first load): the files came down but are not stored.
    set({ offline: 'error' });
  } catch {
    set({ offline: 'error' });
  }
}

/** Show the browser's native install dialog. Resolves true if the person accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null; // the event can be used once
  set({ canInstall: false });
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === 'accepted') void prepareOffline();
  return outcome === 'accepted';
}

export function dismissBanner(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
  set({ bannerDismissed: true });
}

export function setUpdateHandler(handler: () => void): void {
  applyUpdate = handler;
  set({ updateReady: true });
}

export function reloadForUpdate(): void {
  if (applyUpdate) applyUpdate();
  else window.location.reload();
}

/* ------------------------------- bootstrap -------------------------------- */

let started = false;

/** Attach browser listeners. Call once, before React renders. */
export function startPwa(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  set({ installed: isStandalone(), iosManual: isIosSafari() && !isStandalone(), bannerDismissed: readDismissed() });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep it so we can show it from our own UI
    deferred = e as BeforeInstallPromptEvent;
    set({ canInstall: true });
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    set({ installed: true, canInstall: false });
    void prepareOffline();
  });

  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (e) => set({ installed: e.matches }));

  void refreshOfflineState();
}

/** Test hook: let a test hand the store an install event, as the browser would. */
export function __receiveInstallPromptForTests(event: BeforeInstallPromptEvent): void {
  deferred = event;
  set({ canInstall: true });
}
