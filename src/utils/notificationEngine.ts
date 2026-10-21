import { AllNotificationsConfig, PrayerKey, PrayerTimeItem } from '../types/prayer';
import { playPrayerSound } from './soundEngine';

export const DEFAULT_NOTIFICATIONS: AllNotificationsConfig = {
  imsak: { enabled: true, offsetMinutes: 10, sound: 'dawn_tone' },
  fajr: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
  sunrise: { enabled: false, offsetMinutes: 0, sound: 'bell' },
  duha: { enabled: false, offsetMinutes: 0, sound: 'bell' },
  dhuhr: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
  asr: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
  maghrib: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
  isha: { enabled: true, offsetMinutes: 0, sound: 'adhan' },
  midnight: { enabled: false, offsetMinutes: 0, sound: 'bell' },
  lastThird: { enabled: true, offsetMinutes: 15, sound: 'dawn_tone' },
  tahajjud: { enabled: true, offsetMinutes: 30, sound: 'dawn_tone' },
};

const STORAGE_KEY = 'al_mawaqit_notifications_v1';

export const loadNotificationsConfig = (): AllNotificationsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIFICATIONS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading notification settings:', e);
  }
  return DEFAULT_NOTIFICATIONS;
};

export const saveNotificationsConfig = (config: AllNotificationsConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
};

/**
 * Check if browser supports notifications
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current permission state
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request permission from user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
};

/**
 * Trigger an instant prayer alert (Web Notification + Audio Sound)
 */
export const triggerPrayerAlert = (prayer: PrayerTimeItem, config: AllNotificationsConfig[PrayerKey], isPreReminder = false) => {
  const title = isPreReminder
    ? `Promemoria: ${prayer.name} tra ${config.offsetMinutes} min`
    : `È giunto il momento: ${prayer.name} (${prayer.arabicName})`;

  const body = isPreReminder
    ? `Il momento per ${prayer.name} inizierà alle ${prayer.timeString}. Preparati per la preghiera.`
    : `${prayer.description} - Orario: ${prayer.timeString}`;

  // Play synthesized audio
  if (config.sound && config.sound !== 'silent') {
    playPrayerSound(config.sound);
  }

  // Display Web Notification if permitted
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `prayer-${prayer.key}-${Date.now()}`,
      });
    } catch (e) {
      console.warn('Could not spawn web notification:', e);
    }
  }
};
