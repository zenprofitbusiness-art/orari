import React from 'react';
import {
  X,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  RefreshCw,
  MapPin,
  Calendar,
} from 'lucide-react';
import { WeatherData } from '../utils/weatherEngine';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  locationName: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const WeatherIcon: React.FC<{
  type: WeatherData['iconType'];
  className?: string;
}> = ({ type, className = 'w-5 h-5' }) => {
  switch (type) {
    case 'sun':
      return <Sun className={`${className} text-amber-500`} />;
    case 'moon':
      return <Moon className={`${className} text-indigo-400`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-amber-500`} />;
    case 'cloud-moon':
      return <CloudMoon className={`${className} text-indigo-400`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-400`} />;
    case 'rain':
      return <CloudRain className={`${className} text-sky-500`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-400`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-blue-300`} />;
    case 'thunder':
      return <CloudLightning className={`${className} text-amber-400`} />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-400`} />;
    default:
      return <Sun className={`${className} text-amber-500`} />;
  }
};

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  locationName,
  onRefresh,
  isLoading = false,
}) => {
  if (!isOpen || !weather) return null;

  // Prayer advice based on current weather
  const getPrayerWeatherAdvice = () => {
    if (weather.weatherCode >= 51 && weather.weatherCode <= 82) {
      return {
        icon: <Umbrella className="w-4 h-4 text-sky-500 shrink-0" />,
        title: 'Pioggia in corso o prevista',
        text: "Si raccomanda di portare l'ombrello per recarsi alla preghiera in moschea e prestare attenzione sui marciapiedi.",
      };
    }
    if (weather.weatherCode >= 95) {
      return {
        icon: <CloudLightning className="w-4 h-4 text-amber-500 shrink-0" />,
        title: 'Temporale attivo',
        text: 'Attenzione ai fulmini e forti rovesci. Se le condizioni sono proibitive, la Sunnah consente di pregare a casa.',
      };
    }
    if (weather.temperature <= 4) {
      return {
        icon: <Thermometer className="w-4 h-4 text-blue-400 shrink-0" />,
        title: 'Clima molto rigido',
        text: "Copriti accuratamente per l'Alba (Fajr) e la Notte (Isha). Assicurati di asciugarti bene dopo il Wudu.",
      };
    }
    if (weather.temperature >= 32) {
      return {
        icon: <Sun className="w-4 h-4 text-amber-500 shrink-0" />,
        title: 'Caldo intenso',
        text: "Cerca zone d'ombra per raggiungere il luogo di culto e idratati dopo il tramonto.",
      };
    }
    return {
      icon: <Sun className="w-4 h-4 text-emerald-500 shrink-0" />,
      title: 'Condizioni ideali',
      text: 'Meteo favorevole per recarsi alla preghiera congregazionale e godere dei momenti all’aperto.',
    };
  };

  const advice = getPrayerWeatherAdvice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/70 border border-sky-200/60 dark:border-sky-800/50 rounded-xl text-sky-600 dark:text-sky-400">
              <WeatherIcon type={weather.iconType} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Meteo & Previsioni
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <strong>{locationName}</strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Dati meteo ad alta precisione in tempo reale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Aggiorna meteo"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Main Weather Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-blue-50/60 dark:from-slate-800/90 dark:via-slate-850 dark:to-sky-950/40 border border-sky-100 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-sky-700 dark:text-sky-400">
                  Ora Attuale
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                    {weather.temperature}°C
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Percepita {weather.apparentTemperature}°C
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <WeatherIcon type={weather.iconType} className="w-4 h-4" />
                  <span>{weather.description}</span>
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400">↓ {weather.tempMin}°</span>
                  {' · '}
                  <span className="text-amber-600 dark:text-amber-400">↑ {weather.tempMax}°</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pioggia oggi: <strong>{weather.precipitationProbMax}%</strong>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-sky-100 dark:border-slate-700/60 text-xs">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Droplets className="w-3.5 h-3.5 text-sky-500 mb-0.5" />
                <span className="text-[10px] text-slate-400">Umidità</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{weather.humidity}%</span>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Wind className="w-3.5 h-3.5 text-teal-500 mb-0.5" />
                <span className="text-[10px] text-slate-400">Vento</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{weather.windSpeed} km/h</span>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Umbrella className="w-3.5 h-3.5 text-indigo-500 mb-0.5" />
                <span className="text-[10px] text-slate-400">Prob. Pioggia</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{weather.precipitationProbMax}%</span>
              </div>
            </div>
          </div>

          {/* Prayer Weather Tip / Mosque Advice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 flex items-start gap-3 text-xs">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              {advice.icon}
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                {advice.title}
              </h4>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                {advice.text}
              </p>
            </div>
          </div>

          {/* 24-Hour Forecast (Horizontal Scroll) */}
          {weather.hourly.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Previsioni Prossime Ore
                </span>
                <span className="text-[10px] text-slate-400">Scorri orizzontalmente →</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {weather.hourly.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 min-w-[70px] shrink-0 text-center"
                  >
                    <span className="text-[10px] font-mono text-slate-400">{h.time}</span>
                    <div className="my-1.5">
                      <WeatherIcon type={h.iconType} className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                      {h.temperature}°
                    </span>
                    {h.precipitationProb > 0 ? (
                      <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                        {h.precipitationProb}%
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5">0%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Forecast */}
          {weather.daily.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Previsioni per i Prossimi Giorni
              </span>

              <div className="space-y-1.5">
                {weather.daily.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="w-24 font-semibold text-slate-800 dark:text-slate-200">
                      {d.dayName}
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-center">
                      <WeatherIcon type={d.iconType} className="w-4 h-4" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                        {d.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-right shrink-0">
                      {d.precipitationProbMax > 20 && (
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                          {d.precipitationProbMax}%
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px]">{d.tempMin}°</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {d.tempMax}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-1">
            Fonte meteo: Open-Meteo · Coordinate di {locationName}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
