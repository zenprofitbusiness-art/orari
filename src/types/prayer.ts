export type PrayerKey = 
  | 'imsak'
  | 'fajr'
  | 'sunrise'
  | 'duha'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'midnight'
  | 'lastThird'
  | 'tahajjud';

export interface PrayerTimeItem {
  key: PrayerKey;
  name: string;
  arabicName: string;
  time: Date;
  timeString: string; // HH:mm
  endTime?: Date;
  endTimeString?: string; // HH:mm
  description: string;
  isNightMoment?: boolean;
  isOptional?: boolean;
}

export interface NightCalculation {
  maghribToday: Date;
  fajrTomorrow: Date;
  nightDurationMinutes: number;
  firstThirdEnd: Date;
  midnight: Date; // Nisf al-Layl
  lastThirdStart: Date; // Thuluth al-Layl al-Akhir
  tahajjudRecommendedStart: Date;
  tahajjudRecommendedEnd: Date;
  currentNightPhase: 'day' | 'first_third' | 'second_third' | 'last_third';
  nightProgressPercent: number; // 0 to 100%
  minutesUntilLastThird: number;
  isInLastThird: boolean;
}

export interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation?: number;
  isAutoGps?: boolean;
  aliases?: string[];
}

export interface CalculationSettings {
  method: 'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Diyanet' | 'Tehran' | 'UOIF';
  asrMethod: 'Standard' | 'Hanafi';
  highLatitudeRule: 'MiddleOfTheNight' | 'SeventhOfTheNight' | 'TwilightAngle';
  manualOffsets: Record<PrayerKey, number>; // in minutes (+/-)
}

export interface PrayerNotificationConfig {
  enabled: boolean;
  offsetMinutes: number; // 0 = at time, 10 = 10 min before, 15 = 15 min before, 30 = 30 min before
  sound: 'adhan' | 'takbeer' | 'dawn_tone' | 'bell' | 'silent';
}

export type AllNotificationsConfig = Record<PrayerKey, PrayerNotificationConfig>;
