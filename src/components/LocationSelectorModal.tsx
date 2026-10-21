import React, { useState } from 'react';
import { X, Search, Navigation, MapPin, Check } from 'lucide-react';
import { LocationData } from '../types/prayer';
import { POPULAR_CITIES } from '../utils/prayerEngine';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationData;
  onSelectLocation: (loc: LocationData) => void;
  onDetectGps: () => void;
  isGpsLoading: boolean;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  onDetectGps,
  isGpsLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom coordinate state
  const [customCity, setCustomCity] = useState(currentLocation.city);
  const [customLat, setCustomLat] = useState(currentLocation.latitude.toString());
  const [customLng, setCustomLng] = useState(currentLocation.longitude.toString());
  const [customTz, setCustomTz] = useState(currentLocation.timezone);

  if (!isOpen) return null;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCities = POPULAR_CITIES.filter((c) => {
    if (!normalizedSearch) return true;
    const matchCity = c.city.toLowerCase().includes(normalizedSearch);
    const matchCountry = c.country.toLowerCase().includes(normalizedSearch);
    const matchAliases = c.aliases?.some((a) => a.toLowerCase().includes(normalizedSearch));
    // Phonetic spelling variation: handles 'martingacco' <-> 'martignacco'
    const altSearch = normalizedSearch
      .replace(/ingac/g, 'ignac')
      .replace(/ignac/g, 'ingac');
    const matchAlt =
      c.city.toLowerCase().includes(altSearch) ||
      c.aliases?.some((a) => a.toLowerCase().includes(altSearch));

    return matchCity || matchCountry || matchAliases || matchAlt;
  });

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onSelectLocation({
        city: customCity || 'Posizione Personalizzata',
        country: 'Coordinate Personalizzate',
        latitude: lat,
        longitude: lng,
        timezone: customTz || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-900 dark:text-white overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Scegli Zona & Posizione</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orari calcolati esattamente per le tue coordinate solari
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick GPS auto-detect banner */}
          <div className="p-4 bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/60 dark:to-slate-950 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>Rilevamento Automatico</span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Usa la posizione GPS esatta del tuo dispositivo
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Garantisce la massima accuratezza al secondo per il sorgere e il tramonto del sole.
              </p>
            </div>

            <button
              onClick={() => {
                onDetectGps();
                onClose();
              }}
              disabled={isGpsLoading}
              className="px-4 py-2.5 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isGpsLoading ? 'Rilevamento...' : 'Rileva Posizione GPS'}
            </button>
          </div>

          {/* Mode switch */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  !isCustomMode
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Città & Ricerca
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isCustomMode
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Coordinate Manuali
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Attuale: <strong className="text-emerald-700 dark:text-emerald-400">{currentLocation.city}</strong>
            </span>
          </div>

          {!isCustomMode ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cerca città (es. Udine, Martignacco, Roma, Milano...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-500 dark:text-slate-400 mr-1">Scelta rapida:</span>
                {[
                  { name: 'Udine', label: 'Udine (FVG)' },
                  { name: 'Martignacco', label: 'Martignacco (UD)' },
                  { name: 'Roma', label: 'Roma' },
                  { name: 'Milano', label: 'Milano' },
                  { name: 'Trieste', label: 'Trieste' },
                ].map((quick) => (
                  <button
                    key={quick.name}
                    type="button"
                    onClick={() => {
                      const match = POPULAR_CITIES.find((c) =>
                        c.city.toLowerCase().startsWith(quick.name.toLowerCase())
                      );
                      if (match) {
                        onSelectLocation(match);
                        onClose();
                      } else {
                        setSearchTerm(quick.name);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      currentLocation.city.toLowerCase().includes(quick.name.toLowerCase())
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/60 font-semibold'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {quick.label}
                  </button>
                ))}
              </div>

              {/* City List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredCities.map((cityItem) => {
                  const isSelected =
                    currentLocation.city === cityItem.city &&
                    Math.abs(currentLocation.latitude - cityItem.latitude) < 0.05;

                  return (
                    <button
                      key={`${cityItem.city}-${cityItem.country}`}
                      onClick={() => {
                        onSelectLocation(cityItem);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500/40'
                          : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold">{cityItem.city}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{cityItem.country}</div>
                      </div>

                      {isSelected && (
                        <div className="p-1 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Coordinates Form */
            <form onSubmit={handleApplyCustom} className="space-y-4 bg-slate-50 dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome Località / Città
                  </label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Es. Udine Nord"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fuso Orario
                  </label>
                  <input
                    type="text"
                    value={customTz}
                    onChange={(e) => setCustomTz(e.target.value)}
                    placeholder="Europe/Rome"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Latitudine
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="es. 46.0626"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Longitudine
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="es. 13.2346"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
                >
                  Applica Coordinate
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
