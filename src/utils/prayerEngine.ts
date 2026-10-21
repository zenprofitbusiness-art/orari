import {
  CalculationSettings,
  LocationData,
  NightCalculation,
  PrayerKey,
  PrayerTimeItem,
} from '../types/prayer';

// Degrees to Radians and vice versa
const d2r = (d: number) => (d * Math.PI) / 180.0;
const r2d = (r: number) => (r * 180.0) / Math.PI;

// Trigonometric helpers with degrees
const sinDeg = (deg: number) => Math.sin(d2r(deg));
const cosDeg = (deg: number) => Math.cos(d2r(deg));
const tanDeg = (deg: number) => Math.tan(d2r(deg));
const asinDeg = (val: number) => r2d(Math.asin(val));
const acosDeg = (val: number) => r2d(Math.acos(val));
const atan2Deg = (y: number, x: number) => r2d(Math.atan2(y, x));

// Normalize angle between 0 and 360
const fixAngle = (a: number) => {
  let res = a - 360.0 * Math.floor(a / 360.0);
  return res < 0 ? res + 360.0 : res;
};

// Normalize hours between 0 and 24
const fixHour = (h: number) => {
  let res = h - 24.0 * Math.floor(h / 24.0);
  return res < 0 ? res + 24.0 : res;
};

// Julian Date calculation
const getJulianDate = (year: number, month: number, day: number): number => {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5
  );
};

// Sun position: Declination (dec) & Equation of Time (EqT in hours)
const getSunPosition = (jd: number) => {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sinDeg(g) + 0.02 * sinDeg(2 * g));
  const e = 23.439 - 0.00000036 * D;

  const RA = fixHour(atan2Deg(cosDeg(e) * sinDeg(L), cosDeg(L)) / 15.0);
  const dec = asinDeg(sinDeg(e) * sinDeg(L));
  const EqT = q / 15.0 - RA;

  return { dec, EqT };
};

