/**
 * ImportService Unit Tests
 * @module tests/unit/services/ImportService.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImportService } from '../../../src/services/ImportService.js';
import { StorageService } from '../../../src/services/StorageService.js';
import { AlbumService } from '../../../src/services/AlbumService.js';
import { PhotoService } from '../../../src/services/PhotoService.js';
import { eventBus, EVENTS } from '../../../src/utils/eventBus.js';

describe('ImportService', () => {
  let storage;
  let albumService;
  let photoService;
  let importService;

  beforeEach(async () => {
    storage = new StorageService();
    await storage.init();
    albumService = new AlbumService(storage, eventBus);
    photoService = new PhotoService(storage, albumService, eventBus);
    importService = new ImportService(albumService, photoService, eventBus);
    eventBus.clear();
    
    // Mock image processing methods since jsdom doesn't support Image loading
    vi.spyOn(importService, 'generateThumbnail').mockResolvedValue(
      new Blob(['thumbnail'], { type: 'image/jpeg' })
    );
    vi.spyOn(importService, 'getImageDimensions').mockResolvedValue({
      width: 1920,
      height: 1080
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (storage) {
      try {
        await storage.clearAllData();
      } catch {
        // Ignore
      }
      storage.close();
    }
  });

  describe('validateFile', () => {
    it('should accept valid image types', () => {
      const jpegFile = createMockFile('test.jpg', 'image/jpeg', 1024);
      const pngFile = createMockFile('test.png', 'image/png', 1024);
      const webpFile = createMockFile('test.webp', 'image/webp', 1024);
      
      expect(importService.validateFile(jpegFile).valid).toBe(true);
      expect(importService.validateFile(pngFile).valid).toBe(true);
      expect(importService.validateFile(webpFile).valid).toBe(true);
    });

    it('should reject invalid file types', () => {
      const textFile = createMockFile('test.txt', 'text/plain', 1024);
      const pdfFile = createMockFile('test.pdf', 'application/pdf', 1024);
      
      expect(importService.validateFile(textFile).valid).toBe(false);
      expect(importService.validateFile(pdfFile).valid).toBe(false);
    });

    it('should reject files that are too large', () => {
      // Create a mock File with large size using defineProperty
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 100 * 1024 * 1024);
      
      const result = importService.validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('50MB'); // Should mention max file size
    });
  });

  describe('processFile', () => {
    it('should extract file metadata', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg', 5000);
      
      const result = await importService.processFile(file);
      
      expect(result.fileName).toBe('photo.jpg');
      expect(result.fileSize).toBe(5000);
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should generate thumbnail', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg', 5000);
      
      const result = await importService.processFile(file);
      
      expect(result.thumbnail).toBeDefined();
    });

    it('should set date from file lastModified', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg', 5000);
      
      const result = await importService.processFile(file);
      
      expect(result.dateTaken).toBeDefined();
      expect(result.dateSource).toBe('file');
    });
  });

  describe('importFiles', () => {
    it('should create album and import photos', async () => {
      const files = [
        createMockFile('photo1.jpg', 'image/jpeg', 1024),
        createMockFile('photo2.jpg', 'image/jpeg', 1024)
      ];
      
      const result = await importService.importFiles(files);
      
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should group photos by month', async () => {
      const jan = createMockFile('jan.jpg', 'image/jpeg', 1024, new Date('2025-01-15'));
      const feb = createMockFile('feb.jpg', 'image/jpeg', 1024, new Date('2025-02-15'));
      
      const result = await importService.importFiles([jan, feb]);
      
      expect(result.success).toHaveLength(2);
      // Should create 2 albums for 2 different months
      const albums = await albumService.listAlbums();
      expect(albums).toHaveLength(2);
    });

    it('should report failed imports', async () => {
      const validFile = createMockFile('valid.jpg', 'image/jpeg', 1024);
      const invalidFile = createMockFile('invalid.txt', 'text/plain', 1024);
      
      const result = await importService.importFiles([validFile, invalidFile]);
      
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });

    it('should emit progress events', async () => {
      const files = [
        createMockFile('photo1.jpg', 'image/jpeg', 1024),
        createMockFile('photo2.jpg', 'image/jpeg', 1024)
      ];
      
      const progressHandler = vi.fn();
      eventBus.on(EVENTS.IMPORT_PROGRESS, progressHandler);
      
      await importService.importFiles(files);
      
      expect(progressHandler).toHaveBeenCalled();
    });

    it('should import to specific album if provided', async () => {
      const album = await albumService.createAlbum('Target Album');
      const files = [createMockFile('photo.jpg', 'image/jpeg', 1024)];
      
      const result = await importService.importFiles(files, { albumId: album.id });
      
      expect(result.success).toHaveLength(1);
      const updatedAlbum = await albumService.getAlbum(album.id);
      expect(updatedAlbum.photoCount).toBe(1);
    });
  });
});

/**
 * Helper to create mock File with size override
 */
function createMockFile(name, type, size, lastModified = new Date()) {
  const file = new File(['x'], name, { 
    type,
    lastModified: lastModified.getTime()
  });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}
