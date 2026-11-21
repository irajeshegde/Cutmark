import React, { useRef, useState } from 'react';
import { AlertCircle, FileUp, Loader2 } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_AUDIO_EXTENSIONS } from '../utils/constants';
import { validateAudioFile } from '../lib/validateFile';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  /** Error from reading a file the browser accepted but could not decode. */
  externalError?: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelected, isLoading, externalError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const problem = validateAudioFile(file);
    setError(problem);
    if (!problem) onFileSelected(file);
  };

  const shownError = error ?? externalError ?? null;

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        aria-describedby="dropzone-hint"
        className={`group flex w-full cursor-pointer flex-col items-center gap-3 border-2 border-dashed px-6 py-12 text-center transition-colors sm:py-14 ${
          isDragging
            ? 'border-accent bg-accent-wash'
            : 'border-line-strong bg-surface hover:border-ink hover:bg-sunk'
        } rounded-cut disabled:cursor-wait disabled:opacity-60`}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-accent-text" aria-hidden="true" />
        ) : (
          <FileUp className="h-8 w-8 text-ink-2 transition-colors group-hover:text-accent-text" strokeWidth={1.5} aria-hidden="true" />
        )}
        <span className="font-display text-3xl leading-tight text-ink sm:text-4xl">
          {isLoading ? 'Reading your file…' : isDragging ? 'Drop it here' : 'Drop an audio file here'}
        </span>
        {!isLoading && (
          <span className="text-sm text-ink-2">
            or <span className="font-medium text-accent-text underline underline-offset-2">choose a file</span> from your device
          </span>
        )}
        <span id="dropzone-hint" className="font-mono text-xs text-ink-3">
          MP3 · WAV · M4A · FLAC · OGG · and most others · up to {formatFileSize(MAX_FILE_SIZE_BYTES)} · stays on this device
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={`audio/*,${SUPPORTED_AUDIO_EXTENSIONS.map((e) => `.${e}`).join(',')}`}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = ''; // allow picking the same file again
        }}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose an audio file"
        data-testid="file-input"
      />

      {shownError && (
        <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-cut border border-accent bg-accent-wash px-4 py-3 text-sm text-ink">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
          <p>{shownError}</p>
        </div>
      )}
    </div>
  );
};
