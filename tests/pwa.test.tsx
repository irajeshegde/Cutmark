import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppControls } from '../src/components/AppControls';
import { InstallBanner } from '../src/components/InstallBanner';
import {
  BeforeInstallPromptEvent,
  DISMISS_KEY,
  __receiveInstallPromptForTests,
  __resetPwaForTests,
  getSnapshot,
  isIosSafari,
  promptInstall,
} from '../src/lib/pwa';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1';
const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

function fakeInstallEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event('beforeinstallprompt'), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  }) as BeforeInstallPromptEvent;
  return { event, prompt };
}

beforeEach(() => {
  localStorage.clear();
  __resetPwaForTests();
});
afterEach(() => vi.restoreAllMocks());

describe('isIosSafari', () => {
  it('recognises iPhone Safari and iPadOS (which reports as a Mac with touch)', () => {
    expect(isIosSafari(IPHONE, 5)).toBe(true);
    expect(isIosSafari(MAC_SAFARI, 5)).toBe(true);
  });
  it('is false for a real Mac, Android, and other iOS browsers', () => {
    expect(isIosSafari(MAC_SAFARI, 0)).toBe(false);
    expect(isIosSafari(ANDROID, 5)).toBe(false);
    expect(isIosSafari(IPHONE_CHROME, 5)).toBe(false);
  });
});

describe('InstallBanner', () => {
  it('shows nothing when the browser has offered no way to install', () => {
    const { container } = render(<InstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers an Install button when the browser provides a prompt, and opens it on click', async () => {
    const { event, prompt } = fakeInstallEvent('accepted');
    render(<InstallBanner />);
    act(() => __receiveInstallPromptForTests(event));
    await userEvent.click(screen.getByRole('button', { name: /install app/i }));
    expect(prompt).toHaveBeenCalledOnce();
    // the one-use event is spent, so the popup goes away
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('shows Add to Home Screen steps on iPhone, with no install button', () => {
    __resetPwaForTests({ iosManual: true });
    render(<InstallBanner />);
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument();
  });

  it('can be closed, remembers that, and stays closed', async () => {
    __resetPwaForTests({ canInstall: true });
    render(<InstallBanner />);
    await userEvent.click(screen.getByRole('button', { name: /not now/i }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISS_KEY)).toBe('1');
  });

  it('is hidden once the app is installed', () => {
    __resetPwaForTests({ canInstall: true, installed: true });
    const { container } = render(<InstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('AppControls (footer fallback)', () => {
  it('still offers Install after the popup was dismissed', async () => {
    __resetPwaForTests({ canInstall: true, bannerDismissed: true });
    render(<AppControls />);
    expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument();
  });

  it('explains how to install when the browser gives no prompt', () => {
    render(<AppControls />);
    expect(screen.getByText(/browser’s menu/i)).toBeInTheDocument();
  });

  it('shows iPhone steps on iOS Safari', () => {
    __resetPwaForTests({ iosManual: true });
    render(<AppControls />);
    expect(screen.getByText(/tap/i)).toHaveTextContent(/Add to Home Screen/);
  });

  it('says installed once running as an app', () => {
    __resetPwaForTests({ installed: true });
    render(<AppControls />);
    expect(screen.getByText(/installed on this device/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument();
  });

  it('reports offline readiness honestly in each state', () => {
    __resetPwaForTests({ offline: 'ready' });
    const { unmount } = render(<AppControls />);
    expect(screen.getByRole('status')).toHaveTextContent(/works offline/i);
    unmount();

    __resetPwaForTests({ offline: 'unknown' });
    render(<AppControls />);
    expect(screen.getByText(/not available offline yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save for offline use/i })).toBeInTheDocument();
  });

  it('offers a reload only when an update is waiting, and warns it clears the edit', () => {
    const { unmount } = render(<AppControls />);
    expect(screen.queryByRole('button', { name: /reload now/i })).not.toBeInTheDocument();
    unmount();
    __resetPwaForTests({ updateReady: true });
    render(<AppControls />);
    expect(screen.getByText(/clears whatever you are editing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload now/i })).toBeInTheDocument();
  });
});

describe('promptInstall', () => {
  it('does nothing without a held event', async () => {
    expect(await promptInstall()).toBe(false);
  });

  it('returns false and keeps the app uninstalled when the person declines', async () => {
    const { event } = fakeInstallEvent('dismissed');
    __receiveInstallPromptForTests(event);
    expect(await promptInstall()).toBe(false);
    expect(getSnapshot().canInstall).toBe(false);
  });
});
