import React, { useState } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  CloudDrizzle, 
  Wind, 
  Droplets, 
  Thermometer, 
  Gauge, 
  MapPin, 
  Copy, 
  Check, 
  RefreshCw, 
  Search,
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherData, toFahrenheit, fetchWeatherForCity } from '../services/weatherService';
import { cn, copyTextToClipboard } from '../lib/utils';

interface WeatherWidgetProps {
  initialData: WeatherData;
  onRefresh?: (updatedData: WeatherData) => void;
  className?: string;
  compact?: boolean;
}

export function WeatherWidget({ initialData, onRefresh, className, compact = false }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherData>(initialData);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const formatTemp = (celsius: number) => {
    return unit === 'C' ? `${Math.round(celsius)}°C` : `${toFahrenheit(celsius)}°F`;
  };

  const getWeatherIcon = (iconName: string, sizeClass = "w-6 h-6", isDay = true) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={cn(sizeClass, isDay ? "text-amber-500 animate-[spin_12s_linear_infinite]" : "text-indigo-400")} />;
      case 'CloudSun':
        return <CloudSun className={cn(sizeClass, "text-amber-400")} />;
      case 'Cloud':
        return <Cloud className={cn(sizeClass, "text-slate-400")} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={cn(sizeClass, "text-cyan-400")} />;
      case 'CloudRain':
        return <CloudRain className={cn(sizeClass, "text-blue-500")} />;
      case 'CloudSnow':
        return <CloudSnow className={cn(sizeClass, "text-sky-300")} />;
      case 'CloudLightning':
        return <CloudLightning className={cn(sizeClass, "text-purple-500")} />;
      case 'Wind':
        return <Wind className={cn(sizeClass, "text-teal-400")} />;
      default:
        return <CloudSun className={cn(sizeClass, "text-amber-400")} />;
    }
  };

  const handleCopySummary = async () => {
    const c = data.current;
    const summary = `🌤️ Weather Report for ${data.city}${data.country ? ', ' + data.country : ''}:
• Condition: ${c.condition.label}
• Temperature: ${formatTemp(c.temperature)} (Feels like ${formatTemp(c.apparentTemperature)})
• High / Low Today: ${formatTemp(data.daily[0]?.tempMax ?? c.temperature)} / ${formatTemp(data.daily[0]?.tempMin ?? c.temperature)}
• Humidity: ${c.humidity}%
• Wind: ${c.windSpeed} km/h
• Rain Chance: ${data.daily[0]?.precipitationProbability ?? 0}%
• UV Index: ${c.uvIndex}`;

    const ok = await copyTextToClipboard(summary);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await fetchWeatherForCity(data.city);
      if (refreshed) {
        setData(refreshed);
        onRefresh?.(refreshed);
      }
    } catch (e) {
      console.warn("Failed to refresh weather:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsRefreshing(true);
    setSearchError(null);
    try {
      const found = await fetchWeatherForCity(searchQuery.trim());
      if (found) {
        setData(found);
        onRefresh?.(found);
        setShowSearch(false);
        setSearchQuery('');
      } else {
        setSearchError(`City "${searchQuery}" not found. Try another name.`);
      }
    } catch (err: any) {
      setSearchError('Could not fetch weather. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const c = data.current;
  const todayMax = data.daily[0]?.tempMax ?? c.temperature;
  const todayMin = data.daily[0]?.tempMin ?? c.temperature;

  return (
    <div className={cn(
      "w-full rounded-3xl overflow-hidden border transition-all my-2 shadow-lg",
      "bg-gradient-to-br from-white/95 via-sky-50/40 to-indigo-50/30 dark:from-slate-900/95 dark:via-slate-800/80 dark:to-indigo-950/40",
      "border-slate-200/80 dark:border-slate-800 backdrop-blur-md",
      className
    )}>
      {/* Header Bar */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400">
            <MapPin className="w-4 h-4 shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                {data.city}
              </h3>
              {data.country && (
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                  {data.country}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Live Real-Time Forecast
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-xl p-0.5 text-[11px] font-bold">
            <button
              onClick={() => setUnit('C')}
              className={cn(
                "px-2 py-1 rounded-lg transition-all",
                unit === 'C' ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
              title="Celsius"
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={cn(
                "px-2 py-1 rounded-lg transition-all",
                unit === 'F' ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
              title="Fahrenheit"
            >
              °F
            </button>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            title="Search another city"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh weather"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-indigo-500")} />
          </button>

          {/* Copy Summary */}
          <button
            onClick={handleCopySummary}
            className={cn(
              "p-2 rounded-xl transition-all active:scale-95 flex items-center gap-1 text-[11px] font-semibold",
              isCopied 
                ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title="Copy weather briefing"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* City Search Bar Expandable */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 p-3 overflow-hidden"
          >
            <form onSubmit={handleSearchCity} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter city (e.g. Paris, Tokyo, Sydney)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isRefreshing}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                Search
              </button>
            </form>
            {searchError && (
              <p className="text-[11px] text-rose-500 mt-1.5 pl-1">{searchError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Temperature & Primary Condition */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-md border border-slate-100 dark:border-slate-700/60 backdrop-blur-sm">
              {getWeatherIcon(c.condition.iconName, "w-12 h-12", c.isDay)}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatTemp(c.temperature)}
                </span>
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Feels like {formatTemp(c.apparentTemperature)}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                {c.condition.label}
              </p>
            </div>
          </div>

          {/* High / Low & Precipitation Badge */}
          <div className="flex items-center gap-2 sm:self-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="text-rose-500 flex items-center font-bold">
                <ArrowUp className="w-3 h-3 mr-0.5" />{formatTemp(todayMax)}
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sky-500 flex items-center font-bold">
                <ArrowDown className="w-3 h-3 mr-0.5" />{formatTemp(todayMin)}
              </span>
            </div>
            {data.daily[0]?.precipitationProbability > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                {data.daily[0].precipitationProbability}%
              </div>
            )}
          </div>
        </div>

        {/* 4 Key Meteorological Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Humidity</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{c.humidity}%</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-500">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Wind</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{c.windSpeed} km/h</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">UV Index</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{c.uvIndex} / 10</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pressure</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{c.pressure} hPa</p>
            </div>
          </div>
        </div>

        {/* Hourly Forecast Carousel */}
        {data.hourly && data.hourly.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                24-Hour Forecast
              </span>
              <span className="text-[10px] text-slate-400">Scroll for more →</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 custom-scrollbar">
              {data.hourly.slice(0, 14).map((h, idx) => (
                <div
                  key={`hour-${idx}-${h.time}`}
                  className={cn(
                    "shrink-0 flex flex-col items-center justify-between p-2.5 rounded-2xl min-w-[62px] border transition-all",
                    idx === 0 
                      ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/20"
                      : "bg-white/60 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                  )}
                >
                  <span className={cn("text-[10px] font-bold", idx === 0 ? "text-indigo-100" : "text-slate-400")}>
                    {h.hourLabel}
                  </span>
                  <div className="my-1.5">
                    {getWeatherIcon(h.condition.iconName, "w-5 h-5", idx < 8)}
                  </div>
                  <span className="text-xs font-black">
                    {formatTemp(h.temperature)}
                  </span>
                  {h.precipitationProbability > 0 && (
                    <span className={cn(
                      "text-[9px] font-bold mt-1 flex items-center gap-0.5",
                      idx === 0 ? "text-indigo-200" : "text-blue-500"
                    )}>
                      💧{h.precipitationProbability}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-Day Forecast Strip (Collapsible or visible) */}
        {!compact && data.daily && data.daily.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                7-Day Outlook
              </span>
            </div>
            <div className="space-y-1.5">
              {data.daily.map((day, idx) => (
                <div 
                  key={`day-${idx}-${day.date}`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 transition-all text-xs"
                >
                  <span className="w-20 font-bold text-slate-700 dark:text-slate-200">
                    {day.dayName}
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    {getWeatherIcon(day.condition.iconName, "w-4 h-4", true)}
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {day.condition.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 justify-end w-32">
                    {day.precipitationProbability > 0 && (
                      <span className="text-[10px] font-semibold text-blue-500">
                        {day.precipitationProbability}% rain
                      </span>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatTemp(day.tempMax)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">
                      {formatTemp(day.tempMin)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
