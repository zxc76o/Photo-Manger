/**
 * Import Flow Integration Tests
 * @module tests/integration/import-flow.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../../src/services/StorageService.js';
import { AlbumService } from '../../src/services/AlbumService.js';
import { PhotoService } from '../../src/services/PhotoService.js';
import { ImportService } from '../../src/services/ImportService.js';
import { DropZone } from '../../src/components/DropZone.js';
import { ImportProgress } from '../../src/components/ImportProgress.js';
import { eventBus, EVENTS } from '../../src/utils/eventBus.js';

describe('Import Flow Integration', () => {
  let container;
  let storage;
  let albumService;
  let photoService;
  let importService;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    eventBus.clear();
    
    storage = new StorageService();
    await storage.init();
    albumService = new AlbumService(storage, eventBus);
    photoService = new PhotoService(storage, albumService, eventBus);
    importService = new ImportService(albumService, photoService, eventBus);
    
    // Mock image processing methods
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
    eventBus.clear();
    document.body.removeChild(container);
    if (storage) {
      try {
        await storage.clearAllData();
      } catch {
        // Ignore
      }
      storage.close();
    }
  });

  describe('DropZone and ImportService integration', () => {
    it('should import files dropped on DropZone', async () => {
      // Create DropZone
      const dropZone = new DropZone();
      const dropZoneElement = dropZone.render();
      container.appendChild(dropZoneElement);
      
      // Set up file handler
      let receivedFiles = [];
      dropZone.onFiles((files) => {
        receivedFiles = files;
      });
      
      // Create mock file
      const mockFile = new File(['test content'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 });
      
      // Simulate drop
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = { files: [mockFile] };
      event.preventDefault = vi.fn();
      dropZoneElement.dispatchEvent(event);
      
      expect(receivedFiles).toHaveLength(1);
      expect(receivedFiles[0].name).toBe('photo.jpg');
      
      // Import the files
      const result = await importService.importFiles(receivedFiles);
      
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      
      // Verify album was created
      const albums = await albumService.listAlbums();
      expect(albums).toHaveLength(1);
      
      // Verify photo was added
      const photos = await photoService.getPhotosByAlbum(albums[0].id);
      expect(photos).toHaveLength(1);
    });

    it('should group imports by month into albums', async () => {
      const jan = createMockFile('jan.jpg', 'image/jpeg', 1024, new Date('2025-01-15'));
      const feb = createMockFile('feb.jpg', 'image/jpeg', 1024, new Date('2025-02-15'));
      const jan2 = createMockFile('jan2.jpg', 'image/jpeg', 1024, new Date('2025-01-20'));
      
      const result = await importService.importFiles([jan, feb, jan2]);
      
      expect(result.success).toHaveLength(3);
      
      const albums = await albumService.listAlbums();
      expect(albums).toHaveLength(2); // January and February
      
      // Find January album
      const janAlbum = albums.find(a => a.name.includes('January'));
      expect(janAlbum).toBeDefined();
      expect(janAlbum.photoCount).toBe(2);
      
      // Find February album
      const febAlbum = albums.find(a => a.name.includes('February'));
      expect(febAlbum).toBeDefined();
      expect(febAlbum.photoCount).toBe(1);
    });

    it('should import to specific album when albumId provided', async () => {
      // Create target album
      const album = await albumService.createAlbum('Vacation');
      
      const file = createMockFile('beach.jpg', 'image/jpeg', 1024);
      
      const result = await importService.importFiles([file], { albumId: album.id });
      
      expect(result.success).toHaveLength(1);
      
      // Verify photo is in correct album
      const photos = await photoService.getPhotosByAlbum(album.id);
      expect(photos).toHaveLength(1);
      
      // Verify album was updated
      const updatedAlbum = await albumService.getAlbum(album.id);
      expect(updatedAlbum.photoCount).toBe(1);
    });
  });

  describe('ImportProgress integration', () => {
    it('should show and update progress during import', async () => {
      const progress = new ImportProgress(eventBus);
      const progressElement = progress.render();
      container.appendChild(progressElement);
      
      // Track progress updates
      const progressUpdates = [];
      eventBus.on(EVENTS.IMPORT_PROGRESS, (data) => {
        progressUpdates.push(data);
      });
      
      // Show progress
      progress.show();
      expect(progressElement.classList.contains('import-progress--hidden')).toBe(false);
      
      // Import files
      const files = [
        createMockFile('photo1.jpg', 'image/jpeg', 1024),
        createMockFile('photo2.jpg', 'image/jpeg', 1024),
        createMockFile('photo3.jpg', 'image/jpeg', 1024)
      ];
      
      await importService.importFiles(files);
      
      // Verify progress was reported
      expect(progressUpdates).toHaveLength(3);
      expect(progressUpdates[0].current).toBe(1);
      expect(progressUpdates[0].total).toBe(3);
      expect(progressUpdates[2].current).toBe(3);
    });

    it('should emit complete event when done', async () => {
      const progress = new ImportProgress(eventBus);
      const progressElement = progress.render();
      container.appendChild(progressElement);
      
      const completeHandler = vi.fn();
      eventBus.on(EVENTS.IMPORT_COMPLETE, completeHandler);
      
      progress.show();
      
      const files = [createMockFile('photo.jpg', 'image/jpeg', 1024)];
      await importService.importFiles(files);
      
      expect(completeHandler).toHaveBeenCalled();
      expect(progressElement.classList.contains('import-progress--complete')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should report failed imports without stopping batch', async () => {
      const validFile = createMockFile('valid.jpg', 'image/jpeg', 1024);
      const invalidFile = createMockFile('invalid.txt', 'text/plain', 1024);
      const validFile2 = createMockFile('valid2.jpg', 'image/jpeg', 1024);
      
      const result = await importService.importFiles([validFile, invalidFile, validFile2]);
      
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].reason).toContain('Unsupported');
    });

    it('should reject oversized files', async () => {
      const largeFile = createMockFile('huge.jpg', 'image/jpeg', 60 * 1024 * 1024); // 60MB
      
      const result = await importService.importFiles([largeFile]);
      
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].reason).toContain('50MB');
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
