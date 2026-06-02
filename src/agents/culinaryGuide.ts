export const buildCulinaryGuidePrompt = (
  finalDest: string,
  vibe: string,
  budgetLevel: number
): string => {
  return `You are an elite Michelin-starred Culinary Guide. 
Develop a curated gastronomy guide for "${finalDest}" catering to a budget level of ${budgetLevel} (1=budget street food/local dhabas, 2=mid-range bistros/cozy gardens, 3=luxury fine dining/spectacular view reservation venues) and matching a vibe of '${vibe}'.
Recommend 3-4 top food establishments, signature local dishes to sample, and coffee lounges.
Return ONLY structured JSON:
{
  "culinaryHotspots": [
    { "establishmentName": "Name", "specialty": "Traditional signature dish", "description": "Atmospheric review", "priceRange": "₹/₹₹/₹₹₹" }
  ]
}
Return only raw JSON.`;
};
