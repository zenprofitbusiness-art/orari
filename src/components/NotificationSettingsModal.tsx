import React, { useState } from 'react';
import { X, Bell, Volume2, Sparkles } from 'lucide-react';
import { AllNotificationsConfig, PrayerKey, PrayerTimeItem } from '../types/prayer';
import { getNotificationPermission, requestNotificationPermission } from '../utils/notificationEngine';
import { playPrayerSound } from '../utils/soundEngine';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayers: PrayerTimeItem[];
  notifications: AllNotificationsConfig;
  onUpdateNotification: (key: PrayerKey, config: Partial<AllNotificationsConfig[PrayerKey]>) => void;
  onUpdateAllNotifications: (config: AllNotificationsConfig) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  prayers,
  notifications,
  onUpdateNotification,
  onUpdateAllNotifications,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      setPermissionFeedback('Permesso concesso! Riceverai gli avvisi sul browser.');
    } else {
      setPermissionFeedback('Notifiche non autorizzate o bloccate nelle impostazioni del browser.');
    }
    setTimeout(() => setPermissionFeedback(null), 4000);
  };

  const offsetOptions = [
    { label: 'All\'orario esatto (0 min)', value: 0 },
    { label: '5 minuti prima', value: 5 },
    { label: '10 minuti prima', value: 10 },
    { label: '15 minuti prima', value: 15 },
    { label: '20 minuti prima', value: 20 },
    { label: '30 minuti prima', value: 30 },
    { label: '45 minuti prima', value: 45 },
    { label: '60 minuti prima (1 ora)', value: 60 },
  ];

  const soundOptions: Array<{ label: string; value: AllNotificationsConfig[PrayerKey]['sound'] }> = [
    { label: 'Adhan Melodico', value: 'adhan' },
    { label: 'Takbeer Resonante', value: 'takbeer' },
    { label: 'Tono Risveglio Dolce (Tahajjud)', value: 'dawn_tone' },
    { label: 'Campana Chime', value: 'bell' },
    { label: 'Silenzioso (Solo Notifica Visiva)', value: 'silent' },
  ];

  // Quick preset: activate all 5 prayers + Tahajjud
  const handleEnableRecommended = () => {
    const updated: AllNotificationsConfig = {
      ...notifications,
      fajr: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
      dhuhr: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
      asr: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
      maghrib: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
      isha: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
      tahajjud: { enabled: true, offsetMinutes: 30, sound: 'dawn_tone' },
      lastThird: { enabled: true, offsetMinutes: 15, sound: 'dawn_tone' },
      imsak: { enabled: true, offsetMinutes: 10, sound: 'dawn_tone' },
    };
    onUpdateAllNotifications(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-900 dark:text-white overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Notifiche & Avvisi Personalizzati</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Imposta promemoria anticipati e suoni per ogni momento
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
          {/* Permission Status Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span>Stato Notifiche Browser:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    permission === 'granted'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : permission === 'denied'
                      ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {permission === 'granted'
                    ? 'Abilitate'
                    : permission === 'denied'
                    ? 'Bloccate'
                    : 'Non ancora attivate'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                L'applicazione genera anche suoni audio sintetizzati Web Audio.
              </p>
              {permissionFeedback && (
                <div className="text-xs text-emerald-700 dark:text-emerald-400 pt-1 font-medium">{permissionFeedback}</div>
              )}
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                Abilita Notifiche Web
              </button>
            )}
          </div>

          {/* Quick Presets Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Attivazione Rapida: 5 Preghiere + Sveglia Tahajjud</span>
            </div>
            <button
              onClick={handleEnableRecommended}
              className="px-3 py-1.5 font-semibold text-xs text-indigo-900 dark:text-indigo-200 bg-white dark:bg-indigo-900/70 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg border border-indigo-200 dark:border-transparent transition-colors cursor-pointer"
            >
              Applica Configurazione Ideale
            </button>
          </div>

          {/* List of Prayer Notifications */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Impostazioni per ciascun momento
            </div>

            {prayers.map((prayer) => {
              const cfg = notifications[prayer.key] || {
                enabled: false,
                offsetMinutes: 0,
                sound: 'adhan',
              };

              return (
                <div
                  key={prayer.key}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    cfg.enabled
                      ? prayer.isNightMoment
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60'
                        : 'bg-white dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900 opacity-70'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Title & Toggle */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`toggle-${prayer.key}`}
                        checked={cfg.enabled}
                        onChange={(e) =>
                          onUpdateNotification(prayer.key, { enabled: e.target.checked })
                        }
                        className="w-4 h-4 text-emerald-600 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`toggle-${prayer.key}`}
                        className="cursor-pointer select-none"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {prayer.name}
                          </span>
                          <span className="text-xs font-serif text-slate-500 dark:text-slate-400">
                            {prayer.arabicName}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 ml-2">
                            {prayer.timeString}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{prayer.description}</div>
                      </label>
                    </div>

                    {/* Controls (Offset & Sound) */}
                    {cfg.enabled && (
                      <div className="flex flex-wrap items-center gap-2 pl-7 lg:pl-0">
                        {/* Offset Selector */}
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] text-slate-500 dark:text-slate-400">Quando:</label>
                          <select
                            value={cfg.offsetMinutes}
                            onChange={(e) =>
                              onUpdateNotification(prayer.key, {
                                offsetMinutes: parseInt(e.target.value, 10),
                              })
                            }
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                          >
                            {offsetOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sound Selector */}
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] text-slate-500 dark:text-slate-400">Suono:</label>
                          <select
                            value={cfg.sound}
                            onChange={(e) =>
                              onUpdateNotification(prayer.key, {
                                sound: e.target.value as AllNotificationsConfig[PrayerKey]['sound'],
                              })
                            }
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                          >
                            {soundOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {/* Sound test button */}
                          <button
                            type="button"
                            onClick={() => playPrayerSound(cfg.sound)}
                            title="Ascolta anteprima"
                            className="p-1.5 text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
          >
            Salva & Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
