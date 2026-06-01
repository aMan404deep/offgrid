import React, { useEffect } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { Plane, Building, Tag, ExternalLink, Loader2, Sparkles, CloudSun, Shield } from "lucide-react";

export const LiveDealsCard: React.FC = () => {
  const { currentTripLocation, liveDeals, isFetchingDeals, fetchLiveDeals } = useLeaveStore();

  const handleFetchDeals = () => {
    fetchLiveDeals(currentTripLocation);
  };

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
          className="shrink-0 flex w-full md:w-auto items-center justify-center gap-2 bg-[#1c1b1b] text-white text-sm font-bold py-2.5 px-5 rounded-xl hover:bg-[#2c2c2e] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingDeals ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Fetch Deals for {currentTripLocation}
        </button>
      </div>

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
