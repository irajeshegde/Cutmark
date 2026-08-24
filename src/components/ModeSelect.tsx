import React from 'react';
import { Layers, Waves } from 'lucide-react';
import { AppMode } from '../types';

interface ModeSelectProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({ mode, onModeChange }) => {
  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1">
      <button
        onClick={() => onModeChange('split')}
        className={`text-xs font-medium px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
          mode === 'split'
            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Layers className="w-3.5 h-3.5" /> Equal Split
      </button>
      <button
        onClick={() => onModeChange('editor')}
        className={`text-xs font-medium px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
          mode === 'editor'
            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Waves className="w-3.5 h-3.5" /> Manual Editor
      </button>
    </div>
  );
};
