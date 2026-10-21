import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { playPrayerSound } from '../utils/soundEngine';

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DHIKR_PHRASES = [
  {
    ar: 'سُبْحَانَ ٱللَّٰهِ',
    trans: 'SubhanAllah',
    mean: 'Gloria ad Allah',
    target: 33,
  },
  {
    ar: 'ٱلْحَمْدُ لِلَّٰهِ',
    trans: 'Alhamdulillah',
    mean: 'La lode appartiene ad Allah',
    target: 33,
  },
  {
    ar: 'ٱللَّٰهُ أَكْبَرُ',
    trans: 'Allahu Akbar',
    mean: 'Allah è il Più Grande',
    target: 34,
  },
  {
    ar: 'أَسْتَغْفِرُ ٱللَّٰهَ',
    trans: 'Astaghfirullah',
    mean: 'Chiedo perdono ad Allah (ideale nell\'Ultimo Terzo)',
    target: 100,
  },
  {
    ar: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
    trans: 'La ilaha illa Allah',
    mean: 'Non c\'è altra divinità all\'infuori di Allah',
    target: 100,
  },
];

export const TasbihModal: React.FC<TasbihModalProps> = ({ isOpen, onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [count, setCount] = useState(0);

  if (!isOpen) return null;

  const currentDhikr = DHIKR_PHRASES[selectedIdx];

  const handleIncrement = () => {
    const nextCount = count + 1;
    setCount(nextCount);

    if (navigator.vibrate) {
      navigator.vibrate(40);
    }

    if (nextCount === currentDhikr.target) {
      playPrayerSound('bell');
      if (navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleSelectDhikr = (idx: number) => {
    setSelectedIdx(idx);
    setCount(0);
  };

  const progress = Math.min(100, Math.round((count / currentDhikr.target) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl text-slate-900 dark:text-white overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Tasbih Elettronico (Dhikr)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Per il ricordo di Allah dopo la preghiera e nel Tahajjud
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center space-y-6">
          {/* Dhikr Selector Tabs */}
          <div className="flex gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
            {DHIKR_PHRASES.map((d, i) => (
              <button
                key={d.trans}
                onClick={() => handleSelectDhikr(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedIdx === i
                    ? 'bg-emerald-600 dark:bg-emerald-400 text-white dark:text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {d.trans}
              </button>
            ))}
          </div>

          {/* Current Dhikr Display */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-serif text-amber-600 dark:text-amber-300 font-bold tracking-wide">
              {currentDhikr.ar}
            </div>
            <div className="text-base font-semibold text-slate-900 dark:text-white">
              {currentDhikr.trans}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentDhikr.mean}
            </div>
          </div>

          {/* Big Tap Button Ring */}
          <div className="relative">
            <button
              onClick={handleIncrement}
              className="w-48 h-48 rounded-full bg-slate-50 dark:bg-slate-950 border-4 border-emerald-500/70 hover:border-emerald-500 active:scale-95 transition-all shadow-xl flex flex-col items-center justify-center cursor-pointer select-none group"
            >
              <span className="text-5xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                {count}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Obiettivo: {currentDhikr.target}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500/80 mt-2">
                Tocca per contare
              </span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Progresso</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-2 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="flex items-center justify-between w-full pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Azzera conteggio</span>
            </button>

            <span className="text-xs text-slate-400">
              Vibrazione attiva
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
