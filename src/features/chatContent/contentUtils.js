export function toLocalInput(value, timeZone) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

export function toUtc(value, timeZone) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Enter a valid date and time.');
  const wall = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wall)) throw new Error('Enter a valid date and time.');
  let guess = wall;
  for (let i = 0; i < 4; i += 1) {
    const displayed = Date.parse(`${toLocalInput(new Date(guess).toISOString(), timeZone)}:00Z`);
    guess += wall - displayed;
  }
  const matches = [-7200000, -3600000, 0, 3600000, 7200000]
    .map(delta => guess + delta)
    .filter(candidate => toLocalInput(new Date(candidate).toISOString(), timeZone) === value);
  if (matches.length !== 1) throw new Error('This time is skipped or repeated by a daylight-saving change. Choose an unambiguous time.');
  return new Date(matches[0]).toISOString();
}

export function safeLinks(links) {
  return (Array.isArray(links) ? links : []).filter(link => {
    try {
      const parsed = new URL(link.url);
      return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
    } catch { return false; }
  });
}

export function buildPayload(form) {
  return {
    name: form.name, description: form.description, status: form.status || 'draft',
    isCancelled: Boolean(form.isCancelled), location: form.location || null,
    url: form.url || null, timeZone: form.timeZone,
    startsAt: toUtc(form.startsAt, form.timeZone), endsAt: toUtc(form.endsAt, form.timeZone),
    eventId: form.eventId ? Number(form.eventId) : null, version: form.version || null,
  };
}
export function formFromRecord(record) {
  return {...record, startsAt: toLocalInput(record.startsAt, record.timeZone),
    endsAt: toLocalInput(record.endsAt, record.timeZone), eventId: record.eventId || '', url: record.url || '', location: record.location || ''};
}
