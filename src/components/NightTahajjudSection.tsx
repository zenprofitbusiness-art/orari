import React, { useState } from 'react';
import { Moon, Sparkles, Bell, Clock, CheckCircle2, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { AllNotificationsConfig, NightCalculation } from '../types/prayer';
import { playPrayerSound } from '../utils/soundEngine';

interface NightTahajjudSectionProps {
  night: NightCalculation;
  notifications: AllNotificationsConfig;
  onOpenNotifications: () => void;
}

export const NightTahajjudSection: React.FC<NightTahajjudSectionProps> = ({
  night,
  notifications,
  onOpenNotifications,
}) => {
  const [showGuide, setShowGuide] = useState(false);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const formatHoursMinutes = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const isTahajjudNotifOn = notifications.tahajjud?.enabled;
  const isLastThirdNotifOn = notifications.lastThird?.enabled;

  return (
    <section id="night-tahajjud" className="scroll-mt-16">
      <div className="border border-indigo-200/90 dark:border-indigo-900/50 bg-gradient-to-b from-indigo-50/40 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-colors">
        
        {/* Header compatto */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-indigo-100/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Calcolo della Notte & Tahajjud
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                  {formatHoursMinutes(night.nightDurationMinutes)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                Dal tramonto (Maghrib) all'alba (Fajr) · MWL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => playPrayerSound('dawn_tone')}
              className="p-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/50 rounded-lg transition-colors cursor-pointer"
              title="Ascolta anteprima tono dolce risveglio notte"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenNotifications}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Configura promemoria e sveglia per il Tahajjud"
            >
              <Bell className="w-3 h-3" />
              <span>Sveglia</span>
            </button>
          </div>
        </div>

        {/* 4 Sezioni in Piccolo (2x2 Grid compatto ed elegante) */}
        <div className="grid grid-cols-2 gap-2 my-3">
          {/* 01. Inizio della Notte */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                01. Inizio Notte
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-tight">
                Tramonto (Maghrib)
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Inizio notte e Iftar
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-900 flex items-baseline justify-between">
              <span className="text-[10px] text-slate-400">Orario:</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                {formatTime(night.maghribToday)}
              </span>
            </div>
          </div>

          {/* 02. Metà Notte */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                02. Metà Notte
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-tight">
                Nisf al-Layl
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Punto medio esatto
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-900 flex items-baseline justify-between">
              <span className="text-[10px] text-slate-400">Orario:</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
                {formatTime(night.midnight)}
              </span>
            </div>
          </div>

          {/* 03. Ultimo Terzo (Thuluth al-Layl) */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-700/50 flex flex-col justify-between relative shadow-2xs">
            <div className="absolute -top-2 right-2 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider text-amber-950 bg-amber-400">
              Più Benedetto
            </div>
            <div>
              <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                03. Ultimo Terzo
              </span>
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-100 mt-0.5 leading-tight">
                Thuluth al-Layl
              </h4>
              <p className="text-[10px] text-amber-900/80 dark:text-amber-200/80 mt-0.5 line-clamp-1">
                Massima supplica & Tahajjud
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-amber-200/70 dark:border-amber-900/40 flex items-baseline justify-between">
              <span className="text-[10px] text-amber-800 dark:text-amber-300">Inizia alle:</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-amber-700 dark:text-amber-300">
                {formatTime(night.lastThirdStart)}
              </span>
            </div>
          </div>

          {/* 04. Conclusione Notte (Fajr) */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                04. Fine Notte
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-tight">
                Alba (Fajr)
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Inizio digiuno
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-900 flex items-baseline justify-between">
              <span className="text-[10px] text-slate-400">Orario:</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                {formatTime(night.fajrTomorrow)}
              </span>
            </div>
          </div>
        </div>

        {/* Barra compatto richiudibile con Guida Tahajjud & Sveglia */}
        <div className="pt-1 border-t border-indigo-100/80 dark:border-slate-800">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-medium text-[11px]">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Guida al Tahajjud & Notifiche</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({formatTime(night.lastThirdStart)} - {formatTime(night.fajrTomorrow)})
              </span>
            </span>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                isTahajjudNotifOn
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60'
                  : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
              }`}>
                {isTahajjudNotifOn ? 'Sveglia ON' : 'Sveglia OFF'}
              </span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showGuide && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-2">
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Il <strong>Tahajjud (Salat al-Layl)</strong> si prega a coppie di 2 rak'at (es. 2, 4 o 8 rak'at), concluse con 1 o 3 rak'at di Wit'r prima dell'Alba.
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-500">
                  Formula: Fajr - (Durata Notte ÷ 3)
                </span>
                <button
                  onClick={onOpenNotifications}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Regola orario sveglia →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
