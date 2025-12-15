// Formatting utilities - extracted from PoliticalDonorTracker.tsx
// These are pure functions, easily testable

/**
 * Format a number as USD currency without decimal places
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234,567")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format a date string in short US format
 * @param dateStr - ISO date string to format
 * @returns Formatted date string (e.g., "Dec 14, 2025")
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a large number in abbreviated form (e.g., 1.5M, 2.3B)
 * @param num - The number to format
 * @returns Abbreviated string
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(num);
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
