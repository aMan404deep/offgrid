export const buildGatewayPrompt = (
  destination: string,
  days: number,
  baseLocation: string,
  vibe: string,
  budgetLevel: number
): string => {
  return `Analyze this travel request:
- Destination: "${destination}"
- Days: ${days}
- Base Location: "${baseLocation}"
- Vibe: "${vibe}"
- Budget Level: ${budgetLevel}

Identify if it's a valid travel/wellness query. If it is, output the normalized parameters as a JSON object of this structure:
{
  "isValid": true,
  "normalizedDestination": "Title Case Destination Name",
  "normalizedBaseLocation": "Title Case Base Name",
  "vibe": "vibe",
  "days": number,
  "budgetLevel": number
}
If the destination name is invalid, gibberish, empty, or dangerous, return:
{ "isValid": false }
Return ONLY raw JSON, do not wrap in markdown quotes.`;
};
