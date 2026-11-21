import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/plugins/timeline';

export interface WaveformRegion {
  start: number;
  end: number;
}

export interface WaveformHandle {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seekTo: (sec: number) => void;
  setRegionTimes: (start: number, end: number) => void;
  clearRegion: () => void;
  setZoom: (pxPerSec: number) => void;
  /** The <audio> element behind the waveform, for the live spoil preview chain. */
  getMediaElement: () => HTMLMediaElement | null;
}

interface WaveformProps {
  file: File;
  onReady?: (durationSec: number, fitPxPerSec: number, media: HTMLMediaElement) => void;
  onTimeUpdate?: (currentSec: number) => void;
  onPlayPauseChange?: (isPlaying: boolean) => void;
  onRegionChange?: (region: WaveformRegion | null) => void;
  onError?: (message: string) => void;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function themeColors() {
  return {
    waveColor: cssVar('--wave'),
    progressColor: cssVar('--wave-progress'),
    cursorColor: cssVar('--ink'),
    region: cssVar('--region'),
    text: cssVar('--ink-3'),
  };
}

export const Waveform = forwardRef<WaveformHandle, WaveformProps>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const activeRegionRef = useRef<Region | null>(null);

  // Handlers go through a ref so the WaveSurfer instance is built once per file
  // and never sees stale closures.
  const cbRef = useRef(props);
  cbRef.current = props;

  useEffect(() => {
    if (!containerRef.current || !timelineRef.current) return;

    const colors = themeColors();
    const objectUrl = URL.createObjectURL(props.file);
    const regions = RegionsPlugin.create();
    const timeline = TimelinePlugin.create({
      container: timelineRef.current,
      height: 18,
      style: { fontFamily: 'var(--font-mono)', fontSize: '10px', color: colors.text },
    });

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: colors.waveColor,
      progressColor: colors.progressColor,
      cursorColor: colors.cursorColor,
      cursorWidth: 2,
      height: 128,
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      url: objectUrl,
      plugins: [regions, timeline],
    });

    wavesurferRef.current = ws;
    regionsRef.current = regions;

    const disableDragSelection = regions.enableDragSelection({ color: colors.region });

    ws.on('ready', (duration) => {
      // Measure wavesurfer's own scroll element (inside its shadow root), not our
      // padded container: its available width is narrower.
      const scrollEl = containerRef.current?.firstElementChild as HTMLElement | undefined;
      const innerWidth = scrollEl?.shadowRoot?.querySelector('.scroll')?.clientWidth ?? containerRef.current?.clientWidth ?? 0;
      const fitPxPerSec = duration > 0 && innerWidth > 0 ? innerWidth / duration : 10;
      cbRef.current.onReady?.(duration, fitPxPerSec, ws.getMediaElement());
    });
    ws.on('error', (err) => cbRef.current.onError?.(String(err instanceof Error ? err.message : err)));
    ws.on('timeupdate', (t) => cbRef.current.onTimeUpdate?.(t));
    // 'timeupdate' doesn't reliably fire for a paused programmatic/click seek; 'seeking' covers that gap.
    ws.on('seeking', (t) => cbRef.current.onTimeUpdate?.(t));
    ws.on('play', () => cbRef.current.onPlayPauseChange?.(true));
    ws.on('pause', () => cbRef.current.onPlayPauseChange?.(false));

    regions.on('region-created', (region) => {
      regions.getRegions().forEach((r) => {
        if (r.id !== region.id) r.remove();
      });
      activeRegionRef.current = region;
      cbRef.current.onRegionChange?.({ start: region.start, end: region.end });
    });
    regions.on('region-updated', (region) => {
      activeRegionRef.current = region;
      cbRef.current.onRegionChange?.({ start: region.start, end: region.end });
    });
    regions.on('region-removed', (region) => {
      if (activeRegionRef.current?.id === region.id) {
        activeRegionRef.current = null;
        cbRef.current.onRegionChange?.(null);
      }
    });

    // Follow the light/dark toggle: <html class="dark"> flips, repaint with the new tokens.
    const observer = new MutationObserver(() => {
      const c = themeColors();
      ws.setOptions({ waveColor: c.waveColor, progressColor: c.progressColor, cursorColor: c.cursorColor });
      const active = activeRegionRef.current;
      if (active) active.setOptions({ color: c.region });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      disableDragSelection();
      ws.destroy();
      URL.revokeObjectURL(objectUrl);
      wavesurferRef.current = null;
      regionsRef.current = null;
      activeRegionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.file]);

  useImperativeHandle(ref, () => ({
    play: () => void wavesurferRef.current?.play(),
    pause: () => wavesurferRef.current?.pause(),
    togglePlayPause: () => void wavesurferRef.current?.playPause(),
    seekTo: (sec) => {
      const ws = wavesurferRef.current;
      const duration = ws?.getDuration() ?? 0;
      if (ws && duration > 0) ws.seekTo(Math.min(1, Math.max(0, sec / duration)));
    },
    setRegionTimes: (start, end) => {
      const regions = regionsRef.current;
      if (!regions) return;
      if (activeRegionRef.current) {
        activeRegionRef.current.setOptions({ start, end });
      } else {
        activeRegionRef.current = regions.addRegion({ start, end, color: themeColors().region });
      }
      cbRef.current.onRegionChange?.({ start, end });
    },
    clearRegion: () => {
      activeRegionRef.current?.remove();
      activeRegionRef.current = null;
      cbRef.current.onRegionChange?.(null);
    },
    setZoom: (pxPerSec) => wavesurferRef.current?.zoom(pxPerSec),
    getMediaElement: () => wavesurferRef.current?.getMediaElement() ?? null,
  }));

  return (
    <div className="border border-line bg-sunk p-3 rounded-cut">
      <div ref={containerRef} className="waveform-host w-full" data-testid="waveform" />
      <div ref={timelineRef} className="mt-1" />
    </div>
  );
});

Waveform.displayName = 'Waveform';
