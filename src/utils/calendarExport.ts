export function generateICS(itinerary: any[], destination: string, origin: string): string {
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OffGrid Travel//Itinerary Export//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:OffGrid Trip to ${destination}\n`;

  // Assume the events happen on the dates given in the itinerary
  // "Sat, Oct 10" doesn't have a year. We'll add the current year for simplicity.
  const currentYear = new Date().getFullYear();

  itinerary.forEach((day, index) => {
    // Parse "Sat, Oct 10" or similar
    const dateStr = `${day.dateStr}, ${currentYear}`;
    let baseDate = new Date(dateStr);
    
    // If parsing fails for some reason or return format changes, use a default fallback date
    if (isNaN(baseDate.getTime())) {
      // Fallback: Date.now() + index days
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + index);
    }
    
    // ISO string format without separators: YYYYMMDDTHHMMSSZ
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    day.activities.forEach((activity: any) => {
      // Very rough parsing of time "08:30 AM"
      const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
      const match = activity.time.match(timeRegex);
      
      let hours = 9;
      let minutes = 0;
      
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }

      // Create start time and an artificial end time (say +2 hours)
      const startDate = new Date(baseDate);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate.getTime());
      endDate.setHours(startDate.getHours() + 2); // default 2 hours per activity

      const startICS = formatDate(startDate);
      const endICS = formatDate(endDate);

      // Unique ID for the event
      const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@offgrid.app`;

      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDate(new Date())}
DTSTART:${startICS}
DTEND:${endICS}
SUMMARY:${escapeICSString(activity.title)}
DESCRIPTION:${escapeICSString(activity.description)}
LOCATION:${escapeICSString(destination)}
END:VEVENT\n`;
    });
  });

  icsContent += `END:VCALENDAR`;
  return icsContent;
}

function escapeICSString(str: string): string {
  if (!str) return '';
  return str.replace(/[\\;,]/g, (match) => `\\${match}`)
            .replace(/\n/g, '\\n');
}

export function downloadICS(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
