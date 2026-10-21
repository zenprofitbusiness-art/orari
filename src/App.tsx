/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AllNotificationsConfig,
  CalculationSettings,
  LocationData,
  PrayerKey,
} from './types/prayer';
import {
  DEFAULT_SETTINGS,
  POPULAR_CITIES,
  calculateAllPrayerTimes,
} from './utils/prayerEngine';
import {
  DEFAULT_NOTIFICATIONS,
  loadNotificationsConfig,
  saveNotificationsConfig,
  triggerPrayerAlert,
} from './utils/notificationEngine';
import { Header } from './components/Header';
import { CompactPrayersList } from './components/CompactPrayersList';
import { NightTahajjudSection } from './components/NightTahajjudSection';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { QiblaCompassModal } from './components/QiblaCompassModal';
import { MonthlyScheduleModal } from './components/MonthlyScheduleModal';
import { CalculationMethodModal } from './components/CalculationMethodModal';
import { TasbihModal } from './components/TasbihModal';
import { WeatherModal, WeatherIcon } from './components/WeatherModal';
import { Footer } from './components/Footer';
import { fetchWeatherData, WeatherData } from './utils/weatherEngine';
import {
  Bell,
  Sparkles,
  MapPin,
  CheckCircle,
  Volume2,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Compass,
  CloudSun,
} from 'lucide-react';
import { playPrayerSound } from './utils/soundEngine';

const LOCATION_STORAGE_KEY = 'al_mawaqit_location_v1';
const SETTINGS_STORAGE_KEY = 'al_mawaqit_settings_v1';
const THEME_STORAGE_KEY = 'al_mawaqit_theme_v1';
const VIEW_MODE_STORAGE_KEY = 'al_mawaqit_view_mode_v1';