// Compute solar transit (noon) and hour angle for an elevation angle
const computeTimesForDate = (
  date: Date,
  lat: number,
  lng: number,
  settings: CalculationSettings
) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = getJulianDate(year, month, day);
  const { dec, EqT } = getSunPosition(jd);

  // Timezone offset in hours
  // Date.prototype.getTimezoneOffset() returns minutes to add to local time to get UTC.
  // So local offset in hours is -getTimezoneOffset() / 60
  const tzOffset = -date.getTimezoneOffset() / 60;

  // Midday (Dhuhr) in fractional hours
  const noon = fixHour(12 + tzOffset - lng / 15.0 - EqT);

  // Helper for Sun elevation angle:
  // cos(H) = (sin(angle) - sin(lat)*sin(dec)) / (cos(lat)*cos(dec))
  const getHourAngle = (angle: number): number | null => {
    const cosH = (sinDeg(angle) - sinDeg(lat) * sinDeg(dec)) / (cosDeg(lat) * cosDeg(dec));
    if (cosH > 1.0 || cosH < -1.0) {
      return null; // Sun never reaches this angle (polar night / midnight sun)
    }
    return acosDeg(cosH) / 15.0; // in hours
  };

  // Sunrise and Sunset (standard depression: 0.833 degrees for atmospheric refraction)
  const sunriseAngle = -0.833;
  let sunH = getHourAngle(sunriseAngle);
  if (sunH === null) sunH = 6; // fallback for extreme latitudes

  const sunrise = noon - sunH;
  const sunset = noon + sunH;

  // Asr shadow angle (Sun elevation angle is positive, above the horizon)
  const shadowFactor = settings.asrMethod === 'Hanafi' ? 2 : 1;
  const asrAngle = r2d(Math.atan(1 / (shadowFactor + tanDeg(Math.abs(lat - dec)))));
  let asrH = getHourAngle(asrAngle);
  if (asrH === null) asrH = sunH * 0.6;
  const asr = noon + asrH;

  // Fajr angle
  let fajrAngle = 18.0; // Default Muslim World League (Lega Islamica Mondiale)
  if (settings.method === 'ISNA') fajrAngle = 15.0;
  else if (settings.method === 'Egypt') fajrAngle = 19.5;
  else if (settings.method === 'Makkah') fajrAngle = 18.5;
  else if (settings.method === 'Diyanet') fajrAngle = 18.0;
  else if (settings.method === 'UOIF') fajrAngle = 12.0;

  let fajrH = getHourAngle(-fajrAngle);
  // High latitude adjustment fallback if null
  if (fajrH === null) {
    if (settings.highLatitudeRule === 'SeventhOfTheNight') {
      fajrH = sunH + (24 - 2 * sunH) / 7;
    } else {
      fajrH = sunH + (24 - 2 * sunH) / 4;
    }
  }
  const fajr = noon - fajrH;

  // Isha angle
  let isha: number;
  if (settings.method === 'Makkah') {
    // 90 minutes after Maghrib
    isha = sunset + 1.5;
  } else {
    let ishaAngle = 17.0; // Default MWL
    if (settings.method === 'ISNA') ishaAngle = 15.0;
    else if (settings.method === 'Egypt') ishaAngle = 17.5;
    else if (settings.method === 'Diyanet') ishaAngle = 17.0;
    else if (settings.method === 'UOIF') ishaAngle = 12.0;

    let ishaH = getHourAngle(-ishaAngle);
    if (ishaH === null) {
      if (settings.highLatitudeRule === 'SeventhOfTheNight') {
        ishaH = sunH + (24 - 2 * sunH) / 7;
      } else {
        ishaH = sunH + (24 - 2 * sunH) / 4;
      }
    }
    isha = noon + ishaH;
  }

  // Convert fractional hour to precise local Date
  const makeDate = (hourFraction: number, baseDate: Date): Date => {
    const d = new Date(baseDate);
    const normalizedH = fixHour(hourFraction);
    const hours = Math.floor(normalizedH);
    const minsFraction = (normalizedH - hours) * 60;
    const mins = Math.floor(minsFraction);
    const secs = Math.floor((minsFraction - mins) * 60);
    d.setHours(hours, mins, secs, 0);
    return d;
  };

  const fajrDate = makeDate(fajr, date);
  const sunriseDate = makeDate(sunrise, date);
  const dhuhrDate = makeDate(noon + 2 / 60, date); // +2 min after true noon (Zawāl buffer)
  const asrDate = makeDate(asr, date);
  const maghribDate = makeDate(sunset, date);
  const ishaDate = makeDate(isha, date);

  // Additional times
  // Imsak: 10 minutes before Fajr
  const imsakDate = new Date(fajrDate.getTime() - 10 * 60 * 1000);
  // Duha: 20 minutes after Sunrise
  const duhaDate = new Date(sunriseDate.getTime() + 20 * 60 * 1000);

  return {
    fajr: fajrDate,
    sunrise: sunriseDate,
    duha: duhaDate,
    dhuhr: dhuhrDate,
    asr: asrDate,
    maghrib: maghribDate,
    isha: ishaDate,
    imsak: imsakDate,
  };
};

/**
 * Calculate full prayer list and complete night segmentation (Midnight, Last Third, Tahajjud)
 */
