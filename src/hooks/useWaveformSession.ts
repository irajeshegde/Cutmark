import { useCallback, useRef, useState } from 'react';
import { WaveformHandle, WaveformRegion } from '../components/Editor/Waveform';
import { parseTimeOrRangeInput } from '../utils/parseTimestamps';

export const BOUNDARY_EPSILON_SEC = 0.05;

/**
 * Playback, selection and zoom state shared by Manual Editor and Find Timestamp.
 * Owns the Waveform handle so both screens drive it the same way.
 */
export function useWaveformSession(onMedia?: (media: HTMLMediaElement) => void) {
  const waveformRef = useRef<WaveformHandle>(null);
  const previewEndRef = useRef<number | null>(null);

  const [durationSec, setDurationSec] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [region, setRegion] = useState<WaveformRegion | null>(null);
  const [zoomPxPerSec, setZoomPxPerSec] = useState(50);
  const [minZoomPxPerSec, setMinZoomPxPerSec] = useState(10);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const stopPreview = useCallback(() => {
    previewEndRef.current = null;
    setPreviewId(null);
  }, []);

  const handleReady = useCallback(
    (duration: number, fitPxPerSec: number, media: HTMLMediaElement) => {
      setDurationSec(duration);
      setMinZoomPxPerSec(fitPxPerSec);
      setZoomPxPerSec(fitPxPerSec);
      waveformRef.current?.setZoom(fitPxPerSec);
      onMedia?.(media);
    },
    [onMedia]
  );

  const handleTimeUpdate = useCallback(
    (t: number) => {
      setCurrentTimeSec(t);
      if (previewEndRef.current !== null && t >= previewEndRef.current) {
        waveformRef.current?.pause();
        stopPreview();
      }
    },
    [stopPreview]
  );

  const handlePlayPauseChange = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      if (!playing) stopPreview();
    },
    [stopPreview]
  );

  const togglePlay = useCallback(() => waveformRef.current?.togglePlayPause(), []);

  const step = useCallback(
    (deltaSec: number) => {
      waveformRef.current?.seekTo(Math.min(durationSec, Math.max(0, currentTimeSec + deltaSec)));
    },
    [durationSec, currentTimeSec]
  );

  const setZoom = useCallback((px: number) => {
    setZoomPxPerSec(px);
    waveformRef.current?.setZoom(px);
  }, []);

  /** Play [start, end) once, or stop if this id is already playing. */
  const previewRange = useCallback(
    (id: string, start: number, end: number) => {
      if (previewId === id) {
        waveformRef.current?.pause();
        stopPreview();
        return;
      }
      previewEndRef.current = end;
      setPreviewId(id);
      waveformRef.current?.seekTo(start);
      waveformRef.current?.play();
    },
    [previewId, stopPreview]
  );

  // ---- selection ----

  const setRange = useCallback(
    (start: number, end: number) => {
      if (durationSec <= 0) return;
      const s = Math.max(0, Math.min(start, durationSec));
      const e = Math.max(s + BOUNDARY_EPSILON_SEC, Math.min(end, durationSec));
      waveformRef.current?.setRegionTimes(s, e);
    },
    [durationSec]
  );

  const setStart = useCallback(
    (sec: number) => {
      const end = region ? region.end : Math.min(durationSec, sec + 1);
      waveformRef.current?.setRegionTimes(Math.min(sec, end - BOUNDARY_EPSILON_SEC), end);
    },
    [region, durationSec]
  );

  const setEnd = useCallback(
    (sec: number) => {
      const start = region ? region.start : 0;
      waveformRef.current?.setRegionTimes(start, Math.max(sec, start + BOUNDARY_EPSILON_SEC));
    },
    [region]
  );

  /** Apply a typed/pasted value: "mm:ss", "mm:ss.mmm", or a whole "a-b" range. */
  const commitTime = useCallback(
    (raw: string, which: 'start' | 'end') => {
      const parsed = parseTimeOrRangeInput(raw);
      if (!parsed) return;
      if (parsed.kind === 'range') return setRange(parsed.startSec, parsed.endSec);
      const sec = Math.min(durationSec, Math.max(0, parsed.sec));
      if (which === 'start') setStart(sec);
      else setEnd(sec);
    },
    [durationSec, setRange, setStart, setEnd]
  );

  const clearRegion = useCallback(() => waveformRef.current?.clearRegion(), []);

  return {
    waveformRef,
    durationSec,
    currentTimeSec,
    isPlaying,
    region,
    zoomPxPerSec,
    minZoomPxPerSec,
    previewId,
    loadError,
    setLoadError,
    // waveform callbacks
    waveformProps: {
      onReady: handleReady,
      onTimeUpdate: handleTimeUpdate,
      onPlayPauseChange: handlePlayPauseChange,
      onRegionChange: setRegion,
      onError: setLoadError,
    },
    togglePlay,
    step,
    setZoom,
    previewRange,
    stopPreview,
    setRange,
    setStart,
    setEnd,
    commitTime,
    clearRegion,
  };
}
