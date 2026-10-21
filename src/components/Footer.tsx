import React from 'react';
import { ShieldCheck, Compass, Bell } from 'lucide-react';

interface FooterProps {
  onOpenMethod: () => void;
  onOpenLocation: () => void;
  onOpenNotifications: () => void;
  onOpenQibla: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenMethod,
  onOpenLocation,
  onOpenNotifications,
  onOpenQibla,
}) => {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">☪</span>
            <span>Al-Mawaqit · Orari di Preghiera & Tahajjud</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 max-w-md">
            Algoritmo astronomico conforme ai parametri della Lega Islamica Mondiale (MWL: Fajr 18°, Isha 17°). Calcolo in tempo reale dell'Ultimo Terzo della Notte.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium">
          <button
            onClick={onOpenMethod}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Parametri MWL</span>
          </button>
          <button
            onClick={onOpenLocation}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            Cambia Posizione
          </button>
          <button
            onClick={onOpenNotifications}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Notifiche & Suoni</span>
          </button>
          <button
            onClick={onOpenQibla}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Qibla</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-5 border-t border-slate-100 dark:border-slate-900 text-center text-xs text-slate-500 dark:text-slate-600">
        Per la sincronizzazione esatta con la moschea locale di Udine, Martignacco o della tua città, puoi regolare i minuti di scarto (+/-) nelle impostazioni.
      </div>
    </footer>
  );
};