export default function App() {
  // --- THEME STATE (LIGHT / DARK) ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.warn(e);
    }
    return 'dark'; // default
  });

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // --- VIEW MODE STATE (SCHERMO PICCOLO vs SCHERMO INTERO) ---
  const [viewMode, setViewMode] = useState<'compact' | 'full'>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'compact' || saved === 'full') return saved;
    } catch (e) {
      console.warn(e);
    }
    // Default to compact as requested by user ("deve ese uno scermo picolo")
    return 'compact';
  });

  const toggleViewMode = () => {
    const nextMode = viewMode === 'compact' ? 'full' : 'compact';
    setViewMode(nextMode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
    } catch (e) {
      console.warn(e);
    }
  };

  // --- LOCATION & SETTINGS STATE ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<LocationData>(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading location storage:', e);
    }
    // Default: Udine, Italia as requested!
    return POPULAR_CITIES[0];
  });

  const [settings, setSettings] = useState<CalculationSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading settings storage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AllNotificationsConfig>(loadNotificationsConfig);

  // --- PRAYER CHECKLIST (COMPLETED PRAYERS TODAY) ---
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  const [completedPrayers, setCompletedPrayers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`al_mawaqit_prayed_${todayDateStr}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const handleToggleCompleted = (key: string) => {
    setCompletedPrayers((prev) => {
      const updated = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      try {
        localStorage.setItem(`al_mawaqit_prayed_${todayDateStr}`, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Modals
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isQiblaModalOpen, setIsQiblaModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isTasbihModalOpen, setIsTasbihModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Status & Alerts
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [activeAlertBanner, setActiveAlertBanner] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const firedAlertsRef = React.useRef<Set<string>>(new Set());

  // Weather fetcher
  const loadWeather = useCallback(async () => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchWeatherData(location.latitude, location.longitude, location.timezone);
      setWeather(data);
    } catch (e) {
      console.warn('Failed to load weather:', e);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [location.latitude, location.longitude, location.timezone]);

  useEffect(() => {
    loadWeather();
    const weatherTimer = setInterval(loadWeather, 15 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, [loadWeather]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Save location
  const handleSelectLocation = (newLoc: LocationData) => {
    setLocation(newLoc);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLoc));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSettings = (newSettings: CalculationSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateNotifications = (newNotifs: AllNotificationsConfig) => {
    setNotifications(newNotifs);
    saveNotificationsConfig(newNotifs);
  };

  const handleToggleSingleNotification = (key: PrayerKey) => {
    const updated = {
      ...notifications,
      [key]: {
        ...notifications[key],
        enabled: !notifications[key]?.enabled,
      },
    };
    handleUpdateNotifications(updated);
  };

  const handleUpdateSingleNotification = (
    key: PrayerKey,
    partial: Partial<AllNotificationsConfig[PrayerKey]>
  ) => {
    const updated = {
      ...notifications,
      [key]: {
        ...notifications[key],
        ...partial,
      },
    };
    handleUpdateNotifications(updated);
  };

  // GPS Accurate Detection
  const handleDetectGps = useCallback(() => {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata dal tuo browser.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';

        let nearestCity = `GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
        let minDistance = 99999;

        POPULAR_CITIES.forEach((c) => {
          const d = Math.sqrt(
            Math.pow(c.latitude - lat, 2) + Math.pow(c.longitude - lng, 2)
          );
          if (d < minDistance) {
            minDistance = d;
            if (d < 0.25) {
              nearestCity = `${c.city} (Posizione GPS)`;
            }
          }
        });

        const newLoc: LocationData = {
          city: nearestCity,
          country: 'Rilevato da Coordinate GPS',
          latitude: lat,
          longitude: lng,
          timezone: tz,
          isAutoGps: true,
        };

        handleSelectLocation(newLoc);
        setIsGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsGpsLoading(false);
        alert('Impossibile ottenere la posizione GPS. Assicurati di aver concesso i permessi.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Compute Prayer & Night Times
  const { prayers, night } = useMemo(() => {
    return calculateAllPrayerTimes(currentDate, location, settings);
  }, [currentDate, location, settings]);

  // Notification Scheduler Monitor
  useEffect(() => {
    const now = new Date();
    const currentTimestampMinutes = Math.floor(now.getTime() / 60000);

    prayers.forEach((prayer) => {
      const config = notifications[prayer.key];
      if (!config || !config.enabled) return;

      const prayerTimestampMinutes = Math.floor(prayer.time.getTime() / 60000);
      const reminderTimestampMinutes = prayerTimestampMinutes - config.offsetMinutes;

      const exactTag = `exact-${prayer.key}-${prayerTimestampMinutes}`;
      if (currentTimestampMinutes === prayerTimestampMinutes && !firedAlertsRef.current.has(exactTag)) {
        firedAlertsRef.current.add(exactTag);
        triggerPrayerAlert(prayer, config, false);
        setActiveAlertBanner({
          title: `È il momento di ${prayer.name} (${prayer.arabicName})`,
          body: `Orario: ${prayer.timeString}.`,
        });
        setTimeout(() => setActiveAlertBanner(null), 8000);
      }

      if (config.offsetMinutes > 0) {
        const reminderTag = `pre-${prayer.key}-${reminderTimestampMinutes}`;
        if (currentTimestampMinutes === reminderTimestampMinutes && !firedAlertsRef.current.has(reminderTag)) {
          firedAlertsRef.current.add(reminderTag);
          triggerPrayerAlert(prayer, config, true);
          setActiveAlertBanner({
            title: `Promemoria: ${prayer.name} tra ${config.offsetMinutes} min`,
            body: `Inizio previsto alle ${prayer.timeString}.`,
          });
          setTimeout(() => setActiveAlertBanner(null), 8000);
        }
      }
    });
  }, [currentDate, prayers, notifications]);

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col font-sans ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Active In-App Notification Toast Banner */}
      {activeAlertBanner && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-emerald-950 border border-emerald-500/80 text-white p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 flex items-start gap-3">
          <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-sm text-emerald-200">
              {activeAlertBanner.title}
            </h4>
            <p className="text-xs text-slate-300">
              {activeAlertBanner.body}
            </p>
          </div>
          <button
            onClick={() => setActiveAlertBanner(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        location={location}
        theme={theme}
        viewMode={viewMode}
        weather={weather}
        onToggleTheme={toggleTheme}
        onToggleViewMode={toggleViewMode}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenQibla={() => setIsQiblaModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenTasbih={() => setIsTasbihModalOpen(true)}
        onOpenWeather={() => setIsWeatherModalOpen(true)}
        onOpenMethod={() => setIsMethodModalOpen(true)}
        onScrollToSection={handleScrollToSection}
      />

      {/* MAIN CONTAINER: SCHERMO COMPATTO OTTIMIZZATO (LIGHT / DARK) */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4">
        {/* Quick Toolbar (Udine, Martignacco, GPS, Light/Dark mode) */}
        <div className="flex items-center justify-between text-xs pb-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Zona rapida:</span>
            <button
              onClick={() => handleSelectLocation(POPULAR_CITIES[0])} // Udine
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                location.city.includes('Udine')
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              Udine
            </button>
            <button
              onClick={() => handleSelectLocation(POPULAR_CITIES[1])} // Martignacco
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                location.city.includes('Martignacco')
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              Martignacco
            </button>
            <button
              onClick={handleDetectGps}
              disabled={isGpsLoading}
              title="Rileva posizione esatta GPS"
              className="p-1 px-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <MapPin className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 ${isGpsLoading ? 'animate-bounce' : ''}`} />
              <span className="text-[10px]">GPS</span>
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Chiaro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scuro</span>
              </>
            )}
          </button>
        </div>

        {/* Compact Stacked Prayer List (Le 5 preghiere una sotto l'altra con calcolo rimanente) */}
        <CompactPrayersList
          prayers={prayers}
          night={night}
          notifications={notifications}
          completedPrayers={completedPrayers}
          weather={weather}
          onOpenWeather={() => setIsWeatherModalOpen(true)}
          onToggleCompleted={handleToggleCompleted}
          onToggleNotification={handleToggleSingleNotification}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenLocation={() => setIsLocationModalOpen(true)}
          locationName={location.city}
        />

        {/* Quick Shortcuts for Qibla, Calendario, Tasbih, and Meteo */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => setIsQiblaModalOpen(true)}
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shadow-xs cursor-pointer"
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold">Qibla</span>
          </button>

          <button
            onClick={() => setIsCalendarModalOpen(true)}
            title="Apri il Calendario Arabo (Lunare) con le feste islamiche e date solari"
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shadow-xs cursor-pointer group"
          >
            <Moon className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold leading-tight text-center">Calendario</span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium leading-none">& Feste</span>
          </button>

          <button
            onClick={() => setIsTasbihModalOpen(true)}
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shadow-xs cursor-pointer"
          >
            <span className="text-base leading-none">📿</span>
            <span className="text-xs font-semibold">Tasbih</span>
          </button>

          <button
            onClick={() => setIsWeatherModalOpen(true)}
            title="Meteo e previsioni per Udine, Martignacco o GPS"
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/40 transition-colors shadow-xs cursor-pointer group"
          >
            <WeatherIcon type={weather?.iconType || 'cloud-sun'} className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold leading-tight">Meteo</span>
            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold leading-none">
              {weather ? `${weather.temperature}°C` : '...'}
            </span>
          </button>
        </div>

        {/* Detailed Night Breakdown & Tahajjud Accordion/Card */}
        <div id="night-tahajjud" className="pt-2">
          <NightTahajjudSection
            night={night}
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          />
        </div>

        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-2 space-y-1">
          <p>Calcolato secondo la Lega Islamica Mondiale (MWL: Fajr 18.0°, Isha 17.0°)</p>
          <p>Supporto accurato per Udine, Martignacco e coordinate geografiche italiane</p>
        </div>
      </main>

      {/* Footer */}
      <Footer
        onOpenMethod={() => setIsMethodModalOpen(true)}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenQibla={() => setIsQiblaModalOpen(true)}
      />

      {/* Modals */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={location}
        onSelectLocation={handleSelectLocation}
        onDetectGps={handleDetectGps}
        isGpsLoading={isGpsLoading}
      />

      <NotificationSettingsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        prayers={prayers}
        notifications={notifications}
        onUpdateNotification={handleUpdateSingleNotification}
        onUpdateAllNotifications={handleUpdateNotifications}
      />

      <QiblaCompassModal
        isOpen={isQiblaModalOpen}
        onClose={() => setIsQiblaModalOpen(false)}
        location={location}
      />

      <MonthlyScheduleModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        location={location}
        settings={settings}
      />

      <TasbihModal
        isOpen={isTasbihModalOpen}
        onClose={() => setIsTasbihModalOpen(false)}
      />

      <CalculationMethodModal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weather={weather}
        locationName={location.city}
        onRefresh={loadWeather}
        isLoading={isWeatherLoading}
      />
    </div>
  );
}
