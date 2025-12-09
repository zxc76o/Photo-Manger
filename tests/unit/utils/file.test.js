/**
 * File Utilities Tests
 * @module tests/unit/utils/file.test
 */

import { describe, it, expect, vi } from 'vitest';
import {
  generateUUID,
  validateImageType,
  getFileExtension,
  getMimeType,
  formatFileSize,
  checkFileAPISupport
} from '../../../src/utils/file.js';

describe('File Utilities', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });
  });

  describe('validateImageType', () => {
    function createMockFile(name, type, size = 1024) {
      return new File(['test'], name, { type });
    }

    it('should accept valid JPEG file', () => {
      const file = createMockFile('test.jpg', 'image/jpeg');
      const result = validateImageType(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = createMockFile('test.png', 'image/png');
      const result = validateImageType(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid WebP file', () => {
      const file = createMockFile('test.webp', 'image/webp');
      const result = validateImageType(file);
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported format', () => {
      const file = createMockFile('test.bmp', 'image/bmp');
      const result = validateImageType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported');
    });

    it('should reject invalid file', () => {
      const result = validateImageType(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid file');
    });

    it('should reject oversized files', () => {
      // Create a mock file object with large size
      const largeFile = {
        name: 'large.jpg',
        type: 'image/jpeg',
        size: 100 * 1024 * 1024 // 100MB
      };
      Object.setPrototypeOf(largeFile, File.prototype);
      
      const result = validateImageType(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum size');
    });
  });

  describe('getFileExtension', () => {
    it('should extract lowercase extension', () => {
      expect(getFileExtension('photo.JPG')).toBe('jpg');
      expect(getFileExtension('image.PNG')).toBe('png');
    });

    it('should handle no extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(getFileExtension(null)).toBe('');
      expect(getFileExtension(undefined)).toBe('');
    });

    it('should handle multiple dots', () => {
      expect(getFileExtension('file.name.jpg')).toBe('jpg');
    });

    it('should handle trailing dot', () => {
      expect(getFileExtension('file.')).toBe('');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for common extensions', () => {
      expect(getMimeType('jpg')).toBe('image/jpeg');
      expect(getMimeType('jpeg')).toBe('image/jpeg');
      expect(getMimeType('png')).toBe('image/png');
      expect(getMimeType('gif')).toBe('image/gif');
      expect(getMimeType('webp')).toBe('image/webp');
      expect(getMimeType('heic')).toBe('image/heic');
    });

    it('should be case-insensitive', () => {
      expect(getMimeType('JPG')).toBe('image/jpeg');
      expect(getMimeType('PNG')).toBe('image/png');
    });

    it('should return null for unknown extensions', () => {
      expect(getMimeType('unknown')).toBeNull();
      expect(getMimeType('bmp')).toBeNull();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should respect decimal places', () => {
      // parseFloat removes trailing zeros, so 1.50 becomes 1.5
      expect(formatFileSize(1536, 2)).toBe('1.5 KB');
      expect(formatFileSize(1536, 0)).toBe('2 KB');
    });
  });

  describe('checkFileAPISupport', () => {
    it('should return supported in modern environment', () => {
      const result = checkFileAPISupport();
      expect(result.supported).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });
});
