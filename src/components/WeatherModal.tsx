import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Search, 
  Navigation, 
  Sparkles, 
  CloudSun, 
  Loader2,
  Send,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherWidget } from './WeatherWidget';
import { 
  WeatherData, 
  fetchWeatherForCity, 
  fetchWeatherByCoordinates, 
  getCurrentUserPosition,
  geocodeCity 
} from '../services/weatherService';
import { copyTextToClipboard } from '../lib/utils';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (summary: string) => void;
  userLocation?: string;
}

const POPULAR_CITIES = [
  'London',
  'New York',
  'Tokyo',
  'Paris',
  'Sydney',
  'Dubai',
  'Singapore',
  'San Francisco'
];

export function WeatherModal({ isOpen, onClose, onSendToChat, userLocation }: WeatherModalProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Initialize weather when opened
  useEffect(() => {
    if (!isOpen) return;

    const initWeather = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // 1. Try user location if set
        if (userLocation && userLocation !== 'Unknown') {
          const w = await fetchWeatherForCity(userLocation);
          if (w) {
            setData(w);
            setLoading(false);
            return;
          }
        }

        // 2. Try browser geolocation with automatic reverse geocoding
        const pos = await getCurrentUserPosition();
        if (pos) {
          const w = await fetchWeatherByCoordinates(pos.latitude, pos.longitude);
          if (w) {
            setData(w);
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to default iconic city (London)
        const defaultW = await fetchWeatherForCity('London');
        setData(defaultW);
      } catch (err: any) {
        setErrorMsg('Unable to retrieve weather. Please search for a city.');
      } finally {
        setLoading(false);
      }
    };

    initWeather();
  }, [isOpen, userLocation]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchWeatherForCity(searchCity.trim());
      if (res) {
        setData(res);
        setSearchCity('');
      } else {
        setErrorMsg(`Could not find "${searchCity}". Try a major city name.`);
      }
    } catch (err) {
      setErrorMsg('Network error fetching weather.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseGPS = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const pos = await getCurrentUserPosition();
      if (pos) {
        const w = await fetchWeatherByCoordinates(pos.latitude, pos.longitude);
        setData(w);
      } else {
        setErrorMsg('Location permission denied or timed out. Please type a city name.');
      }
    } catch (e) {
      setErrorMsg('Failed to acquire GPS location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPopular = async (city: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchWeatherForCity(city);
      if (res) setData(res);
    } catch (err) {
      setErrorMsg(`Failed to load weather for ${city}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertInChat = () => {
    if (!data || !onSendToChat) return;
    const c = data.current;
    const msg = `What is the detailed weather outlook and recommendations for ${data.city}${data.country ? ', ' + data.country : ''}? (Currently ${c.temperature}°C, ${c.condition.label})`;
    onSendToChat(msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Live Weather Forecast
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/30">
                  Real-Time
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check conditions, forecasts, and climate stats worldwide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Location Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search city, state, or country..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={loading}
              title="Use current GPS location"
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shrink-0 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Navigation className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">My GPS</span>
            </button>
          </form>

          {/* Popular Cities Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 custom-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Popular:
            </span>
            {POPULAR_CITIES.map((city) => (
              <button
                key={`pop-city-${city}`}
                onClick={() => handleSelectPopular(city)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-all shrink-0 active:scale-95"
              >
                {city}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-medium mt-2 pl-1">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Fetching meteorological data...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Gathering real-time satellite & radar observations
              </p>
            </div>
          ) : data ? (
            <WeatherWidget initialData={data} onRefresh={(up) => setData(up)} />
          ) : (
            <div className="py-16 text-center text-slate-400">
              No weather data loaded. Type a city above to view forecast.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <p className="text-[11px] text-slate-400">
            Powered by Open-Meteo High-Resolution Forecasting
          </p>
          <div className="flex items-center gap-2">
            {onSendToChat && data && (
              <button
                onClick={handleInsertInChat}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                Ask Zinnia about this Weather
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
