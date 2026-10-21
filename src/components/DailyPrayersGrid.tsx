import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  Moon,
} from 'lucide-react';
import { AllNotificationsConfig, PrayerKey, PrayerTimeItem } from '../types/prayer';
import { playPrayerSound } from '../utils/soundEngine';
import { getHijriDate } from '../utils/prayerEngine';

interface DailyPrayersGridProps {
  prayers: PrayerTimeItem[];
  notifications: AllNotificationsConfig;
  onToggleNotification: (key: PrayerKey) => void;
  onOpenNotifications: () => void;
  currentDate: Date;
  completedPrayers: string[];
  onToggleCompleted: (key: string) => void;
}

export const DailyPrayersGrid: React.FC<DailyPrayersGridProps> = ({
  prayers,
  notifications,
  onToggleNotification,
  onOpenNotifications,
  currentDate,
  completedPrayers,
  onToggleCompleted,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter to show the main 5 prayers + Shuruq + Duha + Imsak
  const primaryKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const fivePrayers = prayers.filter((p) => primaryKeys.includes(p.key));
  const optionalPrayers = prayers.filter((p) => ['imsak', 'sunrise', 'duha'].includes(p.key));

  // Find active prayer (last one whose time <= now)
  let activeIndex = -1;
  for (let i = 0; i < fivePrayers.length; i++) {
    if (fivePrayers[i].time.getTime() <= now.getTime()) {
      activeIndex = i;
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

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

  // Dates: Solar & Arabic Lunar
  const hijri = getHijriDate(now);
  const rawSolarDate = now.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const solarDateStr = rawSolarDate.charAt(0).toUpperCase() + rawSolarDate.slice(1);

  const completedCount = fivePrayers.filter((p) => completedPrayers.includes(p.key)).length;

  return (
    <section id="today-prayers" className="scroll-mt-20 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Orari Giornalieri · Calcolo Rimanente
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Le 5 Preghiere (Una sotto l'altra)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualizzazione con conto alla rovescia per le preghiere ancora da compiere oggi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            Eseguite:{' '}
            <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
              {completedCount} / 5
            </strong>
          </div>

          <button
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-600 dark:hover:border-emerald-700/50 transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Avvisi</span>
          </button>
        </div>
      </div>

      {/* Calendario Solare & Calendario Arabo (Lunare) all'inizio */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{solarDateStr}</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
            <Moon className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {hijri.day} {hijri.monthName} {hijri.year} AH ({hijri.arabicMonth})
            </span>
          </div>

          <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 pl-2 border-l border-slate-200 dark:border-slate-800 tabular-nums">
            {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
          </div>
        </div>
      </div>

      {/* STACKED LIST: ONE UNDER THE OTHER (UNA SOTTO L'ALTRA) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-2 transition-colors">
        {fivePrayers.map((prayer) => {
          const isDone = completedPrayers.includes(prayer.key);
          const isPastStart = prayer.time.getTime() <= now.getTime();
          const isBeforeEnd = prayer.endTime ? now.getTime() < prayer.endTime.getTime() : true;
          const isCurrent = isPastStart && isBeforeEnd;
          const isUpcoming = prayer.time.getTime() > now.getTime();
          const countdown = formatCountdown(prayer.time);
          const notif = notifications[prayer.key];
          const isNotifOn = notif?.enabled;

          const elapsedMins = Math.max(0, Math.floor((now.getTime() - prayer.time.getTime()) / 60000));
          const remainingToEndCountdown = prayer.endTime ? formatCountdown(prayer.endTime) : null;

          return (
            <div
              key={prayer.key}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/30'
                  : isDone
                  ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-80'
                  : isUpcoming
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
              }`}
            >
              {/* Left Zone: Checklist Checkbox + Name + Arabic Name */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleCompleted(prayer.key)}
                  title={isDone ? 'Segna come non ancora pregata' : 'Segna come pregata'}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                    isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="truncate">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className={`text-base font-bold truncate ${
                        isDone
                          ? 'line-through text-slate-500 dark:text-slate-400'
                          : isCurrent
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {prayer.name}
                    </span>
                    <span className="text-sm font-serif text-slate-500 dark:text-slate-400">
                      {prayer.arabicName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                    {prayer.description}
                  </p>
                </div>
              </div>

              {/* Middle Zone: Calcolo Rimanente per chi deve ancora fare */}
              <div className="pl-10 sm:pl-0 flex items-center gap-3">
                <div className="text-left sm:text-right">
                  {isDone ? (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <span>✓ Eseguita</span>
                    </span>
                  ) : isCurrent ? (
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        In corso ora (iniziata da {elapsedMins} min)
                      </span>
                      {prayer.endTime && (
                        <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-mono font-medium">
                          Finisce alle {prayer.endTimeString} · Mancano {remainingToEndCountdown}
                        </span>
                      )}
                    </div>
                  ) : isUpcoming ? (
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Da fare
                      </span>
                      <span className="text-xs font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 block">
                        Mancano: {countdown}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Terminata alle {prayer.endTimeString}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                        Non ancora spuntata
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Zone: Time & Actions */}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <span
                    className={`text-xl font-extrabold font-mono tabular-nums ${
                      isCurrent
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {prayer.timeString}
                  </span>

                  {/* Sound preview */}
                  <button
                    onClick={() => playPrayerSound(notif?.sound || 'adhan')}
                    title={`Ascolta suono per ${prayer.name}`}
                    className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Notification toggle */}
                  <button
                    onClick={() => onToggleNotification(prayer.key)}
                    title={isNotifOn ? `Disattiva notifica ${prayer.name}` : `Attiva notifica ${prayer.name}`}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isNotifOn
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {isNotifOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Voluntary / Sunnah times stacked in small at bottom */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Momenti Correlati (In Piccolo):
          </span>
          <div className="flex items-center gap-4 flex-wrap font-mono">
            {optionalPrayers.map((p) => (
              <span key={p.key} className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-sans">{p.name}:</span>
                <strong className="text-slate-800 dark:text-slate-200">{p.timeString}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
