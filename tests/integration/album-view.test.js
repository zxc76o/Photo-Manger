/**
 * Album View Integration Tests
 * @module tests/integration/album-view.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../../src/services/StorageService.js';
import { AlbumService } from '../../src/services/AlbumService.js';
import { eventBus } from '../../src/utils/eventBus.js';
import { AlbumGrid } from '../../src/components/AlbumGrid.js';
import { qs, qsa, clearElement } from '../../src/utils/dom.js';

describe('Album View Integration', () => {
  let storage;
  let albumService;
  let container;

  beforeEach(async () => {
    // Set up DOM
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    // Set up services
    storage = new StorageService();
    await storage.init();
    albumService = new AlbumService(storage, eventBus);
    eventBus.clear();
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

  describe('AlbumGrid Rendering', () => {
    it('should render empty state when no albums exist', async () => {
      const grid = new AlbumGrid({
        albumService,
        container,
        onAlbumClick: vi.fn()
      });
      
      await grid.render();
      
      const emptyState = qs('.empty-state', container);
      expect(emptyState).not.toBeNull();
    });

    it('should render album cards for each album', async () => {
      // Create test albums
      await albumService.createAlbum('Album 1');
      await albumService.createAlbum('Album 2');
      await albumService.createAlbum('Album 3');
      
      const grid = new AlbumGrid({
        albumService,
        container,
        onAlbumClick: vi.fn()
      });
      
      await grid.render();
      
      const cards = qsa('.album-card', container);
      expect(cards).toHaveLength(3);
    });

    it('should display album name on card', async () => {
      await albumService.createAlbum('My Vacation');
      
      const grid = new AlbumGrid({
        albumService,
        container,
        onAlbumClick: vi.fn()
      });
      
      await grid.render();
      
      const card = qs('.album-card', container);
      expect(card.textContent).toContain('My Vacation');
    });

    it('should display photo count on card', async () => {
      const album = await albumService.createAlbum('With Photos');
      await albumService.updatePhotoCount(album.id, 42);
      
      const grid = new AlbumGrid({
        albumService,
        container,
        onAlbumClick: vi.fn()
      });
      
      await grid.render();
      
      const card = qs('.album-card', container);
      expect(card.textContent).toContain('42');
    });
  });

  describe('Album Click Interaction', () => {
    it('should call onAlbumClick when album is clicked', async () => {
      const album = await albumService.createAlbum('Clickable');
      const onAlbumClick = vi.fn();
      
      const grid = new AlbumGrid({
        albumService,
        container,
        onAlbumClick
      });
      
      await grid.render();
      
      const card = qs('.album-card', container);
      card.click();
      
      expect(onAlbumClick).toHaveBeenCalledWith(album.id);
    });

    it('should support keyboard activation with Enter', async () => {
      const album = await albumService.createAlbum('Keyboard Nav');
      const onAlbumClick = vi.fn();
      
      const grid = new AlbumGrid({
        albumService,
        container,
        onAlbumClick
      });
      
      await grid.render();
      
      const card = qs('.album-card', container);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      card.dispatchEvent(event);
      
      expect(onAlbumClick).toHaveBeenCalledWith(album.id);
    });
  });

  describe('Dynamic Updates', () => {
    it('should refresh when album is created', async () => {
      const grid = new AlbumGrid({
        albumService,
        container,
        onAlbumClick: vi.fn()
      });
      
      await grid.render();
      expect(qsa('.album-card', container)).toHaveLength(0);
      
      // Create album and trigger refresh
      await albumService.createAlbum('New Album');
      await grid.refresh();
      
      expect(qsa('.album-card', container)).toHaveLength(1);
    });
  });
});
