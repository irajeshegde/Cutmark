import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AudioFileDetails } from '../types';
import { estimateDecodeBytes, formatFileSize } from '../utils/formatters';
import { WARN_DECODE_BYTES, WARN_FILE_SIZE_BYTES } from '../utils/constants';

interface FileHeaderProps {
  fileDetails: AudioFileDetails;
  onReset: () => void;
  /** Editor and Finder decode the whole track to draw a waveform, which needs far more memory than the file size. */
  showsWaveform?: boolean;
}

export const FileHeader: React.FC<FileHeaderProps> = ({ fileDetails, onReset, showsWaveform }) => {
  const decodeBytes = estimateDecodeBytes(fileDetails.durationSeconds, fileDetails.sampleRate ?? 44100, fileDetails.numberOfChannels ?? 2);
  const heavyWaveform = !!showsWaveform && decodeBytes > WARN_DECODE_BYTES;
  const largeFile = fileDetails.size > WARN_FILE_SIZE_BYTES;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 min-w-10 items-center justify-center border border-ink px-1.5 font-mono text-xs font-medium uppercase text-ink">
            {fileDetails.extension.slice(0, 4)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl leading-tight text-ink" title={fileDetails.name}>
              {fileDetails.name}
            </h2>
            <p className="font-mono text-xs text-ink-3">
              {formatFileSize(fileDetails.size)} · {fileDetails.formattedDuration}
            </p>
          </div>
        </div>
        <button type="button" onClick={onReset} className="btn btn-sm">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Change file
        </button>
      </div>

      {(largeFile || heavyWaveform) && (
        <div role="note" className="flex items-start gap-2.5 border-b border-line bg-warn-wash px-4 py-2.5 text-xs leading-5 text-ink sm:px-5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden="true" />
          <p>
            {heavyWaveform
              ? `Drawing this waveform needs about ${formatFileSize(decodeBytes)} of memory in this tab. If the tab slows down or crashes, use Equal Split (no waveform) or cut a shorter file.`
              : `Large file (${formatFileSize(fileDetails.size)}). Everything is processed in this tab’s memory, so it may be slow on low-RAM devices.`}
          </p>
        </div>
      )}
    </div>
  );
};
