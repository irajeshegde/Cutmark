import { Suspense, lazy, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Landing } from './components/Landing/Landing';
import { AudioFileDetails } from './types';
import { getAudioFileDetails } from './utils/audioMetadata';
import { useHashRoute } from './hooks/useHashRoute';
import { GuidePage } from './pages/GuidePage';
import { CapabilitiesPage } from './pages/CapabilitiesPage';
import { AboutPage } from './pages/AboutPage';
import { terminateFFmpeg } from './services/ffmpegService';

// The workspace pulls in wavesurfer and the export pipeline; keep it off the landing page's critical path.
const Workspace = lazy(() => import('./components/Workspace'));

export default function App() {
  const route = useHashRoute();
  const [fileDetails, setFileDetails] = useState<AudioFileDetails | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setIsReading(true);
    setReadError(null);
    try {
      setFileDetails(await getAudioFileDetails(file));
    } catch (err) {
      setReadError((err as Error).message);
      setFileDetails(null);
    } finally {
      setIsReading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    terminateFFmpeg(); // frees the engine's copy of the previous file
    setFileDetails(null);
    setReadError(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Header route={route} />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
        {route === 'guide' && <GuidePage />}
        {route === 'capabilities' && <CapabilitiesPage />}
        {route === 'about' && <AboutPage />}

        {route === 'home' &&
          (fileDetails ? (
            <Suspense
              fallback={
                <p className="flex items-center gap-2 py-16 text-ink-2" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening the editor…
                </p>
              }
            >
              <Workspace key={`${fileDetails.name}-${fileDetails.size}-${fileDetails.file.lastModified}`} fileDetails={fileDetails} onReset={handleReset} />
            </Suspense>
          ) : (
            <Landing onFileSelected={handleFileSelected} isLoading={isReading} error={readError} />
          ))}
      </main>

      <Footer />
    </div>
  );
}
