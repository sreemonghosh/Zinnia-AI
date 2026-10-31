// Real-time Weather Service powered by Open-Meteo & Geolocation APIs
// Free, high-accuracy, real-time meteorological forecasting

export interface WeatherCondition {
  label: string;
  iconName: 'Sun' | 'Cloud' | 'CloudSun' | 'CloudRain' | 'CloudLightning' | 'CloudSnow' | 'CloudDrizzle' | 'CloudFog' | 'Wind';
  color: string;
  bgGradient: string;
  isRain: boolean;
  isSnow: boolean;
}

export interface CurrentWeather {
  temperature: number; // °C
  apparentTemperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  uvIndex: number;
  precipitation: number; // mm
  weatherCode: number;
  condition: WeatherCondition;
  isDay: boolean;
  observationTime: string;
}

export interface DailyForecastDay {
  date: string;
  dayName: string;
  weatherCode: number;
  condition: WeatherCondition;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
}

export interface HourlyForecastHour {
  time: string;
  hourLabel: string;
  temperature: number;
  weatherCode: number;
  condition: WeatherCondition;
  precipitationProbability: number;
}

export interface WeatherData {
  city: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  daily: DailyForecastDay[];
  hourly: HourlyForecastHour[];
  fetchedAt: number;
}

export function parseWeatherCode(code: number, isDay: boolean = true): WeatherCondition {
  switch (code) {
    case 0:
      return {
        label: isDay ? 'Clear Sky' : 'Clear Night',
        iconName: isDay ? 'Sun' : 'CloudSun',
        color: isDay ? 'text-amber-500' : 'text-indigo-400',
        bgGradient: isDay ? 'from-amber-400/20 via-orange-400/10 to-transparent' : 'from-indigo-950/40 via-slate-900/20 to-transparent',
        isRain: false,
        isSnow: false,
      };
    case 1:
      return {
        label: 'Mainly Clear',
        iconName: 'CloudSun',
        color: 'text-amber-400',
        bgGradient: 'from-amber-300/20 via-sky-400/10 to-transparent',
        isRain: false,
        isSnow: false,
      };
    case 2:
      return {
        label: 'Partly Cloudy',
        iconName: 'CloudSun',
        color: 'text-sky-400',
        bgGradient: 'from-sky-400/20 via-slate-400/10 to-transparent',
        isRain: false,
        isSnow: false,
      };
    case 3:
      return {
        label: 'Overcast',
        iconName: 'Cloud',
        color: 'text-slate-400',
        bgGradient: 'from-slate-500/20 via-slate-600/10 to-transparent',
        isRain: false,
        isSnow: false,
      };
    case 45:
    case 48:
      return {
        label: 'Foggy',
        iconName: 'CloudFog',
        color: 'text-slate-400',
        bgGradient: 'from-slate-400/20 via-gray-500/10 to-transparent',
        isRain: false,
        isSnow: false,
      };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return {
        label: 'Drizzle',
        iconName: 'CloudDrizzle',
        color: 'text-cyan-400',
        bgGradient: 'from-cyan-400/20 via-blue-500/10 to-transparent',
        isRain: true,
        isSnow: false,
      };
    case 61:
      return {
        label: 'Light Rain',
        iconName: 'CloudRain',
        color: 'text-blue-400',
        bgGradient: 'from-blue-500/20 via-sky-600/10 to-transparent',
        isRain: true,
        isSnow: false,
      };
    case 63:
      return {
        label: 'Moderate Rain',
        iconName: 'CloudRain',
        color: 'text-blue-500',
        bgGradient: 'from-blue-600/25 via-indigo-700/10 to-transparent',
        isRain: true,
        isSnow: false,
      };
    case 65:
      return {
        label: 'Heavy Rain',
        iconName: 'CloudRain',
        color: 'text-blue-600',
        bgGradient: 'from-blue-700/30 via-slate-800/20 to-transparent',
        isRain: true,
        isSnow: false,
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        label: 'Snowfall',
        iconName: 'CloudSnow',
        color: 'text-sky-200',
        bgGradient: 'from-sky-200/20 via-indigo-300/10 to-transparent',
        isRain: false,
        isSnow: true,
      };
    case 80:
    case 81:
    case 82:
      return {
        label: 'Rain Showers',
        iconName: 'CloudRain',
        color: 'text-blue-400',
        bgGradient: 'from-blue-500/20 via-cyan-600/10 to-transparent',
        isRain: true,
        isSnow: false,
      };
    case 85:
    case 86:
      return {
        label: 'Snow Showers',
        iconName: 'CloudSnow',
        color: 'text-sky-300',
        bgGradient: 'from-sky-300/20 via-blue-400/10 to-transparent',
        isRain: false,
        isSnow: true,
      };
    case 95:
      return {
        label: 'Thunderstorm',
        iconName: 'CloudLightning',
        color: 'text-purple-400',
        bgGradient: 'from-purple-600/25 via-indigo-900/20 to-transparent',
        isRain: true,
        isSnow: false,
      };
    case 96:
    case 99:
      return {
        label: 'Severe Thunderstorm',
        iconName: 'CloudLightning',
        color: 'text-amber-500',
        bgGradient: 'from-red-600/25 via-purple-900/20 to-transparent',
        isRain: true,
        isSnow: false,
      };
    default:
      return {
        label: 'Fair',
        iconName: 'CloudSun',
        color: 'text-amber-400',
        bgGradient: 'from-amber-400/15 via-blue-400/10 to-transparent',
        isRain: false,
        isSnow: false,
      };
  }
}

