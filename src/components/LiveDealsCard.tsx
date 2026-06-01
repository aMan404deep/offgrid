import React, { useEffect, useState } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { 
  Plane, 
  Building, 
  Tag, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  CloudSun, 
  Shield,
  Sun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  MapPin
} from "lucide-react";

// WMO weather interpretation codes helper to convert numeric codes to precise descriptive text & icons
const getWeatherDetails = (code: number) => {
  switch (code) {
    case 0:
      return { desc: "Clear sky", icon: "Sun", bg: "bg-amber-50 text-amber-600 border-amber-200" };
    case 1:
    case 2:
    case 3:
      return { desc: "Mainly clear or partly cloudy", icon: "CloudSun", bg: "bg-blue-50 text-blue-600 border-blue-200" };
    case 45:
    case 48:
      return { desc: "Fog and depositing rime fog", icon: "Cloud", bg: "bg-stone-50 text-stone-600 border-stone-200" };
    case 51:
    case 53:
    case 55:
      return { desc: "Drizzle / Light intensity", icon: "CloudDrizzle", bg: "bg-sky-50 text-sky-600 border-sky-200" };
    case 56:
    case 57:
      return { desc: "Freezing Drizzle", icon: "CloudSnow", bg: "bg-sky-50 text-sky-600 border-sky-200" };
    case 61:
    case 63:
    case 65:
      return { desc: "Rain: Slight, moderate & heavy", icon: "CloudRain", bg: "bg-blue-50/70 text-blue-700 border-blue-200" };
    case 66:
    case 67:
      return { desc: "Freezing Rain", icon: "CloudSnow", bg: "bg-indigo-50 text-indigo-600 border-indigo-200" };
    case 71:
    case 73:
    case 75:
      return { desc: "Snow fall: Slight, moderate & heavy", icon: "CloudSnow", bg: "bg-indigo-50 text-indigo-600 border-indigo-200" };
    case 77:
      return { desc: "Snow grains", icon: "CloudSnow", bg: "bg-indigo-50 text-indigo-600 border-indigo-200" };
    case 80:
    case 81:
    case 82:
      return { desc: "Rain showers", icon: "CloudRain", bg: "bg-blue-50 text-blue-600 border-blue-200" };
    case 85:
    case 86:
      return { desc: "Snow showers", icon: "Snowflake", bg: "bg-sky-50 text-sky-600 border-sky-200" };
    case 95:
    case 96:
    case 99:
      return { desc: "Thunderstorm with hail", icon: "CloudLightning", bg: "bg-purple-50 text-purple-600 border-purple-200" };
    default:
      return { desc: "Moderate conditions", icon: "CloudSun", bg: "bg-stone-50 text-stone-600 border-stone-200" };
  }
};

const WeatherIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  switch (iconName) {
    case "Sun": return <Sun className={className} />;
    case "Cloud": return <Cloud className={className} />;
    case "CloudSun": return <CloudSun className={className} />;
    case "CloudDrizzle": return <CloudDrizzle className={className} />;
    case "CloudRain": return <CloudRain className={className} />;
    case "CloudSnow": return <CloudSnow className={className} />;
    case "CloudLightning": return <CloudLightning className={className} />;
    case "Snowflake": return <Snowflake className={className} />;
    default: return <CloudSun className={className} />;
  }
};

