import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  Bell,
  Volume2,
  Moon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AllNotificationsConfig, NightCalculation, PrayerKey, PrayerTimeItem } from '../types/prayer';
import { getHijriDate } from '../utils/prayerEngine';
import { playPrayerSound } from '../utils/soundEngine';
import { WeatherData } from '../utils/weatherEngine';
import { WeatherIcon } from './WeatherModal';

interface CompactPrayersListProps {
  prayers: PrayerTimeItem[];
  night: NightCalculation;
  notifications: AllNotificationsConfig;
  completedPrayers: string[];
  weather?: WeatherData | null;
  onOpenWeather?: () => void;
  onToggleCompleted: (key: string) => void;
  onToggleNotification: (key: PrayerKey) => void;
  onOpenNotifications: () => void;
  onOpenLocation: () => void;
  locationName: string;
}

export const CompactPrayersList: React.FC<CompactPrayersListProps> = ({
  prayers,
  night,
  notifications,
  completedPrayers,
  weather,
  onOpenWeather,
  onToggleCompleted,
  onToggleNotification,
  onOpenNotifications,
  onOpenLocation,
  locationName,
}) => {
  const [now, setNow] = useState(new Date());
  const [showSecondaryPrayers, setShowSecondaryPrayers] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Primary 5 daily prayers in canonical sequence
  const primaryKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const primaryPrayers = prayers.filter((p) => primaryKeys.includes(p.key));

  // Secondary voluntary times (Imsak, Shuruq, Duha)
  const secondaryKeys: PrayerKey[] = ['imsak', 'sunrise', 'duha'];
  const secondaryPrayers = prayers.filter((p) => secondaryKeys.includes(p.key));

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Format countdown string
  const formatCountdown = (targetDate: Date) => {
    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = Math.floor((diffMs % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m ${pad(s)}s`;
    return `${m}m ${pad(s)}s`;
  };

  // Dates: Solar (Gregorian) & Arabic Lunar (Hijri)
  const hijri = getHijriDate(now);
  const rawSolarDate = now.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const solarDateStr = rawSolarDate.charAt(0).toUpperCase() + rawSolarDate.slice(1);

  // Completed count (user checked or automatically marked executed)
  const isPrayerDone = (prayer: PrayerTimeItem) => {
    if (completedPrayers.includes(prayer.key)) return true;
    // If user hasn't explicitly unchecked and prayer time has already ended
    const hasEnded = prayer.endTime ? now.getTime() >= prayer.endTime.getTime() : false;
    // We treat past prayers as executed by default unless user unchecks them
    const isExplicitlyMissed = completedPrayers.includes(`missed_${prayer.key}`);
    return hasEnded && !isExplicitlyMissed;
  };

  const completedCount = primaryPrayers.filter((p) => isPrayerDone(p)).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl transition-colors space-y-4">
      {/* 1. GIORNO DEL CALENDARIO SOLARE E QUELLO ARABO (LUNARE) ALL'INIZIO */}
      <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 via-slate-50 to-amber-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl space-y-2.5 shadow-sm">
        {/* Giorno Calendario Solare */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
              <Calendar className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                Calendario Solare
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                {solarDateStr}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
              Ora Locale
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
              </span>
            </div>
          </div>
        </div>

        {/* Giorno Calendario Arabo (Lunare / Hijri) */}
        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
              <Moon className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                Calendario Arabo (Lunare)
              </span>
              <span className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                {hijri.day} {hijri.monthName} {hijri.year} AH
              </span>
            </div>
          </div>

          <span className="text-xs sm:text-sm font-serif text-amber-700 dark:text-amber-400 font-medium tracking-wide">
            {hijri.arabicMonth}
          </span>
        </div>
      </div>

      {/* 2. Top Bar: Location & Eseguite Counter */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onOpenLocation}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate max-w-[170px] sm:max-w-[220px]">{locationName}</span>
          <span className="text-[10px] text-slate-400 font-normal underline">Cambia</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Eseguite:
          </span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
            {completedCount}/5
          </span>
        </div>
      </div>

      {/* 2.5 Meteo in Tempo Reale (Compatto) */}
      {weather && (
        <button
          type="button"
          onClick={onOpenWeather}
          title="Clicca per aprire le previsioni meteo dettagliate e orarie"
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-sky-50/90 via-blue-50/60 to-indigo-50/40 dark:from-sky-950/40 dark:via-slate-900/90 dark:to-indigo-950/30 border border-sky-200/80 dark:border-sky-900/50 hover:border-sky-300 dark:hover:border-sky-700 transition-colors text-xs cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
              <WeatherIcon type={weather.iconType} className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {weather.temperature}°C
                </span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {weather.description}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 leading-none">
                Meteo attuale a {locationName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="text-blue-600 dark:text-blue-400">↓{weather.tempMin}°</span>
              {' '}
              <span className="text-amber-600 dark:text-amber-400">↑{weather.tempMax}°</span>
            </div>
            {weather.precipitationProbMax > 0 && (
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/80 px-1.5 py-0.5 rounded">
                💧 {weather.precipitationProbMax}%
              </span>
            )}
            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
              Previsioni →
            </span>
          </div>
        </button>
      )}

      {/* 3. Section Title + Link Avvisi & Suoni */}
      <div className="flex items-center justify-between pt-1 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Le 5 Preghiere (Una Sotto l'Altra)
        </span>
        <button
          onClick={onOpenNotifications}
          className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Avvisi & Suoni</span>
        </button>
      </div>

      {/* 4. THE 5 PRAYERS STACKED VERTICALLY (UNA SOTTO L'ALTRA) */}
      <div className="space-y-2.5">
        {primaryPrayers.map((prayer) => {
          const isDone = isPrayerDone(prayer);
          const isPastStart = prayer.time.getTime() <= now.getTime();
          const isBeforeEnd = prayer.endTime ? now.getTime() < prayer.endTime.getTime() : true;
          const isCurrent = isPastStart && isBeforeEnd;
          const isUpcoming = prayer.time.getTime() > now.getTime();
          const countdown = formatCountdown(prayer.time);
          const notif = notifications[prayer.key];

          const elapsedMins = Math.max(0, Math.floor((now.getTime() - prayer.time.getTime()) / 60000));
          const remainingCountdown = prayer.endTime ? formatCountdown(prayer.endTime) : null;

          return (
            <div
              key={prayer.key}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-emerald-50/95 dark:bg-emerald-950/60 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                  : isDone
                  ? 'bg-slate-50/90 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60'
                  : isUpcoming
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/70'
              }`}
            >
              {/* Left: Checkbox "Ho pregato" + Prayer Name + Arabic + Status Text */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleCompleted(prayer.key)}
                  title={isDone ? 'Segna come da pregare / recuperare' : 'Segna come completata'}
                  className={`p-1 rounded-xl transition-colors cursor-pointer shrink-0 ${
                    isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950/80" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="truncate flex-1">
                  <div className="flex items-baseline gap-2 truncate">
                    <span
                      className={`text-sm sm:text-base font-bold truncate ${
                        isCurrent
                          ? 'text-emerald-900 dark:text-emerald-200 font-extrabold'
                          : isDone
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {prayer.name}
                    </span>
                    <span className="text-xs sm:text-sm font-serif text-slate-500 dark:text-slate-400">
                      {prayer.arabicName}
                    </span>
                  </div>

                  {/* Status / Calcolo Rimanente */}
                  <div className="text-[11px] pt-0.5">
                    {isCurrent ? (
                      <div className="space-y-0.5">
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          In corso ora (da {elapsedMins} min)
                        </span>
                        {prayer.endTime && (
                          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-mono font-medium block">
                            Finisce alle {prayer.endTimeString} · Mancano {remainingCountdown}
                          </span>
                        )}
                      </div>
                    ) : isDone ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        ✓ Fatta (Eseguita)
                      </span>
                    ) : isUpcoming ? (
                      <span className="text-slate-700 dark:text-slate-300 font-medium font-mono tabular-nums">
                        Da fare · tra {countdown}
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 font-medium text-[11px]">
                        Terminata alle {prayer.endTimeString}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Orario Inizio e Fine + Quick Audio Preview & Alert */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span
                    className={`text-base sm:text-lg font-bold font-mono tabular-nums block ${
                      isCurrent
                        ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {prayer.timeString}
                  </span>
                  {prayer.endTime && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                      fino {prayer.endTimeString}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => playPrayerSound(notif?.sound || 'adhan')}
                  title="Ascolta anteprima audio"
                  className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleNotification(prayer.key)}
                  title={notif?.enabled ? 'Notifica attiva' : 'Notifica disattiva'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    notif?.enabled
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Ultimo Terzo della Notte & Tahajjud Strip */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-50/90 dark:from-indigo-950/60 dark:via-purple-950/50 dark:to-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
            <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Ultimo Terzo Notturno & Tahajjud</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300">
            Inizio:{' '}
            <strong className="font-mono text-amber-800 dark:text-amber-300">
              {night.lastThirdStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </strong>{' '}
            fino a Fajr ({night.fajrTomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
            {night.isInLastThird ? 'Attivo ora:' : 'Mancano:'}
          </span>
          <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-300">
            {night.isInLastThird
              ? "Nell'Ultimo 1/3!"
              : formatCountdown(night.lastThirdStart) || 'Stasera'}
          </span>
        </div>
      </div>

      {/* 6. Collapsible Voluntary Times (Shuruq, Duha, Imsak) */}
      <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => setShowSecondaryPrayers(!showSecondaryPrayers)}
          className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1 transition-colors cursor-pointer"
        >
          <span className="font-medium">
            Altri orari volontari (Shuruq, Duha, Imsak)
          </span>
          {showSecondaryPrayers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSecondaryPrayers && (
          <div className="space-y-1.5 mt-2 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
            {secondaryPrayers.map((prayer) => (
              <div
                key={prayer.key}
                className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {prayer.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">
                    {prayer.arabicName}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {prayer.timeString}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