// Geocode a city name into lat/lon/name/country
export async function geocodeCity(query: string): Promise<{ name: string; country: string; admin1?: string; latitude: number; longitude: number } | null> {
  const clean = query.trim().replace(/[?.,!]/g, '');
  if (!clean) return null;

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const top = data.results[0];
      return {
        name: top.name,
        country: top.country || '',
        admin1: top.admin1 || '',
        latitude: top.latitude,
        longitude: top.longitude,
      };
    }
  } catch (err) {
    console.warn('Geocoding error:', err);
  }
  return null;
}

// Reverse geocode latitude and longitude to get the real city, state, and country name
export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<{ city: string; country: string; state?: string } | null> {
  // 1. Try our server-side reverse geocode endpoint first
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data.city && data.city !== 'Local Area') {
        return {
          city: data.city,
          country: data.country || '',
          state: data.state || ''
        };
      }
    }
  } catch (err) {
    console.warn('Server reverse geocode notice:', err);
  }

  // 2. Direct OpenStreetMap Nominatim reverse geocode fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (res.ok) {
      const revData = await res.json();
      const addr = revData.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || addr.state_district || revData.name;
      if (city) {
        return {
          city,
          country: addr.country || '',
          state: addr.state || ''
        };
      }
    }
  } catch (err) {
    console.warn('Direct reverse geocode notice:', err);
  }

  // 3. Fallback to client browser timezone city (e.g. "Asia/Kolkata" -> "Kolkata")
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz.includes('/')) {
      const tzCity = tz.split('/')[1]?.replace(/_/g, ' ');
      if (tzCity) {
        return {
          city: tzCity,
          country: tz.split('/')[0] || ''
        };
      }
    }
  } catch (e) {}

  return null;
}

