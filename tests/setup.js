/**
 * Test Setup
 * Configures test environment with mocks and utilities
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  
  // Clear IndexedDB before each test
  if (typeof indexedDB !== 'undefined') {
    indexedDB.databases?.().then(dbs => {
      dbs.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock createImageBitmap for thumbnail generation tests
if (typeof createImageBitmap === 'undefined') {
  globalThis.createImageBitmap = vi.fn().mockImplementation((source) => {
    return Promise.resolve({
      width: 1000,
      height: 800,
      close: vi.fn()
    });
  });
}

// Mock canvas for thumbnail generation
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn()
  }));
  
  HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((callback) => {
    const blob = new Blob(['mock'], { type: 'image/jpeg' });
    callback(blob);
  });
}

// Mock URL.createObjectURL and revokeObjectURL
if (typeof URL !== 'undefined') {
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  URL.revokeObjectURL = vi.fn();
}

// Test utilities
export function createMockFile(name = 'test.jpg', type = 'image/jpeg', size = 1024) {
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
}

export function createMockAlbum(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Test Album',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    coverPhotoId: null,
    displayOrder: 0,
    photoCount: 0,
    dateGroupKey: null,
    ...overrides
  };
}

export function createMockPhoto(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    albumId: 'test-album-id',
    fileName: 'test.jpg',
    fileSize: 1024,
    mimeType: 'image/jpeg',
    dateTaken: Date.now(),
    dateSource: 'file',
    width: 1000,
    height: 800,
    thumbnail: new Blob(['mock'], { type: 'image/jpeg' }),
    importedAt: Date.now(),
    ...overrides
  };
}

// Wait utility for async operations
export function waitFor(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
