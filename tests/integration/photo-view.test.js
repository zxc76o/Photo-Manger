/**
 * Photo View Integration Tests
 * @module tests/integration/photo-view.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../../src/services/StorageService.js';
import { AlbumService } from '../../src/services/AlbumService.js';
import { PhotoService } from '../../src/services/PhotoService.js';
import { eventBus } from '../../src/utils/eventBus.js';
import { PhotoGrid } from '../../src/components/PhotoGrid.js';
import { qs, qsa } from '../../src/utils/dom.js';

describe('Photo View Integration', () => {
  let storage;
  let albumService;
  let photoService;
  let container;
  let testAlbum;

  beforeEach(async () => {
    // Set up DOM
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    // Set up services
    storage = new StorageService();
    await storage.init();
    albumService = new AlbumService(storage, eventBus);
    photoService = new PhotoService(storage, albumService, eventBus);
    eventBus.clear();
    
    // Create a test album
    testAlbum = await albumService.createAlbum('Test Album');
  });

  afterEach(async () => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Clean up services
    if (storage) {
      try {
        await storage.clearAllData();
      } catch {
        // Ignore
      }
      storage.close();
    }
  });

  describe('PhotoGrid Rendering', () => {
    it('should render empty state when no photos exist', async () => {
      const grid = new PhotoGrid({
        photoService,
        albumId: testAlbum.id,
        container,
        onPhotoClick: vi.fn()
      });
      
      await grid.render();
      
      const emptyState = qs('.empty-state', container);
      expect(emptyState).not.toBeNull();
    });

    it('should render photo cards for each photo', async () => {
      // Add test photos
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('photo1.jpg'));
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('photo2.jpg'));
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('photo3.jpg'));
      
      const grid = new PhotoGrid({
        photoService,
        albumId: testAlbum.id,
        container,
        onPhotoClick: vi.fn()
      });
      
      await grid.render();
      
      const cards = qsa('.photo-card', container);
      expect(cards).toHaveLength(3);
    });
  });

  describe('Photo Click Interaction', () => {
    it('should call onPhotoClick when photo is clicked', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('click.jpg'));
      const onPhotoClick = vi.fn();
      
      const grid = new PhotoGrid({
        photoService,
        albumId: testAlbum.id,
        container,
        onPhotoClick
      });
      
      await grid.render();
      
      const card = qs('.photo-card', container);
      card.click();
      
      expect(onPhotoClick).toHaveBeenCalledWith(photo.id);
    });

    it('should support keyboard activation with Enter', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('key.jpg'));
      const onPhotoClick = vi.fn();
      
      const grid = new PhotoGrid({
        photoService,
        albumId: testAlbum.id,
        container,
        onPhotoClick
      });
      
      await grid.render();
      
      const card = qs('.photo-card', container);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      card.dispatchEvent(event);
      
      expect(onPhotoClick).toHaveBeenCalledWith(photo.id);
    });
  });

  describe('Selection Mode', () => {
    it('should show checkboxes in selection mode', async () => {
      await photoService.addPhoto(testAlbum.id, createMockPhotoData('select.jpg'));
      
      const grid = new PhotoGrid({
        photoService,
        albumId: testAlbum.id,
        container,
        onPhotoClick: vi.fn(),
        selectable: true
      });
      
      await grid.render();
      
      const checkbox = qs('.photo-card__checkbox', container);
      expect(checkbox).not.toBeNull();
    });

    it('should track selected photos', async () => {
      const photo1 = await photoService.addPhoto(testAlbum.id, createMockPhotoData('sel1.jpg'));
      const photo2 = await photoService.addPhoto(testAlbum.id, createMockPhotoData('sel2.jpg'));
      
      const grid = new PhotoGrid({
        photoService,
        albumId: testAlbum.id,
        container,
        onPhotoClick: vi.fn(),
        selectable: true
      });
      
      await grid.render();
      
      // Simulate selecting photos
      grid.handleSelect(photo1.id, true);
      grid.handleSelect(photo2.id, true);
      
      const selected = grid.getSelectedIds();
      expect(selected).toContain(photo1.id);
      expect(selected).toContain(photo2.id);
      expect(selected).toHaveLength(2);
    });

    it('should clear selection', async () => {
      const photo = await photoService.addPhoto(testAlbum.id, createMockPhotoData('clear.jpg'));
      
      const grid = new PhotoGrid({
        photoService,
        albumId: testAlbum.id,
        container,
        onPhotoClick: vi.fn(),
        selectable: true
      });
      
      await grid.render();
      
      grid.handleSelect(photo.id, true);
      expect(grid.getSelectedIds()).toHaveLength(1);
      
      grid.clearSelection();
      expect(grid.getSelectedIds()).toHaveLength(0);
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
