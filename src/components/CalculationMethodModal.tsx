import React from 'react';
import { X, ShieldCheck, Check, Sliders, Info } from 'lucide-react';
import { CalculationSettings, PrayerKey } from '../types/prayer';

interface CalculationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CalculationSettings;
  onUpdateSettings: (newSettings: CalculationSettings) => void;
}

export const CalculationMethodModal: React.FC<CalculationMethodModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const methodsList: Array<{
    id: CalculationSettings['method'];
    name: string;
    fajr: string;
    isha: string;
    desc: string;
    isMwl?: boolean;
  }> = [
    {
      id: 'MWL',
      name: 'Lega Islamica Mondiale (Muslim World League)',
      fajr: '18.0°',
      isha: '17.0°',
      desc: 'Il metodo ufficiale richiesto, raccomandato in Europa, Italia e dalla maggioranza delle comunità islamiche mondiali.',
      isMwl: true,
    },
    {
      id: 'Egypt',
      name: 'Autorità Generale Egiziana (ESA)',
      fajr: '19.5°',
      isha: '17.5°',
      desc: 'Utilizzato in Egitto e parti del Nord Africa.',
    },
    {
      id: 'Makkah',
      name: 'Umm al-Qura (La Mecca)',
      fajr: '18.5°',
      isha: '90 min',
      desc: 'Metodo ufficiale del Regno dell\'Arabia Saudita (Isha = 90 min dopo Maghrib).',
    },
    {
      id: 'ISNA',
      name: 'Islamic Society of North America (ISNA)',
      fajr: '15.0°',
      isha: '15.0°',
      desc: 'Comune in Nord America.',
    },
    {
      id: 'Diyanet',
      name: 'Presidenza Affari Religiosi (Diyanet - Turchia)',
      fajr: '18.0°',
      isha: '17.0°',
      desc: 'Standard ufficiale turco e balcanico.',
    },
  ];

  const handleSelectMethod = (methodId: CalculationSettings['method']) => {
    onUpdateSettings({ ...settings, method: methodId });
  };

  const handleSelectAsr = (asrMethod: CalculationSettings['asrMethod']) => {
    onUpdateSettings({ ...settings, asrMethod });
  };

  const handleOffsetChange = (key: PrayerKey, deltaMinutes: number) => {
    onUpdateSettings({
      ...settings,
      manualOffsets: {
        ...settings.manualOffsets,
        [key]: deltaMinutes,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-900 dark:text-white overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Metodo di Calcolo Astronomico</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configurato con la Lega Islamica Mondiale (MWL: 18° / 17°)
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* MWL Highlight Note */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Precisione della Lega Islamica Mondiale (MWL):
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Gli orari per Fajr sono calcolati all'angolo solare di <strong>18.0°</strong> sotto l'orizzonte e Isha a <strong>17.0°</strong>.
              </p>
            </div>
          </div>

          {/* Methods List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Seleziona Metodo di Calcolo
            </div>

            <div className="space-y-2.5">
              {methodsList.map((m) => {
                const isSelected = settings.method === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMethod(m.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white ring-1 ring-emerald-500/50'
                        : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</span>
                        {m.isMwl && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-950 bg-emerald-400 rounded-md">
                            Predefinito Attivo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</div>
                      <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 pt-0.5">
                        Angoli: Fajr {m.fajr} · Isha {m.isha}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="p-1 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 rounded-full shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asr Juristic Method */}
          <div className="space-y-3 pt-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Scuola Giuridica per Asr (Madhab)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectAsr('Standard')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  settings.asrMethod === 'Standard'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm">Standard (Shafi'i, Maliki, Hanbali)</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ombra uguale all'altezza dell'oggetto (fattore 1x).
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAsr('Hanafi')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  settings.asrMethod === 'Hanafi'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm">Hanafi</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ombra doppia rispetto all'altezza dell'oggetto (fattore 2x).
                </div>
              </button>
            </div>
          </div>

          {/* Minute Adjustments / Fine-tuning */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Sincronizzazione Minuti con Moschea Locale (+/-)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'tahajjud'] as PrayerKey[]).map((k) => (
                <div
                  key={k}
                  className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <span className="text-xs capitalize font-medium text-slate-800 dark:text-slate-200">{k}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOffsetChange(k, (settings.manualOffsets[k] || 0) - 1)}
                      className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs flex items-center justify-center font-mono cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 w-6 text-center font-bold">
                      {(settings.manualOffsets[k] || 0) > 0 ? `+${settings.manualOffsets[k]}` : settings.manualOffsets[k] || 0}
                    </span>
                    <button
                      onClick={() => handleOffsetChange(k, (settings.manualOffsets[k] || 0) + 1)}
                      className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs flex items-center justify-center font-mono cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
};
