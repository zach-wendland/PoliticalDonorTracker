import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatLargeNumber, truncateText } from './formatting';

describe('formatCurrency', () => {
  it('formats positive numbers as USD', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats negative numbers', () => {
    expect(formatCurrency(-5000)).toBe('-$5,000');
  });

  it('rounds to whole numbers', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
  });

  it('handles very large numbers', () => {
    expect(formatCurrency(1000000000)).toBe('$1,000,000,000');
  });
});

describe('formatDate', () => {
  it('formats ISO date string to short US format', () => {
    // Use full ISO format to avoid timezone issues
    const result = formatDate('2025-12-14T12:00:00');
    expect(result).toMatch(/Dec \d+, 2025/);
  });

  it('formats date with time component', () => {
    const result = formatDate('2025-01-15T12:00:00');
    expect(result).toMatch(/Jan \d+, 2025/);
  });

  it('handles different months', () => {
    const result = formatDate('2025-06-15T12:00:00');
    expect(result).toMatch(/Jun \d+, 2025/);
  });
});

describe('formatLargeNumber', () => {
  it('formats billions', () => {
    expect(formatLargeNumber(1500000000)).toBe('$1.5B');
  });

  it('formats millions', () => {
    expect(formatLargeNumber(2300000)).toBe('$2.3M');
  });

  it('formats thousands', () => {
    expect(formatLargeNumber(5000)).toBe('$5.0K');
  });

  it('formats small numbers as currency', () => {
    expect(formatLargeNumber(500)).toBe('$500');
  });
});

describe('truncateText', () => {
  it('does not truncate short text', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates long text with ellipsis', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });

  it('handles exact length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(truncateText('', 5)).toBe('');
  });
});
