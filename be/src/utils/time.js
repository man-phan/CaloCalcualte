/**
 * Minimal timezone helpers that avoid heavy dependencies.
 * Uses Intl.DateTimeFormat (built-in Node.js) for timezone conversion.
 */

/**
 * Returns a Date object representing the same instant in the given timezone.
 * (The underlying UTC value is unchanged — we only use the local parts for range calculation.)
 */
export function toZonedTime(date, timezone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  // Construct a local-time string and parse as UTC to get a "fake local" Date
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  );
}

/**
 * Returns UTC Date for the start of the local day (00:00:00) in the given timezone.
 */
export function startOfDay(localDate, timezone) {
  return localToUtc(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0,
    timezone
  );
}

/**
 * Returns UTC Date for the end of the local day (23:59:59.999) in the given timezone.
 */
export function endOfDay(localDate, timezone) {
  return localToUtc(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    23, 59, 59,
    timezone
  );
}

function localToUtc(year, month, day, h, m, s, timezone) {
  // Create a string in ISO format and force interpretation in the given timezone via Intl
  const localStr = `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // Use Temporal-polyfill-free trick: find offset by comparing UTC vs local representation
  const probe = new Date(`${localStr}Z`); // treat as UTC first
  const localAtProbe = toZonedTime(probe, timezone);
  const diff = probe.getTime() - localAtProbe.getTime(); // offset in ms
  return new Date(new Date(`${localStr}Z`).getTime() + diff);
}
