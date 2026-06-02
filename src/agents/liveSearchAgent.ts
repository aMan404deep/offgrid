export const buildLiveSearchAgentPrompt = (
  resolvedOrigin: string,
  resolvedDestination: string,
  dates: string,
  budgetLevel: number
): string => {
  const budgetTierText = budgetLevel === 3 ? "Luxury / Elite five-star experience" : budgetLevel === 1 ? "Budget / Economy experience" : "Standard / Mid-Range experience";
  
  return `You are a Live Travel API. Find current, real-world deals for flights and hotels traveling from ${resolvedOrigin} to ${resolvedDestination} for ${dates} catering to a ${budgetTierText}.
Search for legitimate travel websites (MakeMyTrip, Booking.com, Agoda, Skyscanner, Kayak, etc.).
Also find general travel coupon codes that are currently active in India (like MMTFLY, GOIBIBO etc).
Find the current upcoming weather and a brief safety tip for ${resolvedDestination}.
    
Return EXACTLY a JSON object with this structure (no markdown, just JSON):
{
  "flights": [ { "title": "Flight Name/Route", "provider": "Website Name", "price": "Price in ₹", "url": "Actual URL to book", "rating": "Rating or review count" } ],
  "hotels": [ { "title": "Hotel Name", "provider": "Platform", "price": "Price/night", "url": "Actual URL to book", "rating": "Out of 5" } ],
  "offers": [ { "title": "Discount info", "provider": "Platform", "code": "COUPONCODE", "url": "URL to apply" } ],
  "weather": "25°C, Partly Cloudy, Best time to visit...",
  "safety": "General safety advisory..."
}
Be sure to include actual URLs (links) from your search results. Limit to top 3 for each category.`;
};
