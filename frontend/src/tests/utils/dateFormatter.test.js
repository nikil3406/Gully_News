import { formatDate, formatRelativeTime } from '../../utils/dateFormatter';

describe('date formatter utilities', () => {
  test('formats a date to a readable string', () => {
    expect(formatDate('2024-02-01T00:00:00Z')).toMatch(/2024/);
  });

  test('returns a relative time string for recent dates', () => {
    expect(formatRelativeTime(new Date().toISOString())).toContain('just now');
  });
});
