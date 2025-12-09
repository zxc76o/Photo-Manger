/**
 * AlbumService Unit Tests
 * @module tests/unit/services/AlbumService.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlbumService } from '../../../src/services/AlbumService.js';
import { StorageService } from '../../../src/services/StorageService.js';
import { eventBus, EVENTS } from '../../../src/utils/eventBus.js';

describe('AlbumService', () => {
  let storage;
  let albumService;

  beforeEach(async () => {
    storage = new StorageService();
    await storage.init();
    albumService = new AlbumService(storage, eventBus);
    eventBus.clear();
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

  describe('listAlbums', () => {
    it('should return empty array when no albums exist', async () => {
      const albums = await albumService.listAlbums();
      expect(albums).toEqual([]);
    });

    it('should return all albums sorted by displayOrder', async () => {
      // Create test albums
      await albumService.createAlbum('Album A');
      await albumService.createAlbum('Album B');
      await albumService.createAlbum('Album C');

      const albums = await albumService.listAlbums();
      
      expect(albums).toHaveLength(3);
      expect(albums[0].name).toBe('Album A');
      expect(albums[1].name).toBe('Album B');
      expect(albums[2].name).toBe('Album C');
    });

    it('should return albums sorted by date ascending', async () => {
      const album1 = await albumService.createAlbum('March', '2025-03');
      const album2 = await albumService.createAlbum('January', '2025-01');
      const album3 = await albumService.createAlbum('February', '2025-02');

      const albums = await albumService.listAlbums('date-asc');
      
      expect(albums[0].name).toBe('January');
      expect(albums[1].name).toBe('February');
      expect(albums[2].name).toBe('March');
    });

    it('should return albums sorted by date descending', async () => {
      await albumService.createAlbum('January', '2025-01');
      await albumService.createAlbum('March', '2025-03');
      await albumService.createAlbum('February', '2025-02');

      const albums = await albumService.listAlbums('date-desc');
      
      expect(albums[0].name).toBe('March');
      expect(albums[1].name).toBe('February');
      expect(albums[2].name).toBe('January');
    });

    it('should include cover thumbnail in album summary', async () => {
      const album = await albumService.createAlbum('With Cover');
      
      // Simulate adding a photo with cover
      const thumbnail = new Blob(['test'], { type: 'image/jpeg' });
      const photo = {
        id: 'photo-1',
        albumId: album.id,
        fileName: 'test.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        dateTaken: Date.now(),
        dateSource: 'file',
        width: 100,
        height: 100,
        thumbnail,
        importedAt: Date.now()
      };
      await storage.savePhoto(photo);
      
      // Set as cover
      await albumService.setCoverPhoto(album.id, photo.id);
      
      const albums = await albumService.listAlbums();
      // Verify thumbnail exists (may be Blob or object with data in fake-indexeddb)
      expect(albums[0].coverThumbnail).toBeTruthy();
    });
  });

  describe('getAlbum', () => {
    it('should return album details by ID', async () => {
      const created = await albumService.createAlbum('Test Album');
      
      const album = await albumService.getAlbum(created.id);
      
      expect(album).not.toBeNull();
      expect(album.id).toBe(created.id);
      expect(album.name).toBe('Test Album');
    });

    it('should return null for non-existent album', async () => {
      const album = await albumService.getAlbum('non-existent');
      expect(album).toBeNull();
    });

    it('should include all album detail fields', async () => {
      const created = await albumService.createAlbum('Detailed Album', '2025-01');
      
      const album = await albumService.getAlbum(created.id);
      
      expect(album).toHaveProperty('id');
      expect(album).toHaveProperty('name');
      expect(album).toHaveProperty('createdAt');
      expect(album).toHaveProperty('updatedAt');
      expect(album).toHaveProperty('coverThumbnail');
      expect(album).toHaveProperty('photoCount');
      expect(album).toHaveProperty('displayOrder');
      expect(album).toHaveProperty('dateGroupKey');
    });
  });

  describe('createAlbum', () => {
    it('should create album with name', async () => {
      const album = await albumService.createAlbum('New Album');
      
      expect(album.id).toBeDefined();
      expect(album.name).toBe('New Album');
      expect(album.photoCount).toBe(0);
    });

    it('should create album with date group key', async () => {
      const album = await albumService.createAlbum('January 2025', '2025-01');
      
      expect(album.dateGroupKey).toBe('2025-01');
    });

    it('should assign incremental display order', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');
      
      expect(album1.displayOrder).toBe(0);
      expect(album2.displayOrder).toBe(1);
      expect(album3.displayOrder).toBe(2);
    });

    it('should emit album:created event', async () => {
      const handler = vi.fn();
      eventBus.on(EVENTS.ALBUM_CREATED, handler);
      
      await albumService.createAlbum('Event Test');
      
      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('name', 'Event Test');
    });

    it('should trim whitespace from name', async () => {
      const album = await albumService.createAlbum('  Trimmed Name  ');
      expect(album.name).toBe('Trimmed Name');
    });
  });

  describe('setCoverPhoto', () => {
    it('should set album cover photo', async () => {
      const album = await albumService.createAlbum('Cover Test');
      
      await albumService.setCoverPhoto(album.id, 'photo-123');
      
      const updated = await albumService.getAlbum(album.id);
      expect(updated.coverPhotoId).toBe('photo-123');
    });

    it('should emit album:updated event', async () => {
      const album = await albumService.createAlbum('Cover Event');
      const handler = vi.fn();
      eventBus.on(EVENTS.ALBUM_UPDATED, handler);
      
      await albumService.setCoverPhoto(album.id, 'photo-123');
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('findOrCreateAlbumByDateKey', () => {
    it('should create new album if date key does not exist', async () => {
      const album = await albumService.findOrCreateAlbumByDateKey('2025-01', 'January 2025');
      
      expect(album.dateGroupKey).toBe('2025-01');
      expect(album.name).toBe('January 2025');
    });

    it('should return existing album if date key exists', async () => {
      const original = await albumService.findOrCreateAlbumByDateKey('2025-01', 'January 2025');
      const found = await albumService.findOrCreateAlbumByDateKey('2025-01', 'Different Name');
      
      expect(found.id).toBe(original.id);
      expect(found.name).toBe('January 2025'); // Original name preserved
    });
  });

  describe('updatePhotoCount', () => {
    it('should update album photo count', async () => {
      const album = await albumService.createAlbum('Count Test');
      
      await albumService.updatePhotoCount(album.id, 5);
      
      const updated = await albumService.getAlbum(album.id);
      expect(updated.photoCount).toBe(5);
    });

    it('should increment photo count', async () => {
      const album = await albumService.createAlbum('Increment Test');
      
      await albumService.incrementPhotoCount(album.id);
      await albumService.incrementPhotoCount(album.id);
      
      const updated = await albumService.getAlbum(album.id);
      expect(updated.photoCount).toBe(2);
    });

    it('should decrement photo count', async () => {
      const album = await albumService.createAlbum('Decrement Test');
      await albumService.updatePhotoCount(album.id, 5);
      
      await albumService.decrementPhotoCount(album.id);
      
      const updated = await albumService.getAlbum(album.id);
      expect(updated.photoCount).toBe(4);
    });

    it('should not go below zero', async () => {
      const album = await albumService.createAlbum('Zero Test');
      
      await albumService.decrementPhotoCount(album.id);
      
      const updated = await albumService.getAlbum(album.id);
      expect(updated.photoCount).toBe(0);
    });
  });

  describe('reorderAlbum', () => {
    it('should move album to new position', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');

      // Move album3 to position 0 (before First)
      await albumService.reorderAlbum(album3.id, 0);

      const albums = await albumService.listAlbums();
      expect(albums[0].name).toBe('Third');
      expect(albums[1].name).toBe('First');
      expect(albums[2].name).toBe('Second');
    });

    it('should move album from start to end', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');

      // Move album1 to position 2 (after Third)
      await albumService.reorderAlbum(album1.id, 2);

      const albums = await albumService.listAlbums();
      expect(albums[0].name).toBe('Second');
      expect(albums[1].name).toBe('Third');
      expect(albums[2].name).toBe('First');
    });

    it('should move album to middle position', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');
      const album4 = await albumService.createAlbum('Fourth');

      // Move album4 to position 1 (after First)
      await albumService.reorderAlbum(album4.id, 1);

      const albums = await albumService.listAlbums();
      expect(albums[0].name).toBe('First');
      expect(albums[1].name).toBe('Fourth');
      expect(albums[2].name).toBe('Second');
      expect(albums[3].name).toBe('Third');
    });

    it('should emit album:reordered event', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');

      const handler = vi.fn();
      eventBus.on(EVENTS.ALBUM_REORDERED, handler);

      await albumService.reorderAlbum(album2.id, 0);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('albumId', album2.id);
      expect(handler.mock.calls[0][0]).toHaveProperty('newPosition', 0);
    });

    it('should persist order across sessions', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');

      await albumService.reorderAlbum(album3.id, 0);

      // Create new service instance (simulate reload)
      const newAlbumService = new AlbumService(storage, eventBus);
      const albums = await newAlbumService.listAlbums();

      expect(albums[0].name).toBe('Third');
      expect(albums[1].name).toBe('First');
      expect(albums[2].name).toBe('Second');
    });

    it('should handle invalid album ID gracefully', async () => {
      await albumService.createAlbum('First');

      // Should not throw
      await expect(
        albumService.reorderAlbum('non-existent', 0)
      ).resolves.not.toThrow();
    });

    it('should clamp position to valid range', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');

      // Try to move to position 100 (should clamp to 2)
      await albumService.reorderAlbum(album1.id, 100);

      const albums = await albumService.listAlbums();
      expect(albums[2].name).toBe('First');
    });

    it('should handle negative position', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');

      // Try to move to position -1 (should clamp to 0)
      await albumService.reorderAlbum(album3.id, -1);

      const albums = await albumService.listAlbums();
      expect(albums[0].name).toBe('Third');
    });

    it('should keep album in place when moved to same position', async () => {
      const album1 = await albumService.createAlbum('First');
      const album2 = await albumService.createAlbum('Second');
      const album3 = await albumService.createAlbum('Third');

      // Move album2 to position 1 (same position)
      await albumService.reorderAlbum(album2.id, 1);

      const albums = await albumService.listAlbums();
      expect(albums[0].name).toBe('First');
      expect(albums[1].name).toBe('Second');
      expect(albums[2].name).toBe('Third');
    });
  });

  describe('renameAlbum', () => {
    it('should rename album', async () => {
      const album = await albumService.createAlbum('Original Name');

      await albumService.renameAlbum(album.id, 'New Name');

      const updated = await albumService.getAlbum(album.id);
      expect(updated.name).toBe('New Name');
    });

    it('should trim whitespace from new name', async () => {
      const album = await albumService.createAlbum('Original');

      await albumService.renameAlbum(album.id, '  Trimmed  ');

      const updated = await albumService.getAlbum(album.id);
      expect(updated.name).toBe('Trimmed');
    });

    it('should emit album:updated event', async () => {
      const album = await albumService.createAlbum('Original');
      const handler = vi.fn();
      eventBus.on(EVENTS.ALBUM_UPDATED, handler);

      await albumService.renameAlbum(album.id, 'Renamed');

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('name', 'Renamed');
    });

    it('should throw error for non-existent album', async () => {
      await expect(
        albumService.renameAlbum('non-existent', 'New Name')
      ).rejects.toThrow();
    });

    it('should update updatedAt timestamp', async () => {
      const album = await albumService.createAlbum('Original');
      const originalUpdatedAt = album.updatedAt;

      // Wait a bit for timestamp difference
      await new Promise(r => setTimeout(r, 10));

      await albumService.renameAlbum(album.id, 'Renamed');

      const updated = await albumService.getAlbum(album.id);
      expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('deleteAlbum', () => {
    it('should delete album', async () => {
      const album = await albumService.createAlbum('To Delete');

      await albumService.deleteAlbum(album.id);

      const deleted = await albumService.getAlbum(album.id);
      expect(deleted).toBeNull();
    });

    it('should emit album:deleted event', async () => {
      const album = await albumService.createAlbum('To Delete');
      const handler = vi.fn();
      eventBus.on(EVENTS.ALBUM_DELETED, handler);

      await albumService.deleteAlbum(album.id);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('albumId', album.id);
    });

    it('should not throw for non-existent album', async () => {
      await expect(
        albumService.deleteAlbum('non-existent')
      ).resolves.not.toThrow();
    });

    it('should remove album from list', async () => {
      const album1 = await albumService.createAlbum('Keep');
      const album2 = await albumService.createAlbum('Delete');
      const album3 = await albumService.createAlbum('Keep Too');

      await albumService.deleteAlbum(album2.id);

      const albums = await albumService.listAlbums();
      expect(albums).toHaveLength(2);
      expect(albums.map(a => a.name)).toEqual(['Keep', 'Keep Too']);
    });

    it('should handle deleting album with photos option', async () => {
      const album = await albumService.createAlbum('With Photos');
      
      // Add a photo
      const photo = {
        id: 'photo-1',
        albumId: album.id,
        fileName: 'test.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        dateTaken: Date.now(),
        dateSource: 'file',
        width: 100,
        height: 100,
        thumbnail: new Blob(['test'], { type: 'image/jpeg' }),
        importedAt: Date.now()
      };
      await storage.savePhoto(photo);

      // Delete album with photos
      await albumService.deleteAlbum(album.id, { deletePhotos: true });

      const deletedAlbum = await albumService.getAlbum(album.id);
      expect(deletedAlbum).toBeNull();
    });
  });
});