// Fetch complete weather data for latitude/longitude
export async function fetchWeatherByCoordinates(
  lat: number,
  lon: number,
  locationName?: string,
  countryName?: string
): Promise<WeatherData> {
  let finalCity = locationName;
  let finalCountry = countryName || '';

  const isGeneric = !finalCity || /^(your location|current location|local weather|local area|my location|my gps)$/i.test(finalCity.trim());

  if (isGeneric) {
    try {
      const rev = await reverseGeocodeCoordinates(lat, lon);
      if (rev && rev.city) {
        finalCity = rev.city;
        if (rev.country) finalCountry = rev.country;
      }
    } catch (e) {
      console.warn("Reverse geocode in fetchWeatherByCoordinates notice:", e);
    }
  }

  // Fallback to timezone name if still unresolved
  if (!finalCity || /^(your location|current location|local weather|local area|my location|my gps)$/i.test(finalCity.trim())) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz.includes('/')) {
        finalCity = tz.split('/')[1]?.replace(/_/g, ' ');
      }
    } catch (e) {}
  }

  finalCity = finalCity || 'Your Location';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather service error (${res.status})`);
  }
  const raw = await res.json();

  const isDay = raw.current?.is_day === 1;
  const currentCode = raw.current?.weather_code ?? 0;
  const condition = parseWeatherCode(currentCode, isDay);

  // Daily forecast (next 7 days)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daily: DailyForecastDay[] = (raw.daily?.time || []).map((dateStr: string, i: number) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
    const code = raw.daily.weather_code[i] ?? 0;
    return {
      date: dateStr,
      dayName,
      weatherCode: code,
      condition: parseWeatherCode(code, true),
      tempMax: Math.round(raw.daily.temperature_2m_max[i] ?? 0),
      tempMin: Math.round(raw.daily.temperature_2m_min[i] ?? 0),
      precipitationProbability: Math.round(raw.daily.precipitation_probability_max[i] ?? 0),
    };
  });

  // Hourly forecast (next 24 hours from current index)
  const now = new Date();
  const currentHour = now.getHours();
  const hourlyTimes: string[] = raw.hourly?.time || [];
  
  // Find index closest to now
  let startIndex = hourlyTimes.findIndex(t => new Date(t).getTime() >= Date.now() - 30 * 60 * 1000);
  if (startIndex === -1) startIndex = 0;

  const hourly: HourlyForecastHour[] = hourlyTimes.slice(startIndex, startIndex + 24).map((timeStr: string, idx: number) => {
    const realIndex = startIndex + idx;
    const dateObj = new Date(timeStr);
    const hour = dateObj.getHours();
    const hourLabel = idx === 0 ? 'Now' : `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
    const code = raw.hourly.weather_code[realIndex] ?? 0;
    const temp = Math.round(raw.hourly.temperature_2m[realIndex] ?? 0);
    const pop = Math.round(raw.hourly.precipitation_probability[realIndex] ?? 0);
    return {
      time: timeStr,
      hourLabel,
      temperature: temp,
      weatherCode: code,
      condition: parseWeatherCode(code, hour >= 6 && hour < 20),
      precipitationProbability: pop,
    };
  });

  return {
    city: finalCity,
    country: finalCountry,
    latitude: lat,
    longitude: lon,
    timezone: raw.timezone || 'auto',
    current: {
      temperature: Math.round(raw.current?.temperature_2m ?? 0),
      apparentTemperature: Math.round(raw.current?.apparent_temperature ?? 0),
      humidity: Math.round(raw.current?.relative_humidity_2m ?? 0),
      windSpeed: Math.round(raw.current?.wind_speed_10m ?? 0),
      windDirection: Math.round(raw.current?.wind_direction_10m ?? 0),
      pressure: Math.round(raw.current?.pressure_msl ?? 1013),
      uvIndex: Number((raw.current?.uv_index ?? 0).toFixed(1)),
      precipitation: Number((raw.current?.precipitation ?? 0).toFixed(1)),
      weatherCode: currentCode,
      condition,
      isDay,
      observationTime: raw.current?.time || new Date().toISOString(),
    },
    daily,
    hourly,
    fetchedAt: Date.now(),
  };
}

// Fetch weather by city name query
export async function fetchWeatherForCity(cityName: string): Promise<WeatherData | null> {
  const geo = await geocodeCity(cityName);
  if (!geo) return null;
  return fetchWeatherByCoordinates(
    geo.latitude,
    geo.longitude,
    geo.name,
    geo.country
  );
}

// Browser Geolocation helper
export async function getCurrentUserPosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        resolve(null);
      },
      { timeout: 7000 }
    );
  });
}