export const LiveDealsCard: React.FC = () => {
  const { currentTripLocation, liveDeals, isFetchingDeals, fetchLiveDeals } = useLeaveStore();

  const [openMeteoWeather, setOpenMeteoWeather] = useState<any | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  useEffect(() => {
    if (!currentTripLocation) {
      setOpenMeteoWeather(null);
      return;
    }

    const fetchWeather = async () => {
      setIsFetchingWeather(true);
      try {
        // Step 1: Open-Meteo Geocoding search resolving current offline mapping
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(currentTripLocation)}&count=1&language=en&format=json`
        );
        if (!geoResponse.ok) throw new Error("Geocoding failed");
        const geoData = await geoResponse.json();
        if (geoData && Array.isArray(geoData.results) && geoData.results.length > 0) {
          const loc = geoData.results[0];
          const lat = loc.latitude;
          const lng = loc.longitude;
          const locationName = `${loc.name}${loc.country ? `, ${loc.country}` : ""}`;

          // Step 2: Open-Meteo high precision current weather parameters
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
          );
          if (!weatherResponse.ok) throw new Error("Weather forecast failed");
          const weatherData = await weatherResponse.json();
          if (weatherData && weatherData.current) {
            setOpenMeteoWeather({
              temp: weatherData.current.temperature_2m,
              humidity: weatherData.current.relative_humidity_2m,
              windSpeed: weatherData.current.wind_speed_10m,
              weatherCode: weatherData.current.weather_code,
              latitude: lat,
              longitude: lng,
              locationName,
            });
          }
        } else {
          // If the location is custom or unresolved, clear Open-Meteo panel to use baseline strings
          setOpenMeteoWeather(null);
        }
      } catch (err) {
        console.warn("Could not retrieve Open-Meteo current forecast:", err);
        setOpenMeteoWeather(null);
      } finally {
        setIsFetchingWeather(false);
      }
    };

    fetchWeather();
  }, [currentTripLocation]);

  const handleFetchDeals = () => {
    fetchLiveDeals(currentTripLocation);
  };

  const weatherDetails = openMeteoWeather ? getWeatherDetails(openMeteoWeather.weatherCode) : null;

  return (
    <div className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 mt-6 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#1c1b1b] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#944a00]" />
            Live Bookings & Offers
          </h3>
          <p className="text-sm text-[#564337] mt-1 font-medium">
            Real-time scraped deals compared securely across legit travel websites.
          </p>
        </div>
        <button
          onClick={handleFetchDeals}
          disabled={isFetchingDeals}
          className="shrink-0 flex w-full md:w-auto items-center justify-center gap-2 bg-[#1c1b1b] text-white text-sm font-bold py-2.5 px-5 rounded-xl hover:bg-[#2c2c2e] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isFetchingDeals ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Fetch Deals for {currentTripLocation}
        </button>
      </div>

      {/* Dynamic Open-Meteo Real-time Forecast Box (Instantly updated on location changes) */}
      {currentTripLocation && (
        <div className="mb-6 p-5 bg-gradient-to-r from-[#ffdcc5]/10 to-[#fdfaf8] border border-[#f5ece6] rounded-2xl">
          <div className="flex justify-between items-center border-b border-[#ffdcc5]/30 pb-3 mb-4">
            <div className="flex items-center gap-2 text-[#944a00]">
              <CloudSun className="w-4 h-4 animate-pulse" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider">Open-Meteo Realtime Forecast</span>
            </div>
            {openMeteoWeather && (
              <span className="text-[10px] text-stone-400 font-mono">
                GPS: {openMeteoWeather.latitude.toFixed(2)}°, {openMeteoWeather.longitude.toFixed(2)}°
              </span>
            )}
          </div>

          {isFetchingWeather ? (
            <div className="py-4 flex items-center justify-center gap-2 text-stone-500 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-[#944a00]" />
              Syncing live atmospheric telemetry for {currentTripLocation}...
            </div>
          ) : openMeteoWeather && weatherDetails ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl border ${weatherDetails.bg} flex items-center justify-center shadow-sm`}>
                  <WeatherIcon iconName={weatherDetails.icon} className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-[22px] font-extrabold text-stone-900 tracking-tight leading-none">
                    {openMeteoWeather.temp}°C
                  </h4>
                  <p className="text-sm font-bold text-[#944a00] mt-1 flex items-center gap-1.5 capitalize">
                    <span>{weatherDetails.desc}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 font-medium mt-0.5 leading-none">
                    Currently observed near {openMeteoWeather.locationName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
                <div className="bg-white px-3 py-2 border border-stone-200/60 rounded-xl flex items-center gap-2 shrink-0 shadow-xs">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <div className="text-left leading-none">
                    <span className="text-[10px] text-stone-400 block font-mono">HUMIDITY</span>
                    <span className="text-xs font-bold text-stone-900">{openMeteoWeather.humidity}%</span>
                  </div>
                </div>
                <div className="bg-white px-3 py-2 border border-stone-200/60 rounded-xl flex items-center gap-2 shrink-0 shadow-xs">
                  <Wind className="w-4 h-4 text-[#00b05c]" />
                  <div className="text-left leading-none">
                    <span className="text-[10px] text-stone-400 block font-mono">WIND</span>
                    <span className="text-xs font-bold text-stone-900">{openMeteoWeather.windSpeed} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#897365] font-medium py-2">
              Unable to reach Open-Meteo live atmospheric servers. General offline travel buffers remain active.
            </div>
          )}
        </div>
      )}

      {!liveDeals && !isFetchingDeals && (
        <div className="py-12 text-center text-[#897365] bg-[#eae7e7]/30 rounded-2xl border-2 border-dashed border-[#eae7e7]">
          <p className="text-sm font-medium">Click "Fetch Deals" to run the search across verified platforms.</p>
        </div>
      )}

      {isFetchingDeals && (
        <div className="py-16 flex flex-col items-center justify-center gap-4 bg-[#f8f6f5] rounded-2xl border border-[#eae7e7]">
          <Loader2 className="w-8 h-8 text-[#944a00] animate-spin" />
          <p className="text-sm font-mono text-[#897365] animate-pulse font-medium">Running live comparison algorithms...</p>
        </div>
      )}

      {liveDeals && !isFetchingDeals && (
        <div className="space-y-8">
          {/* Weather & Safety Context */}
          {(liveDeals.weather || liveDeals.safety) && (
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 bg-[#f8f6f5] rounded-2xl p-5 border border-[#eae7e7] text-sm">
              {liveDeals.weather && (
                <div className="flex-1 flex gap-3.5 items-start bg-white p-4 rounded-xl border border-[#eae7e7] shadow-sm">
                  <div className="p-2 bg-[#fcf9f8] rounded-lg text-[#944a00] shrink-0">
                    <CloudSun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#1c1b1b] block mb-1">Current Weather Outlook</span>
                    <span className="text-[#564337] leading-relaxed text-sm block">{liveDeals.weather}</span>
                  </div>
                </div>
              )}
              {liveDeals.safety && (
                <div className="flex-1 flex gap-3.5 items-start bg-white p-4 rounded-xl border border-[#eae7e7] shadow-sm">
                  <div className="p-2 bg-[#f4fffc] rounded-lg text-[#00b05c] shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#1c1b1b] block mb-1">Travel Safety Advisory</span>
                    <span className="text-[#564337] leading-relaxed text-sm block">{liveDeals.safety}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Flights */}
          {liveDeals.flights && liveDeals.flights.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#564337] flex items-center gap-2 uppercase tracking-wide border-b border-[#eae7e7] pb-2">
                <Plane className="w-4 h-4" /> Flights
              </h4>
              <div className="space-y-3">
                {liveDeals.flights.map((flight, idx) => (
                  <a
                    key={`flight-${idx}`}
                    href={flight.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-white border border-[#eae7e7] rounded-xl p-4 hover:border-[#944a00] hover:shadow-md transition-all sm:h-28 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1c1b1b] truncate group-hover:text-[#944a00] transition-colors">{flight.title}</p>
                        <p className="text-xs text-[#897365] truncate mt-1 font-medium">{flight.provider} {flight.rating && <span className="ml-1 px-1.5 py-0.5 bg-[#f6f3f2] rounded text-[10px]">★ {flight.rating}</span>}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-[#944a00] shrink-0" />
                    </div>
                    <div className="mt-3 font-mono text-lg font-bold text-[#1c1b1b]">
                      {flight.price}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Hotels */}
          {liveDeals.hotels && liveDeals.hotels.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#564337] flex items-center gap-2 uppercase tracking-wide border-b border-[#eae7e7] pb-2">
                <Building className="w-4 h-4" /> Accommodations
              </h4>
              <div className="space-y-3">
                {liveDeals.hotels.map((hotel, idx) => (
                  <a
                    key={`hotel-${idx}`}
                    href={hotel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-white border border-[#eae7e7] rounded-xl p-4 hover:border-[#944a00] hover:shadow-md transition-all sm:h-28 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1c1b1b] truncate group-hover:text-[#944a00] transition-colors">{hotel.title}</p>
                        <p className="text-xs text-[#897365] truncate mt-1 font-medium">{hotel.provider} {hotel.rating && <span className="ml-1 px-1.5 py-0.5 bg-[#f6f3f2] rounded text-[10px]">★ {hotel.rating}</span>}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-[#944a00] shrink-0" />
                    </div>
                    <div className="mt-3 font-mono text-lg font-bold text-[#1c1b1b]">
                      {hotel.price}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Offers & Coupons */}
          {liveDeals.offers && liveDeals.offers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#564337] flex items-center gap-2 uppercase tracking-wide border-b border-[#eae7e7] pb-2">
                <Tag className="w-4 h-4" /> Coupon Codes
              </h4>
              <div className="space-y-3">
                {liveDeals.offers.map((offer, idx) => (
                  <a
                    key={`offer-${idx}`}
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-[#1c1b1b] border border-[#2c2c2c] rounded-xl p-4 hover:border-[#944a00] hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between sm:h-28"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-50 truncate group-hover:text-white">{offer.title}</p>
                        <p className="text-xs text-[#897365] truncate mt-1">{offer.provider}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-500 group-hover:text-[#ffbf00] shrink-0" />
                    </div>
                    <div className="mt-3 font-mono text-xs font-bold text-[#944a00] bg-[#ffdcc5] w-fit px-2.5 py-1 rounded inline-block border border-[#944a00]/30 border-dashed uppercase tracking-widest shadow-sm">
                      {offer.code}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          </div>
        </div>
      )}
    </div>
  );
};
