export const buildWeatherAnalystPrompt = (
  lat: number | string,
  lon: number | string,
  rawWeatherData: any,
  finalDest: string,
  resolvedDays: number,
  vibe: string
): string => {
  return `You are a professional Meteorology & Environmental Analyst.
Given Raw Weather Forecast for latitude/longitude: ${lat}/${lon}:
${rawWeatherData ? JSON.stringify(rawWeatherData.daily || rawWeatherData) : "No raw data available"}
Analyze this forecast for destination: "${finalDest}" over a period of ${resolvedDays} days. 
Determine:
1. Overall climatology (sunny, rainy, sub-zero, humid, chilly etc.).
2. Vibe compatibility: is it suitable for a '${vibe}' travel itinerary?
3. Daily direct weather summaries and actionable micro-directives (e.g. bring warm liners, pack umbrellas, optimal morning trek windows).
Output ONLY brief, high-impact information in a structured JSON schema:
{
  "summary": "climatology summary",
  "vibeSuitability": "rating out of 5",
  "directives": ["directive 1", "directive 2", "directive 3"]
}
Do not write conversational introductory text. Output valid raw JSON.`;
};
