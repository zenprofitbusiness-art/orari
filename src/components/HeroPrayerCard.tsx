import React, { useState, useEffect } from 'react';
import { Volume2, Navigation, Clock, ShieldCheck, Moon } from 'lucide-react';
import { LocationData, NightCalculation, PrayerTimeItem } from '../types/prayer';
import { getHijriDate } from '../utils/prayerEngine';
import { playPrayerSound } from '../utils/soundEngine';

interface HeroPrayerCardProps {
  location: LocationData;
  prayers: PrayerTimeItem[];
  night: NightCalculation;
  currentDate: Date;
  onDetectGps: () => void;
  onOpenMethod: () => void;
  onOpenNotifications: () => void;
  isGpsLoading: boolean;
}

export const HeroPrayerCard: React.FC<HeroPrayerCardProps> = ({
  location,
  prayers,
  night,
  currentDate,
  onDetectGps,
  onOpenMethod,
  onOpenNotifications,
  isGpsLoading,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hijri = getHijriDate(now);

  // Determine current active prayer and upcoming prayer
  // Sorted timeline items of today/night
  const sortedEvents = [...prayers].sort((a, b) => a.time.getTime() - b.time.getTime());
  
  let nextEvent = sortedEvents.find((p) => p.time.getTime() > now.getTime());
  // If all events passed today, next is tomorrow's Fajr
  if (!nextEvent) {
    nextEvent = {
      ...prayers.find((p) => p.key === 'fajr')!,
      name: 'Fajr (Domani)',
    };
  }

  // Detect if a prayer is currently active right now
  const currentActive = prayers.find(
    (p) =>
      !p.isNightMoment &&
      !p.isOptional &&
      p.time.getTime() <= now.getTime() &&
      p.endTime &&
      now.getTime() < p.endTime.getTime()
  );

  const displayEvent = currentActive || nextEvent;
  const targetTime = currentActive?.endTime || nextEvent.time;
  const isCurrentlyActive = !!currentActive;

  // Calculate countdown in HH:MM:SS
  const diffMs = Math.max(0, targetTime.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const elapsedMins = currentActive
    ? Math.max(0, Math.floor((now.getTime() - currentActive.time.getTime()) / 60000))
    : 0;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Format current Gregorian date
  const gregorianStr = now.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
      {/* Background Photography with measured contrast scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/prayer_night_sky_1792425250413.jpg"
          alt="Sereno cielo notturno e arcata islamica"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
      </div>

      {/* Content Canvas */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white">
        {/* Top line metadata: Gregorian date, Hijri date, and calculation method */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="capitalize text-slate-200 font-medium">{gregorianStr}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-amber-300/90 font-medium">
              {hijri.day} {hijri.monthName} {hijri.year} AH ({hijri.arabicMonth})
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-emerald-300 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMethod}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-md hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lega Islamica Mondiale (MWL)</span>
            </button>
          </div>
        </div>

        {/* Central Display Split */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Big Countdown & Prayer Status */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-400">
              <span className={`w-2 h-2 rounded-full ${isCurrentlyActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span>
                {isCurrentlyActive
                  ? `Preghiera in Corso (Iniziata da ${elapsedMins} min)`
                  : 'Prossimo Momento di Preghiera'}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                  {displayEvent.name}
                </h1>
                <span className="text-2xl sm:text-3xl font-serif text-amber-200/90 font-normal">
                  {displayEvent.arabicName}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
                {isCurrentlyActive
                  ? `Attualmente nella finestra di ${displayEvent.name}. Finirà alle ${displayEvent.endTimeString}. Prega prima del termine del tempo.`
                  : displayEvent.description}
              </p>
            </div>

            {/* Countdown Clock (Tabular numerals) */}
            <div className="pt-2">
              <div className="inline-flex items-baseline gap-3 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-emerald-400">
                    {pad(hours)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Ore</span>
                </div>
                <span className="text-2xl font-mono text-slate-600">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-emerald-400">
                    {pad(minutes)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Min</span>
                </div>
                <span className="text-2xl font-mono text-slate-600">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-emerald-400">
                    {pad(seconds)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Sec</span>
                </div>

                <div className="ml-4 pl-4 border-l border-slate-800 flex flex-col justify-center">
                  <span className="text-xs text-slate-400">
                    {isCurrentlyActive ? 'Finisce alle:' : 'Inizio esatto:'}
                  </span>
                  <span className="text-lg font-bold font-mono text-white">
                    {isCurrentlyActive ? displayEvent.endTimeString : displayEvent.timeString}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onDetectGps}
                disabled={isGpsLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-60"
              >
                <Navigation className={`w-4 h-4 ${isGpsLoading ? 'animate-spin' : ''}`} />
                <span>{isGpsLoading ? 'Rilevamento GPS...' : 'Precisione GPS Posizione'}</span>
              </button>

              <button
                onClick={() => playPrayerSound('adhan')}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Ascolta un'anteprima dell'Adhan o del tono di risveglio"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Ascolta Adhan</span>
              </button>
            </div>
          </div>

          {/* Right Column: Special Night Focus Pill / Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/70 to-slate-900/90 border border-indigo-900/40 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>STATO NOTTE & TAHAJJUD</span>
              </div>
              {night.isInLastThird ? (
                <span className="px-2.5 py-0.5 text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 rounded-md">
                  Sei nell'Ultimo Terzo!
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  {night.currentNightPhase === 'day' ? 'Fase diurna' : 'Prima metà della notte'}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-indigo-900/30">
                <span className="text-slate-300">Metà della Notte (Nisf al-Layl):</span>
                <span className="font-mono font-bold text-indigo-200 text-sm">
                  {night.midnight.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-indigo-900/30">
                <span className="text-slate-300 font-medium">Inizio Ultimo Terzo:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {night.lastThirdStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-300">Finestra Consigliata Tahajjud:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {night.lastThirdStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{' '}
                  {night.fajrTomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Night Progress Bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Progresso Notturno</span>
                <span className="font-mono text-indigo-300">{night.nightProgressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-2 transition-all duration-500"
                  style={{ width: `${night.nightProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Maghrib</span>
                <span>Metà Notte</span>
                <span>Ultimo 1/3 (Tahajjud)</span>
                <span>Fajr</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-800/30 rounded-xl text-[11px] text-slate-300 italic">
              "Nostro Signore scende ogni notte nel cielo più basso durante l'ultimo terzo della notte e dice: 'Chi Mi invoca affinché Io gli risponda?'" (Sahih al-Bukhari)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
