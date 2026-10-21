import React from 'react';
import { Bell, MapPin, Compass, Calendar, Moon, Sun, Smartphone, Monitor, CloudSun } from 'lucide-react';
import { LocationData } from '../types/prayer';
import { WeatherData } from '../utils/weatherEngine';

interface HeaderProps {
  location: LocationData;
  theme: 'light' | 'dark';
  viewMode: 'compact' | 'full';
  weather?: WeatherData | null;
  onToggleTheme: () => void;
  onToggleViewMode: () => void;
  onOpenLocation: () => void;
  onOpenNotifications: () => void;
  onOpenQibla: () => void;
  onOpenCalendar: () => void;
  onOpenTasbih: () => void;
  onOpenWeather?: () => void;
  onOpenMethod: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  theme,
  viewMode,
  weather,
  onToggleTheme,
  onToggleViewMode,
  onOpenLocation,
  onOpenNotifications,
  onOpenQibla,
  onOpenCalendar,
  onOpenTasbih,
  onOpenWeather,
  onOpenMethod,
  onScrollToSection,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-emerald-900/30 text-slate-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors flex items-center gap-2"
        >
          <span className="text-xl">☪</span>
          <span>Al-Mawaqit</span>
        </a>

        {/* Zone 2: 4-5 clean single-line nav links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onScrollToSection('today-prayers')}
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            5 Preghiere
          </button>
          <button
            onClick={() => onScrollToSection('night-tahajjud')}
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Ultimo Terzo & Tahajjud
          </button>
          <button
            onClick={onOpenQibla}
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Qibla
          </button>
          <button
            onClick={onOpenCalendar}
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Calendario Arabo & Feste
          </button>
          <button
            onClick={onOpenTasbih}
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tasbih
          </button>
          <button
            onClick={onOpenWeather}
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <CloudSun className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Meteo</span>
            {weather && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-sky-100/80 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold">
                {weather.temperature}°
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions (Theme switcher, View switch, Location badge, Notifications) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Weather pill for mobile/tablet if available */}
          {weather && onOpenWeather && (
            <button
              onClick={onOpenWeather}
              title={`Meteo attuale a ${location.city}: ${weather.temperature}°C, ${weather.description}`}
              className="lg:hidden flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/70 dark:border-sky-800/50 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
            >
              <CloudSun className="w-3.5 h-3.5 text-sky-500" />
              <span>{weather.temperature}°C</span>
            </button>
          )}
          {/* Light / Dark Mode Switcher */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Passa alla modalità Chiara (Light)' : 'Passa alla modalità Scura (Dark)'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Schermo Piccolo / Schermo Intero Switcher */}
          <button
            onClick={onToggleViewMode}
            title={viewMode === 'compact' ? 'Passa a Schermo Intero' : 'Passa a Schermo Piccolo (Widget Compatto)'}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {viewMode === 'compact' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Schermo Piccolo</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Schermo Intero</span>
              </>
            )}
          </button>

          {/* Location Badge */}
          <button
            onClick={onOpenLocation}
            title="Cambia posizione o città"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-600 dark:hover:border-emerald-700/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="max-w-[90px] sm:max-w-[130px] truncate">{location.city}</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-emerald-500/20 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Avvisi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
