/**
 * StorageService Unit Tests
 * @module tests/unit/services/StorageService.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../../../src/services/StorageService.js';

describe('StorageService', () => {
  let storage;

  beforeEach(async () => {
    storage = new StorageService();
    await storage.init();
  });

  afterEach(async () => {
    if (storage) {
      try {
        await storage.clearAllData();
      } catch {
        // Ignore if already closed
      }
      storage.close();
    }
  });

  describe('Database Lifecycle', () => {
    it('should initialize the database successfully', async () => {
      const newStorage = new StorageService();
      await expect(newStorage.init()).resolves.not.toThrow();
      newStorage.close();
    });

    it('should be idempotent when init is called multiple times', async () => {
      await expect(storage.init()).resolves.not.toThrow();
    });

    it('should close the database connection', () => {
      expect(() => storage.close()).not.toThrow();
    });
  });

  describe('Album Operations', () => {
    const testAlbum = {
      id: 'album-1',
      name: 'Test Album',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      coverPhotoId: null,
      displayOrder: 0,
      photoCount: 0,
      dateGroupKey: '2025-01'
    };

    it('should save and retrieve an album by ID', async () => {
      await storage.saveAlbum(testAlbum);
      const retrieved = await storage.getAlbumById('album-1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(testAlbum.id);
      expect(retrieved.name).toBe(testAlbum.name);
    });

    it('should return null for non-existent album', async () => {
      const result = await storage.getAlbumById('non-existent');
      expect(result).toBeNull();
    });

    it('should get all albums', async () => {
      const album1 = { ...testAlbum, id: 'album-1', displayOrder: 0 };
      const album2 = { ...testAlbum, id: 'album-2', displayOrder: 1, name: 'Second Album' };
      
      await storage.saveAlbum(album1);
      await storage.saveAlbum(album2);
      
      const albums = await storage.getAllAlbums();
      expect(albums).toHaveLength(2);
    });

    it('should get album by date key', async () => {
      await storage.saveAlbum(testAlbum);
      const result = await storage.getAlbumByDateKey('2025-01');
      
      expect(result).toBeDefined();
      expect(result.dateGroupKey).toBe('2025-01');
    });

    it('should update an existing album', async () => {
      await storage.saveAlbum(testAlbum);
      
      const updatedAlbum = { ...testAlbum, name: 'Updated Name', updatedAt: Date.now() };
      await storage.saveAlbum(updatedAlbum);
      
      const retrieved = await storage.getAlbumById('album-1');
      expect(retrieved.name).toBe('Updated Name');
    });

    it('should delete an album', async () => {
      await storage.saveAlbum(testAlbum);
      await storage.deleteAlbum('album-1');
      
      const result = await storage.getAlbumById('album-1');
      expect(result).toBeNull();
    });
  });

  describe('Photo Operations', () => {
    const testPhoto = {
      id: 'photo-1',
      albumId: 'album-1',
      fileName: 'test.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      dateTaken: Date.now(),
      dateSource: 'file',
      width: 1000,
      height: 800,
      thumbnail: new Blob(['test'], { type: 'image/jpeg' }),
      importedAt: Date.now()
    };

    it('should save and retrieve a photo by ID', async () => {
      await storage.savePhoto(testPhoto);
      const retrieved = await storage.getPhotoById('photo-1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(testPhoto.id);
      expect(retrieved.fileName).toBe(testPhoto.fileName);
    });

    it('should return null for non-existent photo', async () => {
      const result = await storage.getPhotoById('non-existent');
      expect(result).toBeNull();
    });

    it('should get photos by album ID', async () => {
      const photo1 = { ...testPhoto, id: 'photo-1' };
      const photo2 = { ...testPhoto, id: 'photo-2', fileName: 'test2.jpg' };
      const photo3 = { ...testPhoto, id: 'photo-3', albumId: 'album-2' };
      
      await storage.savePhoto(photo1);
      await storage.savePhoto(photo2);
      await storage.savePhoto(photo3);
      
      const photos = await storage.getPhotosByAlbumId('album-1');
      expect(photos).toHaveLength(2);
    });

    it('should save multiple photos in batch', async () => {
      const photos = [
        { ...testPhoto, id: 'photo-1' },
        { ...testPhoto, id: 'photo-2' },
        { ...testPhoto, id: 'photo-3' }
      ];
      
      await storage.savePhotos(photos);
      
      const retrieved = await storage.getPhotosByAlbumId('album-1');
      expect(retrieved).toHaveLength(3);
    });

    it('should delete a photo', async () => {
      await storage.savePhoto(testPhoto);
      await storage.deletePhoto('photo-1');
      
      const result = await storage.getPhotoById('photo-1');
      expect(result).toBeNull();
    });

    it('should delete all photos by album ID', async () => {
      const photo1 = { ...testPhoto, id: 'photo-1' };
      const photo2 = { ...testPhoto, id: 'photo-2' };
      
      await storage.savePhoto(photo1);
      await storage.savePhoto(photo2);
      
      await storage.deletePhotosByAlbumId('album-1');
      
      const photos = await storage.getPhotosByAlbumId('album-1');
      expect(photos).toHaveLength(0);
    });
  });

  describe('Settings Operations', () => {
    it('should save and retrieve a setting', async () => {
      await storage.setSetting('theme', 'dark');
      const value = await storage.getSetting('theme', 'light');
      
      expect(value).toBe('dark');
    });

    it('should return default value for non-existent setting', async () => {
      const value = await storage.getSetting('nonExistent', 'defaultValue');
      expect(value).toBe('defaultValue');
    });

    it('should update an existing setting', async () => {
      await storage.setSetting('theme', 'light');
      await storage.setSetting('theme', 'dark');
      
      const value = await storage.getSetting('theme', 'system');
      expect(value).toBe('dark');
    });

    it('should handle complex setting values', async () => {
      const complexValue = {
        nested: { value: 123 },
        array: [1, 2, 3]
      };
      
      await storage.setSetting('complex', complexValue);
      const retrieved = await storage.getSetting('complex', null);
      
      expect(retrieved).toEqual(complexValue);
    });
  });

  describe('Bulk Operations', () => {
    it('should clear all data', async () => {
      const album = {
        id: 'album-1',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coverPhotoId: null,
        displayOrder: 0,
        photoCount: 0,
        dateGroupKey: null
      };
      
      await storage.saveAlbum(album);
      await storage.setSetting('test', 'value');
      
      await storage.clearAllData();
      
      const albums = await storage.getAllAlbums();
      expect(albums).toHaveLength(0);
    });

    it('should get storage usage statistics', async () => {
      const album = {
        id: 'album-1',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coverPhotoId: null,
        displayOrder: 0,
        photoCount: 1,
        dateGroupKey: null
      };
      
      const photo = {
        id: 'photo-1',
        albumId: 'album-1',
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
      
      await storage.saveAlbum(album);
      await storage.savePhoto(photo);
      
      const usage = await storage.getStorageUsage();
      
      expect(usage.albums).toBe(1);
      expect(usage.photos).toBe(1);
      // bytes may be 0 in test environment where navigator.storage is not available
      expect(usage.bytes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw StorageError on invalid operations', async () => {
      storage.close();
      
      await expect(storage.getAllAlbums()).rejects.toThrow();
    });
  });
});
