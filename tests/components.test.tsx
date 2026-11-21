import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropZone } from '../src/components/DropZone';
import { ModeSelect } from '../src/components/ModeSelect';
import { ResultView } from '../src/components/ResultView';
import { SpoilPanel } from '../src/components/SpoilPanel';
import { Footer } from '../src/components/Footer';
import { NotFoundPage } from '../src/pages/NotFoundPage';
import { NO_SPOIL, applyPreset } from '../src/lib/spoil';
import { OutputBundle, OutputFile } from '../src/types';
import { parseRoute } from '../src/hooks/useHashRoute';

const audio = (name = 'song.mp3', type = 'audio/mpeg') => new File([new Uint8Array(2000)], name, { type });

describe('DropZone', () => {
  it('passes a valid audio file up', async () => {
    const onFile = vi.fn();
    render(<DropZone onFileSelected={onFile} />);
    await userEvent.upload(screen.getByTestId('file-input'), audio());
    expect(onFile).toHaveBeenCalledOnce();
  });

  it('shows a readable error for a non-audio file and does not pass it up', () => {
    const onFile = vi.fn();
    render(<DropZone onFileSelected={onFile} />);
    // fireEvent bypasses the input accept filter, as drag and drop does
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [new File(['x'], 'photo.jpg', { type: 'image/jpeg' })] } });
    expect(screen.getByRole('alert')).toHaveTextContent(/doesn’t look like an audio file/);
    expect(onFile).not.toHaveBeenCalled();
  });

  it('is reachable by keyboard (a real button)', () => {
    render(<DropZone onFileSelected={() => {}} />);
    expect(screen.getByRole('button', { name: /drop an audio file/i })).toBeEnabled();
  });

  it('shows an error handed down from the file reader', () => {
    render(<DropZone onFileSelected={() => {}} externalError="Your browser could not read this file." />);
    expect(screen.getByRole('alert')).toHaveTextContent('could not read');
  });
});

describe('ModeSelect', () => {
  it('is an accessible tablist and switches mode', async () => {
    const onChange = vi.fn();
    render(<ModeSelect mode="editor" onModeChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.getByRole('tab', { name: /manual editor/i })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: /find timestamp/i }));
    expect(onChange).toHaveBeenCalledWith('finder');
  });

  it('arrow keys move between tabs', async () => {
    const onChange = vi.fn();
    render(<ModeSelect mode="editor" onModeChange={onChange} />);
    screen.getByRole('tab', { name: /manual editor/i }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('finder');
  });
});

const file = (name: string): OutputFile => ({
  index: 1,
  extension: 'mp3',
  mimeType: 'audio/mpeg',
  startSec: 0,
  durationSec: 12,
  formattedRange: '00:00 - 00:12',
  formattedDuration: '12s',
  blob: new Blob([new Uint8Array(1024)]),
  size: 1024,
  filename: name,
});

describe('ResultView download rules', () => {
  it('one file: a direct download button and no ZIP wording', () => {
    const bundle: OutputBundle = { files: [file('Song_2026-11-21.mp3')], zip: null, spoilt: false };
    render(<ResultView bundle={bundle} onBack={() => {}} onStartOver={() => {}} />);
    expect(screen.getByRole('heading', { name: /your file is ready/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^download 1 kb$/i })).toBeInTheDocument();
    expect(screen.queryByText(/zip/i)).not.toBeInTheDocument();
  });

  it('several files: exactly one download button, and it is the ZIP', () => {
    const bundle: OutputBundle = {
      files: [file('Song_2026-11-21_part01.mp3'), file('Song_2026-11-21_part02.mp3')],
      zip: { name: 'Song_2026-11-21.zip', blob: new Blob([new Uint8Array(4096)]) },
      spoilt: false,
    };
    render(<ResultView bundle={bundle} onBack={() => {}} onStartOver={() => {}} />);
    const downloads = screen.getAllByRole('button', { name: /download/i });
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toHaveTextContent(/zip \(2 files/i);
  });

  it('flags a spoilt export and offers playback of every file', () => {
    const bundle: OutputBundle = { files: [file('Song_2026-11-21_spoilt.mp3')], zip: null, spoilt: true };
    render(<ResultView bundle={bundle} onBack={() => {}} onStartOver={() => {}} />);
    expect(screen.getByText(/degraded on purpose/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play song_2026-11-21_spoilt\.mp3/i })).toBeInTheDocument();
  });

  it('back and start-over are separate actions', async () => {
    const onBack = vi.fn();
    const onStartOver = vi.fn();
    const bundle: OutputBundle = { files: [file('a.mp3')], zip: null, spoilt: false };
    render(<ResultView bundle={bundle} onBack={onBack} onStartOver={onStartOver} />);
    await userEvent.click(screen.getByRole('button', { name: /back to editing/i }));
    await userEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onStartOver).toHaveBeenCalledOnce();
  });
});

