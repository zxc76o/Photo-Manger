/**
 * Date Utilities
 * @module utils/date
 */

import { DATE_GRANULARITY } from './constants.js';

/**
 * Format a date for display
 * @param {Date|number} date - Date object or timestamp
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format date for album name based on granularity
 * @param {Date|number} date - Date object or timestamp
 * @param {string} [granularity='month'] - 'day' | 'month' | 'year'
 * @returns {string}
 */
export function formatAlbumDate(date, granularity = DATE_GRANULARITY.MONTH) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  switch (granularity) {
    case DATE_GRANULARITY.DAY:
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
      
    case DATE_GRANULARITY.YEAR:
      return dateObj.getFullYear().toString();
      
    case DATE_GRANULARITY.MONTH:
    default:
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long'
      }).format(dateObj);
  }
}

/**
 * Get date group key based on granularity
 * @param {Date|number} date - Date object or timestamp
 * @param {string} [granularity='month'] - 'day' | 'month' | 'year'
 * @returns {string} - Key like "2025-01-15", "2025-01", or "2025"
 */
export function getDateGroupKey(date, granularity = DATE_GRANULARITY.MONTH) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  switch (granularity) {
    case DATE_GRANULARITY.DAY:
      return `${year}-${month}-${day}`;
      
    case DATE_GRANULARITY.YEAR:
      return `${year}`;
      
    case DATE_GRANULARITY.MONTH:
    default:
      return `${year}-${month}`;
  }
}

/**
 * Parse EXIF date string to Date object
 * EXIF format: "YYYY:MM:DD HH:MM:SS"
 * @param {string} exifDate - EXIF date string
 * @returns {Date|null}
 */
export function parseExifDate(exifDate) {
  if (!exifDate || typeof exifDate !== 'string') {
    return null;
  }
  
  // EXIF format: "YYYY:MM:DD HH:MM:SS"
  const match = exifDate.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  
  if (!match) {
    // Try alternative format: "YYYY:MM:DD"
    const dateOnlyMatch = exifDate.match(/^(\d{4}):(\d{2}):(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  }
  
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

/**
 * Get relative time string (e.g., "2 days ago")
 * @param {Date|number} date - Date object or timestamp
 * @returns {string}
 */
export function getRelativeTime(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Check if two dates are the same based on granularity
 * @param {Date|number} date1 - First date
 * @param {Date|number} date2 - Second date
 * @param {string} [granularity='day'] - Comparison granularity
 * @returns {boolean}
 */
export function isSameDate(date1, date2, granularity = DATE_GRANULARITY.DAY) {
  return getDateGroupKey(date1, granularity) === getDateGroupKey(date2, granularity);
}

/**
 * Sort dates in ascending or descending order
 * @param {Array<{dateTaken: number}>} items - Items with dateTaken property
 * @param {string} [order='asc'] - 'asc' | 'desc'
 * @returns {Array}
 */
export function sortByDate(items, order = 'asc') {
  return [...items].sort((a, b) => {
    const diff = a.dateTaken - b.dateTaken;
    return order === 'asc' ? diff : -diff;
  });
}