export const calculateAllPrayerTimes = (
  currentDate: Date,
  location: LocationData,
  settings: CalculationSettings
): {
  prayers: PrayerTimeItem[];
  night: NightCalculation;
  rawTimes: Record<PrayerKey, Date>;
} => {
  const { latitude, longitude } = location;

  // Calculate today's times
  const todayTimes = computeTimesForDate(currentDate, latitude, longitude, settings);

  // Calculate yesterday's times
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTimes = computeTimesForDate(yesterday, latitude, longitude, settings);

  // Calculate tomorrow's times
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = computeTimesForDate(tomorrow, latitude, longitude, settings);

  // Apply manual offsets if any
  const applyOffset = (date: Date, key: PrayerKey): Date => {
    const offset = settings.manualOffsets[key] || 0;
    return new Date(date.getTime() + offset * 60 * 1000);
  };

  const fajr = applyOffset(todayTimes.fajr, 'fajr');
  const sunrise = applyOffset(todayTimes.sunrise, 'sunrise');
  const duha = applyOffset(todayTimes.duha, 'duha');
  const dhuhr = applyOffset(todayTimes.dhuhr, 'dhuhr');
  const asr = applyOffset(todayTimes.asr, 'asr');
  const maghrib = applyOffset(todayTimes.maghrib, 'maghrib');
  const isha = applyOffset(todayTimes.isha, 'isha');
  const imsak = applyOffset(todayTimes.imsak, 'imsak');

  // --- NIGHT & TAHAJJUD CALCULATION ---
  // In Islamic Law: The night starts at Maghrib and ends at next morning's Fajr.
  // If current time is before today's Fajr (e.g. 03:00 AM), we are currently in the night
  // that started yesterday at Maghrib and ends at today's Fajr!
  // If current time is after today's Fajr, the relevant night for tonight starts at today's Maghrib and ends at tomorrow's Fajr.
  const nowMs = currentDate.getTime();
  let nightMaghrib: Date;
  let nightFajr: Date;

  if (nowMs < fajr.getTime()) {
    // Current moment is between 00:00 and Fajr -> active night is Yesterday Maghrib to Today Fajr
    nightMaghrib = applyOffset(yesterdayTimes.maghrib, 'maghrib');
    nightFajr = fajr;
  } else {
    // Current moment is after Fajr -> active/upcoming night is Today Maghrib to Tomorrow Fajr
    nightMaghrib = maghrib;
    nightFajr = applyOffset(tomorrowTimes.fajr, 'fajr');
  }

  const nightDurationMs = nightFajr.getTime() - nightMaghrib.getTime();
  const nightDurationMinutes = Math.round(nightDurationMs / (60 * 1000));

  // Islamic Midnight (Nisf al-Layl) = Maghrib + 1/2 of night duration
  const midnightMs = nightMaghrib.getTime() + nightDurationMs * 0.5;
  const midnight = applyOffset(new Date(midnightMs), 'midnight');

  // First third of night ends = Maghrib + 1/3 of night
  const firstThirdEndMs = nightMaghrib.getTime() + nightDurationMs * (1 / 3);
  const firstThirdEnd = new Date(firstThirdEndMs);

  // Last third of night starts (Thuluth al-Layl al-Akhir) = Maghrib + 2/3 of night (or Fajr - 1/3)
  const lastThirdStartMs = nightMaghrib.getTime() + nightDurationMs * (2 / 3);
  const lastThirdStart = applyOffset(new Date(lastThirdStartMs), 'lastThird');

  // Tahajjud:
  // Highly recommended in the Last Third of the Night (from lastThirdStart until Fajr)
  const tahajjudRecommendedStart = lastThirdStart;
  const tahajjudRecommendedEnd = nightFajr;
  const tahajjud = applyOffset(new Date(lastThirdStartMs), 'tahajjud');

  // Current night phase
  let currentNightPhase: 'day' | 'first_third' | 'second_third' | 'last_third' = 'day';
  let isInLastThird = false;
  let nightProgressPercent = 0;

  if (nowMs >= nightMaghrib.getTime() && nowMs < nightFajr.getTime()) {
    const elapsed = nowMs - nightMaghrib.getTime();
    nightProgressPercent = Math.min(100, Math.max(0, Math.round((elapsed / nightDurationMs) * 100)));

    if (nowMs < firstThirdEndMs) {
      currentNightPhase = 'first_third';
    } else if (nowMs < lastThirdStartMs) {
      currentNightPhase = 'second_third';
    } else {
      currentNightPhase = 'last_third';
      isInLastThird = true;
    }
  } else {
    currentNightPhase = 'day';
    // If during daytime, calculate how much until the next night's last third
    isInLastThird = false;
  }

  // Minutes until last third
  const minutesUntilLastThird = Math.round((lastThirdStart.getTime() - nowMs) / (60 * 1000));

  const night: NightCalculation = {
    maghribToday: nightMaghrib,
    fajrTomorrow: nightFajr,
    nightDurationMinutes,
    firstThirdEnd,
    midnight,
    lastThirdStart,
    tahajjudRecommendedStart,
    tahajjudRecommendedEnd,
    currentNightPhase,
    nightProgressPercent,
    minutesUntilLastThird,
    isInLastThird,
  };

  const formatHHMM = (d: Date): string => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const rawTimes: Record<PrayerKey, Date> = {
    imsak,
    fajr,
    sunrise,
    duha,
    dhuhr,
    asr,
    maghrib,
    isha,
    midnight,
    lastThird: lastThirdStart,
    tahajjud,
  };

  const prayers: PrayerTimeItem[] = [
    {
      key: 'imsak',
      name: 'Imsak (Digiuno)',
      arabicName: 'الإمساك',
      time: imsak,
      timeString: formatHHMM(imsak),
      endTime: fajr,
      endTimeString: formatHHMM(fajr),
      description: 'Termine ultimo raccomandato per il Suhoor prima dell\'alba',
      isOptional: true,
    },
    {
      key: 'fajr',
      name: 'Fajr (Alba)',
      arabicName: 'الفجر',
      time: fajr,
      timeString: formatHHMM(fajr),
      endTime: sunrise,
      endTimeString: formatHHMM(sunrise),
      description: 'Prima preghiera obbligatoria, inizio del digiuno',
    },
    {
      key: 'sunrise',
      name: 'Shuruq (Sorgere del Sole)',
      arabicName: 'الشروق',
      time: sunrise,
      timeString: formatHHMM(sunrise),
      endTime: duha,
      endTimeString: formatHHMM(duha),
      description: 'Fine del tempo del Fajr; preghiere sconsigliate fino a Duha',
      isOptional: true,
    },
    {
      key: 'duha',
      name: 'Duha (Mattino)',
      arabicName: 'الضحى',
      time: duha,
      timeString: formatHHMM(duha),
      endTime: dhuhr,
      endTimeString: formatHHMM(dhuhr),
      description: 'Preghiera volontaria molto benedetta del mattino',
      isOptional: true,
    },
    {
      key: 'dhuhr',
      name: 'Dhuhr (Mezzogiorno)',
      arabicName: 'الظهر',
      time: dhuhr,
      timeString: formatHHMM(dhuhr),
      endTime: asr,
      endTimeString: formatHHMM(asr),
      description: 'Seconda preghiera obbligatoria, subito dopo il mezzogiorno solare',
    },
    {
      key: 'asr',
      name: 'Asr (Pomeriggio)',
      arabicName: 'العصر',
      time: asr,
      timeString: formatHHMM(asr),
      endTime: maghrib,
      endTimeString: formatHHMM(maghrib),
      description: 'Terza preghiera obbligatoria (Salat al-Wusta)',
    },
    {
      key: 'maghrib',
      name: 'Maghrib (Tramonto)',
      arabicName: 'المغرب',
      time: maghrib,
      timeString: formatHHMM(maghrib),
      endTime: isha,
      endTimeString: formatHHMM(isha),
      description: 'Quarta preghiera obbligatoria, rottura del digiuno (Iftar)',
    },
    {
      key: 'isha',
      name: 'Isha (Notte)',
      arabicName: 'العشاء',
      time: isha,
      timeString: formatHHMM(isha),
      endTime: midnight,
      endTimeString: formatHHMM(midnight),
      description: 'Quinta preghiera obbligatoria, oscurità notturna',
    },
    {
      key: 'midnight',
      name: 'Metà della Notte (Nisf al-Layl)',
      arabicName: 'نصف الليل',
      time: midnight,
      timeString: formatHHMM(midnight),
      endTime: lastThirdStart,
      endTimeString: formatHHMM(lastThirdStart),
      description: 'Punto medio tra Maghrib e Fajr, termine preferenziale per Isha',
      isNightMoment: true,
      isOptional: true,
    },
    {
      key: 'lastThird',
      name: 'Ultimo Terzo della Notte',
      arabicName: 'ثلث الليل الآخر',
      time: lastThirdStart,
      timeString: formatHHMM(lastThirdStart),
      endTime: nightFajr,
      endTimeString: formatHHMM(nightFajr),
      description: 'Inizio del momento più benedetto in cui le suppliche sono accolte',
      isNightMoment: true,
    },
    {
      key: 'tahajjud',
      name: 'Tahajjud (Qiyam al-Layl)',
      arabicName: 'التهجد',
      time: tahajjud,
      timeString: formatHHMM(tahajjud),
      endTime: nightFajr,
      endTimeString: formatHHMM(nightFajr),
      description: 'Preghiera notturna volontaria di massimo grado spirituale',
      isNightMoment: true,
    },
  ];

  return { prayers, night, rawTimes };
};

