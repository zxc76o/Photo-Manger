/**
 * AlbumGrid Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AlbumGrid } from '../../../src/components/AlbumGrid.js';

describe('AlbumGrid', () => {
  let container;
  let mockAlbumService;

  const mockAlbums = [
    { id: 'album-1', name: 'Vacation', photoCount: 10, coverPhoto: null, displayOrder: 0 },
    { id: 'album-2', name: 'Family', photoCount: 5, coverPhoto: null, displayOrder: 1 },
    { id: 'album-3', name: 'Work', photoCount: 3, coverPhoto: null, displayOrder: 2 }
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockAlbumService = {
      listAlbums: vi.fn().mockResolvedValue(mockAlbums)
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('context menu support', () => {
    it('should call onContextMenu when right-clicking an album card', async () => {
      const onContextMenu = vi.fn();
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onContextMenu
      });

      await grid.render();

      const albumItem = container.querySelector('[data-album-id="album-1"]');
      expect(albumItem).toBeTruthy();

      // Simulate right-click
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: 100,
        clientY: 200
      });
      albumItem.dispatchEvent(event);

      expect(onContextMenu).toHaveBeenCalledWith('album-1', 100, 200);
    });

    it('should not call onContextMenu when right-clicking outside album cards', async () => {
      const onContextMenu = vi.fn();
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onContextMenu
      });

      await grid.render();

      const gridElement = container.querySelector('.album-grid');
      
      // Simulate right-click on grid background
      const event = new MouseEvent('contextmenu', {
        bubbles: false,
        clientX: 100,
        clientY: 200
      });
      gridElement.dispatchEvent(event);

      expect(onContextMenu).not.toHaveBeenCalled();
    });

    it('should prevent default context menu on album cards', async () => {
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onContextMenu: vi.fn()
      });

      await grid.render();

      const albumItem = container.querySelector('[data-album-id="album-1"]');
      
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200
      });
      albumItem.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should not add context menu listener if onContextMenu is not provided', async () => {
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn()
      });

      await grid.render();

      const gridElement = container.querySelector('.album-grid');
      const albumItem = container.querySelector('[data-album-id="album-1"]');
      
      // Dispatch should not throw or cause issues
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: 100,
        clientY: 200
      });
      
      // This should not throw
      expect(() => albumItem.dispatchEvent(event)).not.toThrow();
    });

    it('should remove context menu listener on destroy', async () => {
      const onContextMenu = vi.fn();
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onContextMenu
      });

      await grid.render();
      
      const gridElement = container.querySelector('.album-grid');
      const spy = vi.spyOn(gridElement, 'removeEventListener');
      
      grid.destroy();

      expect(spy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });
  });

  describe('rendering', () => {
    it('should render album cards', async () => {
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn()
      });

      await grid.render();

      const cards = container.querySelectorAll('.album-grid__item');
      expect(cards).toHaveLength(3);
    });

    it('should show empty state when no albums', async () => {
      mockAlbumService.listAlbums.mockResolvedValue([]);
      
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn()
      });

      await grid.render();

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should store album id in data attribute', async () => {
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn()
      });

      await grid.render();

      const items = container.querySelectorAll('.album-grid__item');
      expect(items[0].dataset.albumId).toBe('album-1');
      expect(items[1].dataset.albumId).toBe('album-2');
      expect(items[2].dataset.albumId).toBe('album-3');
    });
  });

  describe('keyboard reordering', () => {
    it('should call onReorder with Alt+ArrowLeft', async () => {
      const onReorder = vi.fn();
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onReorder
      });

      await grid.render();

      const secondCard = container.querySelector('[data-album-id="album-2"] .album-card');
      secondCard.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        altKey: true,
        bubbles: true
      });
      secondCard.dispatchEvent(event);

      expect(onReorder).toHaveBeenCalledWith('album-2', 0);
    });

    it('should call onReorder with Alt+ArrowRight', async () => {
      const onReorder = vi.fn();
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onReorder
      });

      await grid.render();

      const firstCard = container.querySelector('[data-album-id="album-1"] .album-card');
      firstCard.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        altKey: true,
        bubbles: true
      });
      firstCard.dispatchEvent(event);

      expect(onReorder).toHaveBeenCalledWith('album-1', 1);
    });

    it('should not go below index 0 with Alt+ArrowLeft', async () => {
      const onReorder = vi.fn();
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onReorder
      });

      await grid.render();

      const firstCard = container.querySelector('[data-album-id="album-1"] .album-card');
      firstCard.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        altKey: true,
        bubbles: true
      });
      firstCard.dispatchEvent(event);

      // Should not call because already at position 0
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should not exceed max index with Alt+ArrowRight', async () => {
      const onReorder = vi.fn();
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn(),
        onReorder
      });

      await grid.render();

      const lastCard = container.querySelector('[data-album-id="album-3"] .album-card');
      lastCard.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        altKey: true,
        bubbles: true
      });
      lastCard.dispatchEvent(event);

      // Should not call because already at last position
      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should re-render with updated data', async () => {
      const grid = new AlbumGrid({
        albumService: mockAlbumService,
        container,
        onAlbumClick: vi.fn()
      });

      await grid.render();
      expect(container.querySelectorAll('.album-grid__item')).toHaveLength(3);

      // Update mock to return different data
      mockAlbumService.listAlbums.mockResolvedValue([mockAlbums[0]]);
      
      await grid.refresh();
      expect(container.querySelectorAll('.album-grid__item')).toHaveLength(1);
    });
  });
});
