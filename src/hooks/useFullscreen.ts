import { RefObject, useCallback, useEffect, useState } from 'react';

/**
 * Element fullscreen. `supported` is false on iOS Safari (iPhone) and a few
 * embedded browsers, where the control should simply not be offered.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supported = typeof document !== 'undefined' && !!document.fullscreenEnabled;

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [ref]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void ref.current?.requestFullscreen?.();
  }, [ref]);

  return { isFullscreen, toggleFullscreen, supported };
}
