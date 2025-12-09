/**
 * Album Reordering Integration Tests
 * Tests drag-and-drop album reordering
 * @module tests/integration/album-reorder.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../../src/services/StorageService.js';
import { AlbumService } from '../../src/services/AlbumService.js';
import { eventBus, EVENTS } from '../../src/utils/eventBus.js';

describe('Album Reordering', () => {
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

  it('should reorder albums and persist across page reload', async () => {
    // Create albums
    const album1 = await albumService.createAlbum('Album A');
    const album2 = await albumService.createAlbum('Album B');
    const album3 = await albumService.createAlbum('Album C');

    // Verify initial order
    let albums = await albumService.listAlbums();
    expect(albums.map(a => a.name)).toEqual(['Album A', 'Album B', 'Album C']);

    // Drag Album C to first position
    await albumService.reorderAlbum(album3.id, 0);

    // Verify new order
    albums = await albumService.listAlbums();
    expect(albums.map(a => a.name)).toEqual(['Album C', 'Album A', 'Album B']);

    // Simulate page reload (new service instance)
    const freshAlbumService = new AlbumService(storage, eventBus);
    albums = await freshAlbumService.listAlbums();
    expect(albums.map(a => a.name)).toEqual(['Album C', 'Album A', 'Album B']);
  });

  it('should emit reordered event with correct data', async () => {
    const album1 = await albumService.createAlbum('First');
    const album2 = await albumService.createAlbum('Second');
    const album3 = await albumService.createAlbum('Third');

    const handler = vi.fn();
    eventBus.on(EVENTS.ALBUM_REORDERED, handler);

    await albumService.reorderAlbum(album3.id, 0);

    expect(handler).toHaveBeenCalledWith({
      albumId: album3.id,
      newPosition: 0
    });
  });

  it('should handle multiple reorder operations', async () => {
    const album1 = await albumService.createAlbum('A');
    const album2 = await albumService.createAlbum('B');
    const album3 = await albumService.createAlbum('C');
    const album4 = await albumService.createAlbum('D');

    // Move D to first
    await albumService.reorderAlbum(album4.id, 0);
    let albums = await albumService.listAlbums();
    expect(albums.map(a => a.name)).toEqual(['D', 'A', 'B', 'C']);

    // Move A to last
    await albumService.reorderAlbum(album1.id, 3);
    albums = await albumService.listAlbums();
    expect(albums.map(a => a.name)).toEqual(['D', 'B', 'C', 'A']);

    // Move C to second
    await albumService.reorderAlbum(album3.id, 1);
    albums = await albumService.listAlbums();
    expect(albums.map(a => a.name)).toEqual(['D', 'C', 'B', 'A']);
  });

  it('should maintain other album properties after reorder', async () => {
    const album = await albumService.createAlbum('Test Album', '2025-01');
    await albumService.updatePhotoCount(album.id, 10);

    const album2 = await albumService.createAlbum('Another Album');

    await albumService.reorderAlbum(album2.id, 0);

    const albums = await albumService.listAlbums();
    const testAlbum = albums.find(a => a.id === album.id);

    expect(testAlbum.name).toBe('Test Album');
    expect(testAlbum.dateGroupKey).toBe('2025-01');
    expect(testAlbum.photoCount).toBe(10);
  });

  it('should update album grid after reorder event', async () => {
    const album1 = await albumService.createAlbum('First');
    const album2 = await albumService.createAlbum('Second');

    let refreshCalled = false;
    
    // Simulate AlbumGrid listening for reorder events
    eventBus.on(EVENTS.ALBUM_REORDERED, async () => {
      refreshCalled = true;
    });

    await albumService.reorderAlbum(album2.id, 0);

    expect(refreshCalled).toBe(true);
  });
});