/**
 * Calculates Qibla direction (bearing in degrees from true North) and distance in km
 */
export const calculateQibla = (lat: number, lng: number) => {
  const meccaLat = 21.422487;
  const meccaLng = 39.826206;

  const φ1 = d2r(lat);
  const φ2 = d2r(meccaLat);
  const Δλ = d2r(meccaLng - lng);

  const y = Math.sin(Δλ);
  const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  let qiblaBearing = atan2Deg(y, x);
  qiblaBearing = fixAngle(qiblaBearing);

  // Distance in km using Haversine
  const R = 6371; // Earth radius in km
  const Δφ = d2r(meccaLat - lat);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  return {
    bearing: Math.round(qiblaBearing * 10) / 10,
    distanceKm,
  };
};

export interface HijriDateResult {
  day: number;
  monthIndex: number;
  monthName: string;
  arabicMonth: string;
  year: number;
  holiday?: IslamicHolidayInfo;
}

/**
 * Approximate conversion from Gregorian to Islamic (Hijri) calendar with holiday detection
 */
export const getHijriDate = (date: Date): HijriDateResult => {
  // KUWAITI / Standard tabular algorithm for smooth local rendering
  const jd = getJulianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  let l = Math.floor(jd) - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  const hijriMonths = [
    { it: 'Muharram', ar: 'محرم' },
    { it: 'Safar', ar: 'صفر' },
    { it: 'Rabi al-Awwal', ar: 'ربيع الأول' },
    { it: 'Rabi al-Thani', ar: 'ربيع الثاني' },
    { it: 'Jumada al-Ula', ar: 'جمادى الأولى' },
    { it: 'Jumada al-Akhirah', ar: 'جمادى الآخرة' },
    { it: 'Rajab', ar: 'رجب' },
    { it: 'Sha\'ban', ar: 'شعبان' },
    { it: 'Ramadan', ar: 'رمضان' },
    { it: 'Shawwal', ar: 'شوال' },
    { it: 'Dhu al-Qi\'dah', ar: 'ذو القعدة' },
    { it: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
  ];

  const monthIndex = Math.max(1, Math.min(12, month));
  const mIndex = monthIndex - 1;

  const holiday = getIslamicHoliday(monthIndex, day);

  return {
    day: day,
    monthIndex: monthIndex,
    monthName: HIJRI_MONTHS[mIndex].it,
    arabicMonth: HIJRI_MONTHS[mIndex].ar,
    year: year,
    holiday: holiday,
  };
};

export interface HijriMonthInfo {
  index: number;
  it: string;
  ar: string;
}

export const HIJRI_MONTHS: HijriMonthInfo[] = [
  { index: 1, it: 'Muharram', ar: 'محرم' },
  { index: 2, it: 'Safar', ar: 'صفر' },
  { index: 3, it: 'Rabi\' al-Awwal', ar: 'ربيع الأول' },
  { index: 4, it: 'Rabi\' al-Thani', ar: 'ربيع الثاني' },
  { index: 5, it: 'Jumada al-Ula', ar: 'جمادى الأولى' },
  { index: 6, it: 'Jumada al-Akhirah', ar: 'جمادى الآخرة' },
  { index: 7, it: 'Rajab', ar: 'رجب' },
  { index: 8, it: 'Sha\'ban', ar: 'شعبان' },
  { index: 9, it: 'Ramadan', ar: 'رمضان' },
  { index: 10, it: 'Shawwal', ar: 'شوال' },
  { index: 11, it: 'Dhu al-Qi\'dah', ar: 'ذو القعدة' },
  { index: 12, it: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
];

/**
 * Returns all consecutive days (1 to 29 or 30) for a given Islamic Lunar Month
 * with their corresponding exact Gregorian dates and detected religious holidays.
 */
export const getHijriMonthDays = (targetYear: number, targetMonthIndex: number) => {
  const approxGYear = Math.round(targetYear * 0.970224 + 621.57);
  const approxGMonth = Math.round((targetMonthIndex - 1) * 0.984);
  const d = new Date(approxGYear, approxGMonth, 1, 12, 0, 0);

  let h = getHijriDate(d);
  const diffMonths = (targetYear - h.year) * 12 + (targetMonthIndex - h.monthIndex);
  d.setDate(d.getDate() + Math.round(diffMonths * 29.5));

  // Fine tune to exact day 1 of targetYear & targetMonthIndex
  let iterations = 0;
  while (iterations < 60) {
    h = getHijriDate(d);
    if (h.year === targetYear && h.monthIndex === targetMonthIndex && h.day === 1) break;
    if (h.year < targetYear || (h.year === targetYear && h.monthIndex < targetMonthIndex)) {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() - 1);
    }
    iterations++;
  }

  // Collect all days from 1 to 29 or 30
  const days: { hijriDay: number; date: Date; holiday?: IslamicHolidayInfo }[] = [];
  while (true) {
    h = getHijriDate(d);
    if (h.year !== targetYear || h.monthIndex !== targetMonthIndex) break;
    days.push({
      hijriDay: h.day,
      date: new Date(d),
      holiday: h.holiday,
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
};

export interface IslamicHolidayInfo {
  name: string;
  arabicName: string;
  shortTag: string;
  description: string;
  isMajor: boolean;
  category: 'eid' | 'ramadan' | 'sacred' | 'fast' | 'event';
}

/**
 * Returns any canonical Islamic holiday or religious observance for a given Hijri month (1-12) and day (1-30)
 */
export const getIslamicHoliday = (
  month: number,
  day: number
): IslamicHolidayInfo | undefined => {
  // 1. Muharram
  if (month === 1) {
    if (day === 1) {
      return {
        name: 'Capodanno Islamico',
        arabicName: 'رأس السنة الهجرية',
        shortTag: 'Capodanno Hijri',
        description: 'Inizio del nuovo anno nel calendario lunare islamico.',
        isMajor: true,
        category: 'sacred',
      };
    }
    if (day === 9) {
      return {
        name: 'Giorno di Tasu\'a',
        arabicName: 'تاسوعاء',
        shortTag: 'Tasu\'a',
        description: 'Vigilia di Ashura, giorno di digiuno raccomandato (Sunnah).',
        isMajor: false,
        category: 'fast',
      };
    }
    if (day === 10) {
      return {
        name: 'Giorno di Ashura',
        arabicName: 'يوم عاشوراء',
        shortTag: 'Ashura',
        description: 'Giorno sacro in cui Mosè fu salvato. Il digiuno espia i peccati dell\'anno precedente.',
        isMajor: true,
        category: 'fast',
      };
    }
  }

  // 3. Rabi' al-Awwal
  if (month === 3 && day === 12) {
    return {
      name: 'Mawlid an-Nabi',
      arabicName: 'المولد النبوي الشريف',
      shortTag: 'Mawlid',
      description: 'Nascita benedetta del Profeta Muhammad ﷺ.',
      isMajor: true,
      category: 'event',
    };
  }

  // 7. Rajab (Mese Sacro)
  if (month === 7 && day === 27) {
    return {
      name: 'Isra e Mi\'raj',
      arabicName: 'الإسراء والمعراج',
      shortTag: 'Isra & Mi\'raj',
      description: 'Il Viaggio Notturno da Mecca a Gerusalemme e l\'Ascensione nei Cieli.',
      isMajor: true,
      category: 'event',
    };
  }

  // 8. Sha'ban
  if (month === 8 && day === 15) {
    return {
      name: 'Metà Sha\'ban (Laylat al-Bara\'at)',
      arabicName: 'ليلة النصف من شعبان',
      shortTag: 'Nisf Sha\'ban',
      description: 'Notte di misericordia, preghiera notturna e perdono divino.',
      isMajor: false,
      category: 'event',
    };
  }

  // 9. Ramadan
  if (month === 9) {
    if (day === 1) {
      return {
        name: '1° Giorno di Ramadan',
        arabicName: 'أول أيام رمضان',
        shortTag: 'Inizio Ramadan',
        description: 'Inizio del mese sacro di digiuno, Corano e purificazione.',
        isMajor: true,
        category: 'ramadan',
      };
    }
    if (day === 17) {
      return {
        name: 'Battaglia di Badr',
        arabicName: 'غزوة بدر الكبرى',
        shortTag: 'Badr',
        description: 'Anniversario della decisiva vittoria di Badr.',
        isMajor: false,
        category: 'ramadan',
      };
    }
    if (day === 27) {
      return {
        name: 'Laylat al-Qadr (Notte del Destino)',
        arabicName: 'ليلة القدر المباركة',
        shortTag: 'Laylat al-Qadr',
        description: 'La Notte del Destino, migliore di mille mesi. Rivelazione del Santo Corano.',
        isMajor: true,
        category: 'ramadan',
      };
    }
    if ([21, 23, 25, 29].includes(day)) {
      return {
        name: `Notte Dispari del Ramadan (${day})`,
        arabicName: `ليلة ${day} رمضان`,
        shortTag: `Notte ${day}`,
        description: 'Una delle notti benedette in cui cercare Laylat al-Qadr.',
        isMajor: false,
        category: 'ramadan',
      };
    }
  }

  // 10. Shawwal
  if (month === 10) {
    if (day === 1) {
      return {
        name: 'Eid al-Fitr (Festa di Fine Digiuno)',
        arabicName: 'عيد الفطر المبارك',
        shortTag: 'Eid al-Fitr',
        description: 'Grande celebrazione islamica per il completamento del digiuno di Ramadan.',
        isMajor: true,
        category: 'eid',
      };
    }
    if (day === 2) {
      return {
        name: '2° Giorno di Eid al-Fitr',
        arabicName: 'ثاني أيام عيد الفطر',
        shortTag: '2° Eid al-Fitr',
        description: 'Secondo giorno della festa di Eid al-Fitr.',
        isMajor: true,
        category: 'eid',
      };
    }
    if (day === 3) {
      return {
        name: '3° Giorno di Eid al-Fitr',
        arabicName: 'ثالث أيام عيد الفطر',
        shortTag: '3° Eid al-Fitr',
        description: 'Terzo giorno della festa di Eid al-Fitr.',
        isMajor: false,
        category: 'eid',
      };
    }
  }

  // 12. Dhu al-Hijjah
  if (month === 12) {
    if (day === 8) {
      return {
        name: 'Giorno di Tarwiyah',
        arabicName: 'يوم التروية',
        shortTag: 'Tarwiyah (Hajj)',
        description: 'Inizio dei riti del Grande Pellegrinaggio (Hajj) a Mina.',
        isMajor: false,
        category: 'sacred',
      };
    }
    if (day === 9) {
      return {
        name: 'Giorno di Arafah',
        arabicName: 'يوم عرفة',
        shortTag: 'Giorno Arafah',
        description: 'Il giorno più sacro dell\'anno. Il digiuno cancella i peccati di due anni.',
        isMajor: true,
        category: 'fast',
      };
    }
    if (day === 10) {
      return {
        name: 'Eid al-Adha (Festa del Sacrificio)',
        arabicName: 'عيد الأضحى المبارك',
        shortTag: 'Eid al-Adha',
        description: 'La grande festa del sacrificio che commemora la fede di Abramo (Ibrahim).',
        isMajor: true,
        category: 'eid',
      };
    }
    if ([11, 12, 13].includes(day)) {
      return {
        name: `Giorni di Tashriq (${day - 10}° giorno)`,
        arabicName: 'أيام التشريق',
        shortTag: 'Tashriq',
        description: 'Giorni di gioia, preghiera e festa dopo il giorno di Eid al-Adha.',
        isMajor: false,
        category: 'sacred',
      };
    }
  }

  // Monthly White Days (Ayyam al-Bid) - fasting on the full moon days (13, 14, 15)
  // Except on Tashriq in Dhul-Hijjah or during Ramadan where whole month is fasting
  if ([13, 14, 15].includes(day) && month !== 9 && !(month === 12 && [11, 12, 13].includes(day))) {
    return {
      name: `Giorni Bianchi (Ayyam al-Bid - Giorno ${day})`,
      arabicName: 'أيام البيض',
      shortTag: 'Giorni Bianchi',
      description: 'I giorni di luna piena in cui è raccomandato il digiuno volontario (Sunnah).',
      isMajor: false,
      category: 'fast',
    };
  }

  return undefined;
};

/**
 * Curated list of popular cities (Italy focus + key Islamic & international cities)
 */
export const POPULAR_CITIES: LocationData[] = [
  // Italian cities
  { city: 'Udine', country: 'Italia (Friuli-Venezia Giulia)', latitude: 46.0626, longitude: 13.2346, timezone: 'Europe/Rome', aliases: ['udine', 'friuli', 'fvg', 'capoluogo friuli'] },
  { city: 'Martignacco', country: 'Italia (Udine, Friuli)', latitude: 46.0986, longitude: 13.1417, timezone: 'Europe/Rome', aliases: ['martingacco', 'martignacco', 'citta fiera', 'udine ovest', 'friuli', 'fvg'] },
  { city: 'Roma', country: 'Italia', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome', aliases: ['roma', 'lazio', 'capitale'] },
  { city: 'Milano', country: 'Italia', latitude: 45.4642, longitude: 9.19, timezone: 'Europe/Rome', aliases: ['milano', 'lombardia'] },
  { city: 'Napoli', country: 'Italia', latitude: 40.8518, longitude: 14.2681, timezone: 'Europe/Rome', aliases: ['napoli', 'campania'] },
  { city: 'Torino', country: 'Italia', latitude: 45.0703, longitude: 7.6869, timezone: 'Europe/Rome', aliases: ['torino', 'piemonte'] },
  { city: 'Palermo', country: 'Italia', latitude: 38.1157, longitude: 13.3615, timezone: 'Europe/Rome', aliases: ['palermo', 'sicilia'] },
  { city: 'Bologna', country: 'Italia', latitude: 44.4949, longitude: 11.3426, timezone: 'Europe/Rome', aliases: ['bologna', 'emilia'] },
  { city: 'Firenze', country: 'Italia', latitude: 43.7696, longitude: 11.2558, timezone: 'Europe/Rome', aliases: ['firenze', 'toscana'] },
  { city: 'Trieste', country: 'Italia (Friuli-Venezia Giulia)', latitude: 45.6495, longitude: 13.7768, timezone: 'Europe/Rome', aliases: ['trieste', 'fvg'] },
  { city: 'Pordenone', country: 'Italia (Friuli-Venezia Giulia)', latitude: 45.9569, longitude: 12.6605, timezone: 'Europe/Rome', aliases: ['pordenone', 'fvg'] },
  { city: 'Gorizia', country: 'Italia (Friuli-Venezia Giulia)', latitude: 45.9402, longitude: 13.6222, timezone: 'Europe/Rome', aliases: ['gorizia', 'fvg'] },
  { city: 'Bari', country: 'Italia', latitude: 41.1171, longitude: 16.8719, timezone: 'Europe/Rome' },
  { city: 'Catania', country: 'Italia', latitude: 37.5079, longitude: 15.083, timezone: 'Europe/Rome' },
  { city: 'Genova', country: 'Italia', latitude: 44.4056, longitude: 8.9463, timezone: 'Europe/Rome' },
  { city: 'Venezia', country: 'Italia', latitude: 45.4408, longitude: 12.3155, timezone: 'Europe/Rome' },
  { city: 'Verona', country: 'Italia', latitude: 45.4384, longitude: 10.9916, timezone: 'Europe/Rome' },
  { city: 'Brescia', country: 'Italia', latitude: 45.5416, longitude: 10.2118, timezone: 'Europe/Rome' },
  { city: 'Bergamo', country: 'Italia', latitude: 45.6983, longitude: 9.6773, timezone: 'Europe/Rome' },
  { city: 'Padova', country: 'Italia', latitude: 45.4064, longitude: 11.8768, timezone: 'Europe/Rome' },
  { city: 'Reggio Emilia', country: 'Italia', latitude: 44.6982, longitude: 10.6312, timezone: 'Europe/Rome' },
  { city: 'Modena', country: 'Italia', latitude: 44.6471, longitude: 10.9252, timezone: 'Europe/Rome' },
  { city: 'Perugia', country: 'Italia', latitude: 43.1107, longitude: 12.3908, timezone: 'Europe/Rome' },
  { city: 'Cagliari', country: 'Italia', latitude: 39.2238, longitude: 9.1217, timezone: 'Europe/Rome' },

  // Holy & International Islamic capitals
  { city: 'La Mecca (Makkah)', country: 'Arabia Saudita', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { city: 'Medina (Madinah)', country: 'Arabia Saudita', latitude: 24.4672, longitude: 39.6111, timezone: 'Asia/Riyadh' },
  { city: 'Gerusalemme (Al-Quds)', country: 'Palestina', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem' },
  { city: 'Il Cairo', country: 'Egitto', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { city: 'Istanbul', country: 'Turchia', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { city: 'Casablanca', country: 'Marocco', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { city: 'Tunisi', country: 'Tunisia', latitude: 36.8065, longitude: 10.1815, timezone: 'Africa/Tunis' },
  { city: 'Algeri', country: 'Algeria', latitude: 36.7538, longitude: 3.0588, timezone: 'Africa/Algiers' },
  { city: 'Dubai', country: 'Emirati Arabi Uniti', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { city: 'Londra', country: 'Regno Unito', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { city: 'Parigi', country: 'Francia', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { city: 'Berlino', country: 'Germania', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' },
  { city: 'Zurigo', country: 'Svizzera', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { city: 'New York', country: 'Stati Uniti', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
];

export const DEFAULT_SETTINGS: CalculationSettings = {
  method: 'MWL', // Lega Islamica Mondiale as requested by user!
  asrMethod: 'Standard',
  highLatitudeRule: 'SeventhOfTheNight',
  manualOffsets: {
    imsak: 0,
    fajr: 0,
    sunrise: 0,
    duha: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
    midnight: 0,
    lastThird: 0,
    tahajjud: 0,
  },
};
