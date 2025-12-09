/**
 * Date Utilities Tests
 * @module tests/unit/utils/date.test
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatAlbumDate,
  getDateGroupKey,
  parseExifDate,
  getRelativeTime,
  isSameDate,
  sortByDate
} from '../../../src/utils/date.js';
import { DATE_GRANULARITY } from '../../../src/utils/constants.js';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format a Date object', () => {
      const date = new Date(2025, 0, 15); // January 15, 2025
      const result = formatDate(date);
      expect(result).toContain('2025');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    it('should format a timestamp', () => {
      const timestamp = new Date(2025, 5, 20).getTime();
      const result = formatDate(timestamp);
      expect(result).toContain('2025');
      expect(result).toContain('June');
    });

    it('should accept custom options', () => {
      const date = new Date(2025, 0, 15);
      const result = formatDate(date, { month: 'short' });
      expect(result).toContain('Jan');
    });
  });

  describe('formatAlbumDate', () => {
    const date = new Date(2025, 0, 15);

    it('should format by day', () => {
      const result = formatAlbumDate(date, DATE_GRANULARITY.DAY);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should format by month (default)', () => {
      const result = formatAlbumDate(date);
      expect(result).toContain('January');
      expect(result).toContain('2025');
      expect(result).not.toContain('15');
    });

    it('should format by year', () => {
      const result = formatAlbumDate(date, DATE_GRANULARITY.YEAR);
      expect(result).toBe('2025');
    });
  });

  describe('getDateGroupKey', () => {
    const date = new Date(2025, 0, 15);

    it('should generate day key', () => {
      const result = getDateGroupKey(date, DATE_GRANULARITY.DAY);
      expect(result).toBe('2025-01-15');
    });

    it('should generate month key (default)', () => {
      const result = getDateGroupKey(date);
      expect(result).toBe('2025-01');
    });

    it('should generate year key', () => {
      const result = getDateGroupKey(date, DATE_GRANULARITY.YEAR);
      expect(result).toBe('2025');
    });

    it('should pad month and day with zeros', () => {
      const singleDigitDate = new Date(2025, 0, 5);
      expect(getDateGroupKey(singleDigitDate, DATE_GRANULARITY.DAY)).toBe('2025-01-05');
    });
  });

  describe('parseExifDate', () => {
    it('should parse standard EXIF format', () => {
      const result = parseExifDate('2025:01:15 14:30:45');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should parse date-only format', () => {
      const result = parseExifDate('2025:01:15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
    });

    it('should return null for invalid format', () => {
      expect(parseExifDate('invalid')).toBeNull();
      expect(parseExifDate('')).toBeNull();
      expect(parseExifDate(null)).toBeNull();
      expect(parseExifDate(undefined)).toBeNull();
    });
  });

  describe('getRelativeTime', () => {
    it('should return "Today" for current date', () => {
      const result = getRelativeTime(new Date());
      expect(result).toBe('Today');
    });

    it('should return "Yesterday" for one day ago', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = getRelativeTime(yesterday);
      expect(result).toBe('Yesterday');
    });

    it('should return days for recent dates', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = getRelativeTime(threeDaysAgo);
      expect(result).toBe('3 days ago');
    });

    it('should return weeks for dates within a month', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const result = getRelativeTime(twoWeeksAgo);
      expect(result).toBe('2 weeks ago');
    });
  });

  describe('isSameDate', () => {
    it('should compare by day', () => {
      const date1 = new Date(2025, 0, 15, 10, 0);
      const date2 = new Date(2025, 0, 15, 20, 0);
      const date3 = new Date(2025, 0, 16, 10, 0);
      
      expect(isSameDate(date1, date2, DATE_GRANULARITY.DAY)).toBe(true);
      expect(isSameDate(date1, date3, DATE_GRANULARITY.DAY)).toBe(false);
    });

    it('should compare by month', () => {
      const date1 = new Date(2025, 0, 15);
      const date2 = new Date(2025, 0, 20);
      const date3 = new Date(2025, 1, 15);
      
      expect(isSameDate(date1, date2, DATE_GRANULARITY.MONTH)).toBe(true);
      expect(isSameDate(date1, date3, DATE_GRANULARITY.MONTH)).toBe(false);
    });
  });

  describe('sortByDate', () => {
    const items = [
      { dateTaken: new Date(2025, 2, 1).getTime() },
      { dateTaken: new Date(2025, 0, 1).getTime() },
      { dateTaken: new Date(2025, 1, 1).getTime() }
    ];

    it('should sort ascending by default', () => {
      const sorted = sortByDate(items);
      expect(sorted[0].dateTaken).toBeLessThan(sorted[1].dateTaken);
      expect(sorted[1].dateTaken).toBeLessThan(sorted[2].dateTaken);
    });

    it('should sort descending when specified', () => {
      const sorted = sortByDate(items, 'desc');
      expect(sorted[0].dateTaken).toBeGreaterThan(sorted[1].dateTaken);
      expect(sorted[1].dateTaken).toBeGreaterThan(sorted[2].dateTaken);
    });

    it('should not mutate original array', () => {
      const original = [...items];
      sortByDate(items);
      expect(items).toEqual(original);
    });
  });
});
