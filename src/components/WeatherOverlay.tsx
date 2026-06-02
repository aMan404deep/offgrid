import React from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, ThermometerSun } from 'lucide-react';

interface WeatherDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  code: number;
}

interface WeatherOverlayProps {
  forecast: WeatherDay[];
}

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ forecast }) => {
  if (!forecast || forecast.length === 0) return null;

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-5 h-5 text-amber-400" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-gray-300" />;
    if (code >= 45 && code <= 48) return <CloudFog className="w-5 h-5 text-gray-400" />;
    if (code >= 51 && code <= 55) return <CloudDrizzle className="w-5 h-5 text-blue-300" />;
    if (code >= 61 && code <= 65) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-5 h-5 text-blue-200" />;
    if (code >= 95 && code <= 99) return <CloudLightning className="w-5 h-5 text-yellow-500" />;
    return <ThermometerSun className="w-5 h-5 text-amber-500" />;
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="absolute top-16 right-3 pointer-events-auto z-40 bg-stone-950/85 backdrop-blur-md rounded-xl p-3 border border-[#eae7e7]/10 flex flex-col gap-2 shadow-2xl">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00b05c] animate-pulse" />
        <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">5-Day Forecast</span>
      </div>
      <div className="flex gap-3">
        {forecast.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">{getDayName(day.date)}</span>
            <div className="animate-pulse">{getWeatherIcon(day.code)}</div>
            <div className="flex flex-col mt-0.5">
              <span className="text-[11px] font-sans font-bold text-white leading-none">{Math.round(day.maxTemp)}°</span>
              <span className="text-[9px] font-sans font-medium text-stone-500 leading-none mt-0.5">{Math.round(day.minTemp)}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
