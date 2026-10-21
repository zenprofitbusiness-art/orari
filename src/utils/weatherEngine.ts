export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  iconType: 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'rain' | 'drizzle' | 'snow' | 'thunder' | 'fog';
  isDay: boolean;
  precipitation: number;
  tempMax: number;
  tempMin: number;
  precipitationProbMax: number;
  updatedAt: Date;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface HourlyForecastItem {
  time: string; // HH:mm
  fullTime: string;
  temperature: number;
  precipitationProb: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
  iconType: WeatherData['iconType'];
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  precipitationProbMax: number;
  weatherCode: number;
  description: string;
  iconType: WeatherData['iconType'];
}

export function getWeatherCondition(code: number, isDay: boolean = true): {
  description: string;
  iconType: WeatherData['iconType'];
} {
  switch (code) {
    case 0:
      return {
        description: isDay ? 'Sereno e soleggiato' : 'Notte serena',
        iconType: isDay ? 'sun' : 'moon',
      };
    case 1:
      return {
        description: isDay ? 'Prevalentemente sereno' : 'Cielo poco nuvoloso',
        iconType: isDay ? 'cloud-sun' : 'cloud-moon',
      };
    case 2:
      return {
        description: 'Parzialmente nuvoloso',
        iconType: isDay ? 'cloud-sun' : 'cloud-moon',
      };
    case 3:
      return {
        description: 'Coperto / Molto nuvoloso',
        iconType: 'cloud',
      };
    case 45:
    case 48:
      return {
        description: 'Nebbia o foschia',
        iconType: 'fog',
      };
    case 51:
    case 53:
    case 55:
      return {
        description: 'Pioviggine leggera',
        iconType: 'drizzle',
      };
    case 56:
    case 57:
      return {
        description: 'Pioviggine gelata',
        iconType: 'drizzle',
      };
    case 61:
      return {
        description: 'Pioggia debole',
        iconType: 'rain',
      };
    case 63:
      return {
        description: 'Pioggia moderata',
        iconType: 'rain',
      };
    case 65:
      return {
        description: 'Pioggia forte e battente',
        iconType: 'rain',
      };
    case 66:
    case 67:
      return {
        description: 'Pioggia gelata',
        iconType: 'rain',
      };
    case 71:
    case 73:
    case 75:
      return {
        description: 'Nevicata',
        iconType: 'snow',
      };
    case 77:
      return {
        description: 'Granuli di neve',
        iconType: 'snow',
      };
    case 80:
    case 81:
    case 82:
      return {
        description: 'Rovesci di pioggia',
        iconType: 'rain',
      };
    case 85:
    case 86:
      return {
        description: 'Rovesci di neve',
        iconType: 'snow',
      };
    case 95:
      return {
        description: 'Temporale',
        iconType: 'thunder',
      };
    case 96:
    case 99:
      return {
        description: 'Temporale con grandine',
        iconType: 'thunder',
      };
    default:
      return {
        description: 'Variabile',
        iconType: isDay ? 'cloud-sun' : 'cloud',
      };
  }
}

// In-memory cache to avoid excessive API requests
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  timezone: string = 'Europe/Rome'
): Promise<WeatherData> {
  const cacheKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(timezone)}&forecast_days=7`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP error: ${res.status}`);
    }

    const json = await res.json();
    const current = json.current;
    const daily = json.daily;
    const hourly = json.hourly;

    const isDay = current.is_day === 1;
    const condition = getWeatherCondition(current.weather_code, isDay);

    // Parse Hourly (take next 24 hours starting from current hour)
    const hourlyList: HourlyForecastItem[] = [];
    if (hourly && hourly.time) {
      const currentIsoHour = current.time ? current.time.slice(0, 13) : '';
      let startIndex = hourly.time.findIndex((t: string) => t.startsWith(currentIsoHour));
      if (startIndex === -1) startIndex = 0;

      for (let i = startIndex; i < Math.min(startIndex + 24, hourly.time.length); i++) {
        const timeStr = hourly.time[i];
        const dateObj = new Date(timeStr);
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const hIsDay = hourly.is_day ? hourly.is_day[i] === 1 : true;
        const hCode = hourly.weather_code[i] ?? 0;
        const hCond = getWeatherCondition(hCode, hIsDay);

        hourlyList.push({
          time: `${hours}:00`,
          fullTime: timeStr,
          temperature: Math.round(hourly.temperature_2m[i]),
          precipitationProb: Math.round(hourly.precipitation_probability[i] ?? 0),
          weatherCode: hCode,
          isDay: hIsDay,
          description: hCond.description,
          iconType: hCond.iconType,
        });
      }
    }

    // Parse Daily (next 7 days)
    const dailyList: DailyForecastItem[] = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const dateStr = daily.time[i];
        const dObj = new Date(dateStr + 'T12:00:00');
        const dayName = i === 0
          ? 'Oggi'
          : i === 1
          ? 'Domani'
          : dObj.toLocaleDateString('it-IT', { weekday: 'short' });
        
        const dCode = daily.weather_code[i] ?? 0;
        const dCond = getWeatherCondition(dCode, true);

        dailyList.push({
          date: dateStr,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          precipitationProbMax: Math.round(daily.precipitation_probability_max[i] ?? 0),
          weatherCode: dCode,
          description: dCond.description,
          iconType: dCond.iconType,
        });
      }
    }

    const result: WeatherData = {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
      description: condition.description,
      iconType: condition.iconType,
      isDay,
      precipitation: current.precipitation,
      tempMax: daily?.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : Math.round(current.temperature_2m),
      tempMin: daily?.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : Math.round(current.temperature_2m),
      precipitationProbMax: daily?.precipitation_probability_max?.[0] ? Math.round(daily.precipitation_probability_max[0]) : 0,
      updatedAt: new Date(),
      hourly: hourlyList,
      daily: dailyList,
    };

    weatherCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch (error) {
    console.warn('Weather fetch error:', error);
    // Return graceful fallback
    const fallback: WeatherData = {
      temperature: 17,
      apparentTemperature: 17,
      humidity: 75,
      windSpeed: 10,
      weatherCode: 2,
      description: 'Parzialmente nuvoloso',
      iconType: 'cloud-sun',
      isDay: true,
      precipitation: 0,
      tempMax: 19,
      tempMin: 12,
      precipitationProbMax: 20,
      updatedAt: new Date(),
      hourly: [],
      daily: [],
    };
    return fallback;
  }
}
