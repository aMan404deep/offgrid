export const buildRouteOptimizerPrompt = (
  finalBase: string,
  finalDest: string,
  lat: number | string,
  lon: number | string,
  budgetLevel: number
): string => {
  return `You are a Geospatial Sequence Router.
Origin base: "${finalBase}".
Destination: "${finalDest}" (coordinates: ${lat}, ${lon}).
Optimize the travel routing paths for the trip:
1. Long-distance transition routes from origin to destination (e.g., flight alignments, high-way roadways, rail links) optimized for budget level ${budgetLevel}.
2. Intraday local transport options (scooter rentals, auto rickshaw rates, pre-paid private cab alignments) inside the destination.
Return ONLY structured JSON:
{
  "transitRoute": { "type": "flight/rail/drive", "detail": "Transition details from base to dest" },
  "localTransit": ["transport tip 1", "transport tip 2"]
}
Return only raw JSON.`;
};
