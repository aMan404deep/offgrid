import React, { useEffect } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { Plane, Building, Tag, ExternalLink, Loader2, Sparkles, CloudSun, Shield } from "lucide-react";

export const LiveDealsCard: React.FC = () => {
  const { currentTripLocation, liveDeals, isFetchingDeals, fetchLiveDeals } = useLeaveStore();

  const handleFetchDeals = () => {
    fetchLiveDeals(currentTripLocation);
  };

  return (
    <div className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm p-6 mt-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-[#1c1b1b] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#944a00]" />
            Live Bookings & Offers
          </h3>
          <p className="text-[11px] text-[#564337] mt-0.5">
            Real-time scraped deals compared securely across legit travel websites.
          </p>
        </div>
        <button
          onClick={handleFetchDeals}
          disabled={isFetchingDeals}
          className="shrink-0 flex items-center justify-center gap-2 bg-[#1c1b1b] text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-[#2c2c2e] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingDeals ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Fetch Deals for {currentTripLocation}
        </button>
      </div>

      {!liveDeals && !isFetchingDeals && (
        <div className="py-8 text-center text-[#897365] bg-[#eae7e7]/30 rounded-xl border border-dashed border-[#eae7e7]">
          <p className="text-xs font-medium">Click "Fetch Deals" to run the search across verified platforms.</p>
        </div>
      )}

      {isFetchingDeals && (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-[#944a00] animate-spin" />
          <p className="text-xs font-mono text-[#897365] animate-pulse">Running live comparison algorithms...</p>
        </div>
      )}

      {liveDeals && !isFetchingDeals && (
        <div className="space-y-6">
          {/* Weather & Safety Context */}
          {(liveDeals.weather || liveDeals.safety) && (
            <div className="flex flex-col md:flex-row gap-4 bg-[#f8f6f5] rounded-xl p-4 border border-[#eae7e7] text-xs">
              {liveDeals.weather && (
                <div className="flex-1 flex gap-3 items-start">
                  <CloudSun className="w-4 h-4 text-[#944a00] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1c1b1b] block mb-0.5">Current Weather Outlook</span>
                    <span className="text-[#564337] leading-relaxed">{liveDeals.weather}</span>
                  </div>
                </div>
              )}
              {liveDeals.weather && liveDeals.safety && (
                <div className="hidden md:block w-px bg-[#eae7e7] self-stretch mx-2" />
              )}
              {liveDeals.safety && (
                <div className="flex-1 flex gap-3 items-start">
                  <Shield className="w-4 h-4 text-[#00b05c] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1c1b1b] block mb-0.5">Travel Safety Advisory</span>
                    <span className="text-[#564337] leading-relaxed">{liveDeals.safety}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Flights */}
          {liveDeals.flights && liveDeals.flights.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#564337] flex items-center gap-1.5 uppercase tracking-wide">
                <Plane className="w-3.5 h-3.5" /> Flights
              </h4>
              <div className="space-y-2">
                {liveDeals.flights.map((flight, idx) => (
                  <a
                    key={`flight-${idx}`}
                    href={flight.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-[#fdfdfd] border border-[#eae7e7] rounded-xl p-3 hover:border-[#944a00] hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1c1b1b] truncate group-hover:text-[#944a00] transition-colors">{flight.title}</p>
                        <p className="text-[10px] text-[#897365] truncate mt-0.5">{flight.provider} {flight.rating && `• ${flight.rating}`}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#944a00] shrink-0" />
                    </div>
                    <div className="mt-2 font-mono text-sm font-bold text-[#1c1b1b]">
                      {flight.price}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Hotels */}
          {liveDeals.hotels && liveDeals.hotels.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#564337] flex items-center gap-1.5 uppercase tracking-wide">
                <Building className="w-3.5 h-3.5" /> Accommodations
              </h4>
              <div className="space-y-2">
                {liveDeals.hotels.map((hotel, idx) => (
                  <a
                    key={`hotel-${idx}`}
                    href={hotel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-[#fdfdfd] border border-[#eae7e7] rounded-xl p-3 hover:border-[#944a00] hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1c1b1b] truncate group-hover:text-[#944a00] transition-colors">{hotel.title}</p>
                        <p className="text-[10px] text-[#897365] truncate mt-0.5">{hotel.provider} {hotel.rating && `• ${hotel.rating}`}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#944a00] shrink-0" />
                    </div>
                    <div className="mt-2 font-mono text-sm font-bold text-[#1c1b1b]">
                      {hotel.price}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Offers & Coupons */}
          {liveDeals.offers && liveDeals.offers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#564337] flex items-center gap-1.5 uppercase tracking-wide">
                <Tag className="w-3.5 h-3.5" /> Coupon Codes
              </h4>
              <div className="space-y-2">
                {liveDeals.offers.map((offer, idx) => (
                  <a
                    key={`offer-${idx}`}
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-stone-900 border border-stone-800 rounded-xl p-3 hover:border-[#944a00] hover:shadow-sm transition-all flex flex-col justify-between h-[84px]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-50 truncate">{offer.title}</p>
                        <p className="text-[10px] text-stone-400 truncate mt-0.5">{offer.provider}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-[#ffbf00] shrink-0" />
                    </div>
                    <div className="mt-1 font-mono text-[10px] font-bold text-[#944a00] bg-[#ffdcc5] w-fit px-2 py-0.5 rounded border border-[#944a00]/30 border-dashed">
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