// Smart Intent Detection: Detects if a message is asking about the weather
export function detectWeatherIntent(text: string): { isWeather: boolean; location?: string } {
  if (!text) return { isWeather: false };
  const lower = text.toLowerCase().trim();

  // Obvious non-weather queries (e.g. "weathering steel", "weather the storm" idiom)
  if (lower.includes('weathering') || lower.includes('weather the storm')) {
    return { isWeather: false };
  }

  const weatherKeywords = [
    'weather',
    'temperature',
    'forecast',
    'is it raining',
    'will it rain',
    'is it raining outside',
    'is it sunny',
    'is it hot',
    'is it cold',
    'rain today',
    'snow today',
    'how hot is it',
    'how cold is it',
    'humidity today',
    'wind speed in',
    'degrees outside',
    'weather report',
    'weather forecast',
    'take an umbrella',
    'need an umbrella'
  ];

  const hasKeyword = weatherKeywords.some(kw => lower.includes(kw));
  if (!hasKeyword) {
    return { isWeather: false };
  }

  // Location extraction patterns:
  // e.g. "weather in Tokyo", "what's the weather for New York", "forecast in London, UK"
  const patterns = [
    /weather\s+(?:in|for|at|around|of)\s+([a-zA-Z\s,.-]+?)(?:\s+(?:today|tomorrow|now|this week|right now|\?|$))/i,
    /temperature\s+(?:in|for|at|of)\s+([a-zA-Z\s,.-]+?)(?:\s+(?:today|tomorrow|now|right now|\?|$))/i,
    /forecast\s+(?:in|for|at|of)\s+([a-zA-Z\s,.-]+?)(?:\s+(?:today|tomorrow|now|right now|\?|$))/i,
    /is it raining\s+(?:in|at)\s+([a-zA-Z\s,.-]+?)(?:\s+(?:today|now|\?|$))/i,
    /([a-zA-Z\s.-]{2,25})\s+weather/i,
    /([a-zA-Z\s.-]{2,25})\s+forecast/i,
  ];

  for (const pat of patterns) {
    const match = lower.match(pat);
    if (match && match[1]) {
      let loc = match[1].trim()
        .replace(/^(the|a|an)\s+/i, '')
        .replace(/[?.,!]/g, '')
        .trim();
      
      const stopwords = ['today', 'tomorrow', 'now', 'outside', 'here', 'my city', 'my area', 'currently', 'this week', 'weekend'];
      if (!stopwords.includes(loc) && loc.length >= 2) {
        return { isWeather: true, location: loc };
      }
    }
  }

  return { isWeather: true };
}

// Convert Celsius to Fahrenheit
export function toFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

// Formats live weather data into authoritative ground truth for Gemini prompt
export function formatWeatherGrounding(data: WeatherData): string {
  const c = data.current;
  const fTemp = toFahrenheit(c.temperature);
  const fApparent = toFahrenheit(c.apparentTemperature);
  
  const dailySummary = data.daily.slice(0, 4).map(d => 
    `- ${d.dayName} (${d.date}): ${d.condition.label}, High: ${d.tempMax}°C (${toFahrenheit(d.tempMax)}°F), Low: ${d.tempMin}°C (${toFahrenheit(d.tempMin)}°F), Rain Chance: ${d.precipitationProbability}%`
  ).join('\n');

  return `
AUTHORITATIVE REAL-TIME WEATHER GROUND TRUTH:
Location: ${data.city}${data.country ? ', ' + data.country : ''}
Current Weather Condition: ${c.condition.label}
Current Temperature: ${c.temperature}°C (${fTemp}°F)
Feels Like: ${c.apparentTemperature}°C (${fApparent}°F)
Humidity: ${c.humidity}%
Wind Speed: ${c.windSpeed} km/h
Precipitation: ${c.precipitation} mm
UV Index: ${c.uvIndex}
Atmospheric Pressure: ${c.pressure} hPa
Is Day: ${c.isDay ? 'Yes' : 'No'}
Observation Timestamp: ${c.observationTime}

Upcoming 4-Day Forecast:
${dailySummary}

WEATHER RESPONSE RULES:
1. Use the above real-time meteorological data as absolute ground truth.
2. Directly answer the user's question (e.g. give the temperature, whether it's raining, whether they need an umbrella/coat, wind conditions).
3. Mention both Celsius and Fahrenheit for clear international accessibility.
4. Keep the tone friendly, helpful, and concise. Note that a full visual weather forecast widget is also rendered automatically alongside your answer.
`.trim();
}
