/**
 * PhotoService Unit Tests
 * @module tests/unit/services/PhotoService.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhotoService } from '../../../src/services/PhotoService.js';
import { StorageService } from '../../../src/services/StorageService.js';
import { AlbumService } from '../../../src/services/AlbumService.js';
import { eventBus, EVENTS } from '../../../src/utils/eventBus.js';

describe('PhotoService', () => {
  let storage;
  let albumService;
  let photoService;
  let testAlbum;

  beforeEach(async () => {
    storage = new StorageService();
    await storage.init();
    albumService = new AlbumService(storage, eventBus);
    photoService = new PhotoService(storage, albumService, eventBus);
    eventBus.clear();
    
    // Create a test album
    testAlbum = await albumService.createAlbum('Test Album', '2025-01');
  });

  afterEach(async () => {
    if (storage) {
      try {
        await storage.clearAllData();
      } catch {
        // Ignore
      }
      storage.close();
    }
  });

  describe('getPhotosByAlbum', () => {
    it('should return empty array when album has no photos', async () => {
      const photos = await photoService.getPhotosByAlbum(testAlbum.id);
      expect(photos).toEqual([]);
    });

    it('should return all photos for an album', async () => {
      // Add test photos
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('photo1.jpg'));
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('photo2.jpg'));
      
      const photos = await photoService.getPhotosByAlbum(testAlbum.id);
      expect(photos).toHaveLength(2);
    });

    it('should return photos sorted by date taken descending', async () => {
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('old.jpg', Date.now() - 100000));
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('new.jpg', Date.now()));
      
      const photos = await photoService.getPhotosByAlbum(testAlbum.id, 'date-desc');
      expect(photos[0].fileName).toBe('new.jpg');
      expect(photos[1].fileName).toBe('old.jpg');
    });

    it('should return photos sorted by date taken ascending', async () => {
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('old.jpg', Date.now() - 100000));
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('new.jpg', Date.now()));
      
      const photos = await photoService.getPhotosByAlbum(testAlbum.id, 'date-asc');
      expect(photos[0].fileName).toBe('old.jpg');
      expect(photos[1].fileName).toBe('new.jpg');
    });
  });

  describe('getPhoto', () => {
    it('should return photo by ID', async () => {
      const added = await photoService.addPhoto(testAlbum.id, createMockPhotoData('test.jpg'));
      
      const photo = await photoService.getPhoto(added.id);
      expect(photo).not.toBeNull();
      expect(photo.fileName).toBe('test.jpg');
    });

    it('should return null for non-existent photo', async () => {
      const photo = await photoService.getPhoto('non-existent');
      expect(photo).toBeNull();
    });
  });

  describe('addPhoto', () => {
    it('should add photo to album', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('new.jpg'));
      
      expect(photo.id).toBeDefined();
      expect(photo.albumId).toBe(testAlbum.id);
      expect(photo.fileName).toBe('new.jpg');
    });

    it('should increment album photo count', async () => {
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('photo1.jpg'));
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('photo2.jpg'));
      
      const album = await albumService.getAlbum(testAlbum.id);
      expect(album.photoCount).toBe(2);
    });

    it('should set first photo as album cover', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('first.jpg'));
      
      const album = await albumService.getAlbum(testAlbum.id);
      expect(album.coverPhotoId).toBe(photo.id);
    });

    it('should emit photo:added event', async () => {
      const handler = vi.fn();
      eventBus.on(EVENTS.PHOTO_ADDED, handler);
      
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('event.jpg'));
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo from album', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('delete.jpg'));
      
      await photoService.deletePhoto(photo.id);
      
      const found = await photoService.getPhoto(photo.id);
      expect(found).toBeNull();
    });

    it('should decrement album photo count', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('delete.jpg'));
      await photoService.deletePhoto(photo.id);
      
      const album = await albumService.getAlbum(testAlbum.id);
      expect(album.photoCount).toBe(0);
    });

    it('should emit photo:deleted event', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('delete.jpg'));
      const handler = vi.fn();
      eventBus.on(EVENTS.PHOTO_DELETED, handler);
      
      await photoService.deletePhoto(photo.id);
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('movePhoto', () => {
    it('should move photo to another album', async () => {
      const targetAlbum = await albumService.createAlbum('Target Album');
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('move.jpg'));
      
      await photoService.movePhoto(photo.id, targetAlbum.id);
      
      const moved = await photoService.getPhoto(photo.id);
      expect(moved.albumId).toBe(targetAlbum.id);
    });

    it('should update photo counts for both albums', async () => {
      const targetAlbum = await albumService.createAlbum('Target Album');
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('move.jpg'));
      
      await photoService.movePhoto(photo.id, targetAlbum.id);
      
      const source = await albumService.getAlbum(testAlbum.id);
      const target = await albumService.getAlbum(targetAlbum.id);
      expect(source.photoCount).toBe(0);
      expect(target.photoCount).toBe(1);
    });
  });
});

/**
 * Helper to create mock photo data
 */
function createMockPhotoData(fileName, dateTaken = Date.now()) {
  return {
    fileName,
    fileSize: 1024,
    mimeType: 'image/jpeg',
    dateTaken,
    dateSource: 'file',
    width: 1920,
    height: 1080,
    thumbnail: new Blob(['test'], { type: 'image/jpeg' })
  };
}