describe('SpoilPanel', () => {
  const setup = (settings = NO_SPOIL, previewAvailable = true) => {
    const onChange = vi.fn();
    const onListen = vi.fn();
    render(<SpoilPanel settings={settings} onChange={onChange} listen="spoilt" onListenChange={onListen} previewAvailable={previewAvailable} playHint="Press play." />);
    return { onChange, onListen };
  };

  it('shows "Untouched" until something is switched on', () => {
    setup();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('Untouched')).toBeInTheDocument();
  });

  it('a preset turns it on', async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Medium' }));
    expect(onChange).toHaveBeenCalledWith(applyPreset('medium'));
  });

  it('moving a slider enables spoil and sets only that amount', () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByLabelText(/muffle/i), { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith({ enabled: true, noiseAmount: 0, muffleAmount: 60, wobbleAmount: 0 });
  });

  it('the severity meter reflects the settings', () => {
    setup(applyPreset('heavy'));
    const meter = screen.getByRole('meter');
    expect(Number(meter.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
  });

  it('Original/Spoilt switch calls back, and the B key flips it', async () => {
    const { onListen } = setup(applyPreset('subtle'));
    await userEvent.click(screen.getByRole('button', { name: 'Original' }));
    expect(onListen).toHaveBeenCalledWith('original');
    await userEvent.keyboard('b');
    expect(onListen).toHaveBeenLastCalledWith('original'); // currently "spoilt" -> flips to original
  });

  it('disables the live switch when Web Audio is unavailable', () => {
    setup(applyPreset('subtle'), false);
    const group = screen.getByRole('group', { name: /which version/i });
    within(group).getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });
});

describe('Footer', () => {
  it('discloses AI authorship and the open-source licence', () => {
    render(<Footer />);
    expect(screen.getByText(/built with ai/i)).toBeInTheDocument();
    expect(screen.getByText(/written largely by an ai assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/open source under the MIT license/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /source on github/i })).toHaveAttribute('href', expect.stringContaining('github.com'));
  });

  it('shows the current year, computed at render time rather than hard-coded', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2031-06-15T12:00:00Z'));
      const { unmount } = render(<Footer />);
      expect(screen.getByTestId('copyright')).toHaveTextContent('© 2031 Cutmark contributors');
      unmount();
      vi.setSystemTime(new Date('2040-01-01T00:00:00Z'));
      render(<Footer />);
      expect(screen.getByTestId('copyright')).toHaveTextContent('© 2040 Cutmark contributors');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('NotFoundPage', () => {
  it('explains the miss, shows the illustration, and offers ways back', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/doesn.t exist/i);
    expect(screen.getByRole('img', { name: /missing section/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open a file/i })).toHaveAttribute('href', '#/');
    expect(screen.getByRole('link', { name: /how to use it/i })).toHaveAttribute('href', '#/guide');
  });
});

describe('parseRoute', () => {
  it('maps hashes to pages and defaults to home', () => {
    expect(parseRoute('#/guide')).toBe('guide');
    expect(parseRoute('#/capabilities')).toBe('capabilities');
    expect(parseRoute('#/about')).toBe('about');
    expect(parseRoute('')).toBe('home');
    expect(parseRoute('#/')).toBe('home');
    expect(parseRoute('#/guide/')).toBe('guide');
  });

  it('treats an unknown #/path as not found, but leaves plain anchors like the skip link alone', () => {
    expect(parseRoute('#/nonsense')).toBe('notfound');
    expect(parseRoute('#/guide/extra')).toBe('notfound');
    expect(parseRoute('#main')).toBe('home');
  });
});
