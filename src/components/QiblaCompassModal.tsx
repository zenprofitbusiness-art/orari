import React, { useState, useEffect } from 'react';
import { X, Compass, MapPin, Navigation } from 'lucide-react';
import { LocationData } from '../types/prayer';
import { calculateQibla } from '../utils/prayerEngine';

interface QiblaCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationData;
}

export const QiblaCompassModal: React.FC<QiblaCompassModalProps> = ({
  isOpen,
  onClose,
  location,
}) => {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading on iOS, alpha on Android
      let heading: number | null = null;
      if ('webkitCompassHeading' in e && typeof (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number') {
        heading = (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null) {
        setDeviceHeading(Math.round(heading));
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const { bearing, distanceKm } = calculateQibla(location.latitude, location.longitude);

  // If device heading is available, relative needle rotation is (bearing - deviceHeading)
  const relativeAngle = deviceHeading !== null ? (bearing - deviceHeading + 360) % 360 : bearing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl text-slate-900 dark:text-white overflow-hidden flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Bussola della Qibla</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direzione verso la Sacra Kaaba (La Mecca)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compass Dial Area */}
        <div className="p-6 flex flex-col items-center justify-center space-y-6">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center">
              {/* Cardinal points */}
              <span className="absolute top-2 text-xs font-bold text-red-400">N (0°)</span>
              <span className="absolute right-3 text-xs font-semibold text-slate-400">E (90°)</span>
              <span className="absolute bottom-2 text-xs font-semibold text-slate-400">S (180°)</span>
              <span className="absolute left-3 text-xs font-semibold text-slate-400">O (270°)</span>

              {/* Minute ticks */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-2 bg-slate-700"
                  style={{
                    transform: `rotate(${i * 30}deg) translateY(-120px)`,
                  }}
                />
              ))}

              {/* Kaaba marker on the ring at exact bearing */}
              <div
                className="absolute w-full h-full flex items-start justify-center pointer-events-none transition-transform duration-300"
                style={{ transform: `rotate(${bearing}deg)` }}
              >
                <div className="w-6 h-6 -mt-3 bg-amber-400 text-slate-950 rounded-full border-2 border-slate-950 flex items-center justify-center font-bold text-[10px] shadow-lg shadow-amber-400/50">
                  🕋
                </div>
              </div>

              {/* Compass Needle */}
              <div
                className="relative w-8 h-48 flex items-center justify-center transition-transform duration-300 pointer-events-none"
                style={{ transform: `rotate(${relativeAngle}deg)` }}
              >
                {/* North/Qibla Pointer */}
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[90px] border-b-emerald-400 filter drop-shadow(0 0 6px rgba(52,211,153,0.5))" />
                {/* Pivot Center */}
                <div className="absolute w-6 h-6 rounded-full bg-slate-900 border-2 border-emerald-400 z-10 flex items-center justify-center shadow" />
                {/* South Pointer */}
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[90px] border-t-slate-700" />
              </div>
            </div>
          </div>

          {/* Location & Bearing Stats */}
          <div className="w-full grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wide block">
                Angolo Qibla
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {bearing}°
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">da Nord vero</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wide block">
                Distanza Kaaba
              </span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                {distanceKm.toLocaleString('it-IT')} km
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">dalla tua posizione</span>
            </div>
          </div>

          <div className="w-full p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              Calcolato per <strong className="text-slate-200">{location.city}</strong> ({location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
