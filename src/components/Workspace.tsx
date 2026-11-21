import React, { useState } from 'react';
import { AppMode, AudioFileDetails, SpoilSettings, TimestampMark } from '../types';
import { ModeSelect, panelId, tabId } from './ModeSelect';
import { AudioEditor } from './Editor/AudioEditor';
import { TimestampFinder } from './Finder/TimestampFinder';
import { EqualSplit } from './Split/EqualSplit';
import { DEFAULT_CHUNK_MINUTES } from '../utils/constants';
import { NO_SPOIL } from '../lib/spoil';
import { clipsFromRanges } from '../lib/clipOps';
import { relabel, useClipHistory } from '../hooks/useClipHistory';

interface WorkspaceProps {
  fileDetails: AudioFileDetails;
  onReset: () => void;
}

/**
 * Hosts the three tools for one loaded file. Editor state (clips, spoil
 * settings) lives here, not in the editor, so flipping to Find Timestamp and
 * back never loses work.
 */
const Workspace: React.FC<WorkspaceProps> = ({ fileDetails, onReset }) => {
  const [mode, setMode] = useState<AppMode>('editor');
  const [chunkMinutes, setChunkMinutes] = useState(DEFAULT_CHUNK_MINUTES);
  const [spoil, setSpoil] = useState<SpoilSettings>(NO_SPOIL);
  const [joinIntoOne, setJoinIntoOne] = useState(false);
  const history = useClipHistory();

  const sendToEditor = (marks: TimestampMark[]) => {
    const imported = clipsFromRanges(marks, fileDetails.durationSeconds);
    if (imported.length > 0) history.commit((prev) => relabel([...prev, ...imported]));
    setMode('editor');
  };

  return (
    <div className="space-y-5 fade-up">
      <ModeSelect mode={mode} onModeChange={setMode} />
      <div role="tabpanel" id={panelId(mode)} aria-labelledby={tabId(mode)}>
        {mode === 'editor' && (
          <AudioEditor
            fileDetails={fileDetails}
            onReset={onReset}
            session={{ history, spoil, setSpoil, joinIntoOne, setJoinIntoOne }}
          />
        )}
        {mode === 'finder' && <TimestampFinder fileDetails={fileDetails} onReset={onReset} onSendToEditor={sendToEditor} />}
        {mode === 'split' && (
          <EqualSplit fileDetails={fileDetails} chunkMinutes={chunkMinutes} onChunkMinutesChange={setChunkMinutes} onReset={onReset} />
        )}
      </div>
    </div>
  );
};

export default Workspace;
