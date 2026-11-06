import { toUtc, toLocalInput, safeLinks, buildPayload } from './contentUtils';

test('converts Beirut wall time to UTC without using browser timezone', () => {
  expect(toUtc('2026-11-10T10:30', 'Asia/Beirut')).toBe('2026-11-10T08:30:00.000Z');
});
test('loads stored UTC as local event time', () => {
  expect(toLocalInput('2026-11-10T08:30:00Z', 'Asia/Beirut')).toBe('2026-11-10T10:30');
});
test('rejects unsafe chat links', () => {
  expect(safeLinks([{url: 'javascript:alert(1)'}, {url: 'https://example.org', label: 'Survey'}])).toEqual([{url: 'https://example.org', label: 'Survey'}]);
});
test('retains version and turns empty optional dates into null', () => {
  const value = buildPayload({name: 'Feedback', description: 'Help', url: 'https://example.org', timeZone: 'Asia/Beirut', startsAt: '', endsAt: '', eventId: '', version: 4});
  expect(value.startsAt).toBeNull();
  expect(value.endsAt).toBeNull();
  expect(value.eventId).toBeNull();
  expect(value.version).toBe(4);
});
test('rejects nonexistent daylight saving time', () => {
  expect(() => toUtc('2026-03-29T02:30', 'Europe/Paris')).toThrow();
});
