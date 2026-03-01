interface CalendarProperty {
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  showing_time?: string | null;
  agent_notes?: string | null;
}

interface CalendarSession {
  title: string;
  session_date: string; // YYYY-MM-DD
  client_name: string;
}

function formatICSDate(dateStr: string, timeStr: string): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function fullAddress(p: CalendarProperty): string {
  const parts = [p.address];
  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.zip_code) parts.push(p.zip_code);
  return parts.join(', ');
}

function propertyDescription(p: CalendarProperty): string {
  const lines: string[] = [];
  if (p.price) lines.push(`Price: $${p.price.toLocaleString()}`);
  const details: string[] = [];
  if (p.beds) details.push(`${p.beds} bed`);
  if (p.baths) details.push(`${p.baths} bath`);
  if (p.sqft) details.push(`${p.sqft.toLocaleString()} sqft`);
  if (details.length) lines.push(details.join(' / '));
  if (p.agent_notes) lines.push(`Notes: ${p.agent_notes}`);
  return lines.join('\\n');
}

export function generateSessionICS(
  session: CalendarSession,
  properties: CalendarProperty[]
): void {
  const propertiesWithTime = properties.filter(p => p.showing_time);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HomeFolio//Showing Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@home-folio.net`;

  if (propertiesWithTime.length > 0) {
    // One event per property with a showing time
    for (const prop of propertiesWithTime) {
      const dtStart = formatICSDate(session.session_date, prop.showing_time!);
      const endTime = addMinutes(prop.showing_time!, 30);
      const dtEnd = formatICSDate(session.session_date, endTime);

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid()}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeICS(`Showing: ${prop.address}`)}`,
        `LOCATION:${escapeICS(fullAddress(prop))}`,
        `DESCRIPTION:${escapeICS(`${session.title} - ${session.client_name}\\n${propertyDescription(prop)}`)}`,
        'END:VEVENT'
      );
    }
  } else {
    // No showing times — create a single all-day event
    const [year, month, day] = session.session_date.split('-');
    const dtStart = `${year}${month}${day}`;
    const allAddresses = properties.map(p => `- ${fullAddress(p)}`).join('\\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `SUMMARY:${escapeICS(`${session.title} - ${session.client_name}`)}`,
      `DESCRIPTION:${escapeICS(`Properties:\\n${allAddresses}`)}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  // Download the file
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateGoogleCalendarURL(
  session: CalendarSession,
  properties: CalendarProperty[]
): string {
  const propertiesWithTime = properties.filter(p => p.showing_time);

  let dates: string;
  let location = '';
  let details: string;

  if (propertiesWithTime.length > 0) {
    // Use first and last showing times for the event window
    const sorted = [...propertiesWithTime].sort((a, b) =>
      (a.showing_time || '').localeCompare(b.showing_time || '')
    );
    const firstTime = sorted[0].showing_time!;
    const lastTime = sorted[sorted.length - 1].showing_time!;
    const endTime = addMinutes(lastTime, 30);

    const dtStart = formatICSDate(session.session_date, firstTime);
    const dtEnd = formatICSDate(session.session_date, endTime);
    dates = `${dtStart}/${dtEnd}`;
    location = fullAddress(sorted[0]);

    const propLines = sorted.map(p => {
      const parts = [`${p.showing_time} - ${fullAddress(p)}`];
      if (p.price) parts.push(`$${p.price.toLocaleString()}`);
      return parts.join(' | ');
    });
    details = `Client: ${session.client_name}\n\n${propLines.join('\n')}`;
  } else {
    // All-day event
    const [year, month, day] = session.session_date.split('-');
    const dateOnly = `${year}${month}${day}`;
    dates = `${dateOnly}/${dateOnly}`;
    location = properties.length > 0 ? fullAddress(properties[0]) : '';

    const propLines = properties.map(p => `- ${fullAddress(p)}`);
    details = `Client: ${session.client_name}\n\n${propLines.join('\n')}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${session.title} - ${session.client_name}`,
    dates,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
